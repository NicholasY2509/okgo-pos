import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:nyenyak_print/features/bridge/models/paper_width.dart';
import 'package:nyenyak_print/features/bridge/models/print_job_log.dart';
import 'package:nyenyak_print/features/bridge/models/receipt_payload.dart';
import 'package:nyenyak_print/features/bridge/services/esc_pos_encoder_service.dart';
import 'package:nyenyak_print/features/bridge/services/local_bridge_server_service.dart';

void main() {
  group('EscPosEncoderService (Web-Controlled Layout)', () {
    final encoder = EscPosEncoderService();

    test('compiles web-defined 58mm (32 cols) lines with ESC @ init, QR, and partial cut', () {
      final sample = ReceiptPayload.sample(paperWidth: PaperWidth.mm58);
      final compiled = encoder.compile(payload: sample);

      expect(compiled.paperWidth, PaperWidth.mm58);
      expect(compiled.charactersPerLine, 32);
      expect(compiled.bytes.length, greaterThan(100));

      // Starts with ESC @ (0x1B, 0x40)
      expect(compiled.bytes[0], 0x1B);
      expect(compiled.bytes[1], 0x40);

      // Ends with GS V 66 3 partial cut (0x1D, 0x56, 0x42, 0x03)
      final len = compiled.bytes.length;
      expect(compiled.bytes.sublist(len - 4), [0x1D, 0x56, 0x42, 0x03]);

      for (final line in compiled.previewLines) {
        expect(line.length, lessThanOrEqualTo(32));
      }
    });

    test('compiles web-defined 80mm (48 cols) multi-column layout', () {
      final payload = ReceiptPayload.fromJson({
        'jobTitle': 'INV-20261104-0042',
        'paperWidth': '80mm',
        'cutPaper': false,
        'lines': [
          {
            'type': 'text',
            'text': 'NYENYAK REFLEXOLOGY',
            'align': 'center',
            'bold': true,
          },
          {
            'type': 'row',
            'left': 'No. Struk',
            'right': 'INV-20261104-0042',
          },
          {
            'type': 'columns',
            'columns': [
              {'text': 'Reflexology 90m', 'flex': 6, 'align': 'left'},
              {'text': '1', 'flex': 2, 'align': 'center'},
              {'text': 'Rp 350.000', 'flex': 4, 'align': 'right'},
            ],
          },
        ],
      });

      final compiled = encoder.compile(payload: payload);

      expect(compiled.paperWidth, PaperWidth.mm80);
      expect(compiled.charactersPerLine, 48);
      for (final line in compiled.previewLines) {
        expect(line.length, lessThanOrEqualTo(48));
      }

      final previewText = compiled.previewLines.join('\n');
      expect(previewText, contains('INV-20261104-0042'));
      expect(previewText, contains('Rp 350.000'));
    });
  });

  group('LocalBridgeServerService', () {
    late LocalBridgeServerService server;

    setUp(() {
      server = LocalBridgeServerService();
    });

    tearDown(() async {
      await server.stop();
    });

    test('serves GET /status, CORS preflight, and POST /print on loopback', () async {
      await server.start(
        port: 0,
        bindAllInterfaces: false,
        onStatusRequest: () => {
          'ok': true,
          'service': 'nyenyak-print',
        },
        onPrintRequest: (payload, source) async {
          final compiled = EscPosEncoderService().compile(payload: payload);
          return BridgePrintDispatchResult(
            success: true,
            jobLog: PrintJobLog(
              id: 'JOB-TEST-1',
              timestamp: DateTime.now(),
              source: source,
              status: PrintJobStatus.printed,
              receiptNumber: payload.receiptNumber ?? 'INV-TEST',
              printerName: 'Mock Thermal Printer',
              paperWidth: compiled.paperWidth,
              byteCount: compiled.bytes.length,
              previewLines: compiled.previewLines,
              payload: payload,
            ),
          );
        },
        onClientsChanged: () {},
      );

      final boundPort = server.boundPort!;
      final client = HttpClient();

      // 1. OPTIONS preflight verifies CORS + Private Network Access
      final optionsReq = await client.openUrl(
        'OPTIONS',
        Uri.parse('http://127.0.0.1:$boundPort/print'),
      );
      final optionsRes = await optionsReq.close();
      expect(optionsRes.statusCode, HttpStatus.noContent);
      expect(
        optionsRes.headers.value('access-control-allow-private-network'),
        'true',
      );
      expect(optionsRes.headers.value('access-control-allow-origin'), '*');

      // 2. GET /status
      final statusReq = await client.getUrl(
        Uri.parse('http://127.0.0.1:$boundPort/status'),
      );
      final statusRes = await statusReq.close();
      final statusBody =
          jsonDecode(await utf8.decoder.bind(statusRes).join())
              as Map<String, dynamic>;
      expect(statusRes.statusCode, HttpStatus.ok);
      expect(statusBody['ok'], true);
      expect(statusBody['service'], 'nyenyak-print');

      // 3. POST /print with Web-Controlled lines payload
      final printReq = await client.postUrl(
        Uri.parse('http://127.0.0.1:$boundPort/print'),
      );
      printReq.headers.contentType = ContentType.json;
      printReq.write(
        jsonEncode({
          'jobTitle': 'INV-9001',
          'paperWidth': '58mm',
          'cutPaper': true,
          'lines': [
            {'type': 'text', 'text': 'NYENYAK', 'align': 'center', 'bold': true},
            {'type': 'row', 'left': 'Total', 'right': 'Rp 180.000', 'bold': true},
          ],
        }),
      );
      final printRes = await printReq.close();
      final printBody =
          jsonDecode(await utf8.decoder.bind(printRes).join())
              as Map<String, dynamic>;
      expect(printRes.statusCode, HttpStatus.ok);
      expect(printBody['success'], true);
      expect(printBody['jobId'], 'JOB-TEST-1');
      expect(printBody['byteCount'], greaterThan(20));

      client.close();
    });
  });
}
