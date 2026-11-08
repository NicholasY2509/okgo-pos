import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../models/print_job_log.dart';
import '../models/receipt_payload.dart';

/// Result returned by the controller when handling an incoming bridge print request.
class BridgePrintDispatchResult {
  const BridgePrintDispatchResult({
    required this.success,
    required this.jobLog,
    this.errorMessage,
  });

  final bool success;
  final PrintJobLog jobLog;
  final String? errorMessage;

  Map<String, dynamic> toJson() => {
        'success': success,
        'jobId': jobLog.id,
        'status': jobLog.status.name,
        'printerName': jobLog.printerName,
        'paperWidth': jobLog.paperWidth.key,
        'byteCount': jobLog.byteCount,
        'previewLines': jobLog.previewLines,
        if (errorMessage != null) 'error': errorMessage,
      };
}

typedef BridgeStatusProvider = Map<String, dynamic> Function();
typedef BridgePrintDispatcher = Future<BridgePrintDispatchResult> Function(
  ReceiptPayload payload,
  PrintJobSource source,
);

/// Local HTTP and WebSocket server allowing web browsers to trigger ESC/POS printing.
class LocalBridgeServerService {
  HttpServer? _server;
  final Set<WebSocket> _sockets = <WebSocket>{};

  bool get isRunning => _server != null;
  int? get boundPort => _server?.port;
  int get activeWebSocketCount => _sockets.length;

  /// Starts the HTTP/WebSocket bridge server on `127.0.0.1` or `0.0.0.0`.
  Future<void> start({
    required int port,
    required bool bindAllInterfaces,
    required BridgeStatusProvider onStatusRequest,
    required BridgePrintDispatcher onPrintRequest,
    required void Function() onClientsChanged,
  }) async {
    await stop();

    final address = bindAllInterfaces
        ? InternetAddress.anyIPv4
        : InternetAddress.loopbackIPv4;

    final server = await HttpServer.bind(address, port, shared: true);
    _server = server;

    server.listen(
      (HttpRequest request) async {
        _applyCorsHeaders(request.response);

        if (request.method == 'OPTIONS') {
          request.response.statusCode = HttpStatus.noContent;
          await request.response.close();
          return;
        }

        final path = request.uri.path;

        // WebSocket upgrade at /ws
        if (path == '/ws' && WebSocketTransformer.isUpgradeRequest(request)) {
          await _handleWebSocketUpgrade(
            request: request,
            onStatusRequest: onStatusRequest,
            onPrintRequest: onPrintRequest,
            onClientsChanged: onClientsChanged,
          );
          return;
        }

        if (request.method == 'GET' && (path == '/' || path == '/status')) {
          final statusPayload = onStatusRequest();
          await _writeJsonResponse(
            request.response,
            HttpStatus.ok,
            statusPayload,
          );
          return;
        }

        if (request.method == 'POST' && path == '/test-print') {
          final result = await onPrintRequest(
            ReceiptPayload.sample(),
            PrintJobSource.http,
          );
          await _writeJsonResponse(
            request.response,
            result.success ? HttpStatus.ok : HttpStatus.badGateway,
            result.toJson(),
          );
          return;
        }

        if (request.method == 'POST' && path == '/print') {
          try {
            final bodyText = await utf8.decoder.bind(request).join();
            final decoded = bodyText.trim().isEmpty
                ? <String, dynamic>{}
                : jsonDecode(bodyText);

            if (decoded is! Map<String, dynamic>) {
              await _writeJsonResponse(
                request.response,
                HttpStatus.badRequest,
                {'success': false, 'error': 'Expected a JSON object body.'},
              );
              return;
            }

            final payload = ReceiptPayload.fromJson(decoded);
            final result = await onPrintRequest(payload, PrintJobSource.http);
            await _writeJsonResponse(
              request.response,
              result.success ? HttpStatus.ok : HttpStatus.ok,
              result.toJson(),
            );
          } catch (error) {
            await _writeJsonResponse(
              request.response,
              HttpStatus.badRequest,
              {
                'success': false,
                'error': 'Invalid print payload: $error',
              },
            );
          }
          return;
        }

        await _writeJsonResponse(
          request.response,
          HttpStatus.notFound,
          {
            'success': false,
            'error': 'Unknown endpoint $path. Available: GET /status, POST /print, POST /test-print, WS /ws',
          },
        );
      },
      onError: (_) {},
    );
  }

  /// Broadcasts a status event to all connected WebSocket clients.
  void broadcastStatus(Map<String, dynamic> statusPayload) {
    if (_sockets.isEmpty) return;
    final encoded = jsonEncode({
      'event': 'status',
      'data': statusPayload,
    });
    for (final socket in _sockets.toList()) {
      try {
        socket.add(encoded);
      } catch (_) {
        _sockets.remove(socket);
      }
    }
  }

  /// Stops the HTTP server and closes any open WebSocket connections.
  Future<void> stop() async {
    for (final socket in _sockets.toList()) {
      try {
        await socket.close();
      } catch (_) {}
    }
    _sockets.clear();

    final current = _server;
    _server = null;
    if (current != null) {
      await current.close(force: true);
    }
  }

  Future<void> _handleWebSocketUpgrade({
    required HttpRequest request,
    required BridgeStatusProvider onStatusRequest,
    required BridgePrintDispatcher onPrintRequest,
    required void Function() onClientsChanged,
  }) async {
    try {
      final socket = await WebSocketTransformer.upgrade(request);
      _sockets.add(socket);
      onClientsChanged();

      // Send initial status snapshot upon connection
      socket.add(
        jsonEncode({
          'event': 'status',
          'data': onStatusRequest(),
        }),
      );

      socket.listen(
        (dynamic message) async {
          try {
            final parsed = jsonDecode(message.toString());
            if (parsed is! Map<String, dynamic>) return;

            final action = (parsed['action'] ?? 'print').toString();
            if (action == 'status') {
              socket.add(
                jsonEncode({
                  'event': 'status',
                  'data': onStatusRequest(),
                }),
              );
              return;
            }

            if (action == 'print') {
              final rawPayload = parsed['payload'] is Map<String, dynamic>
                  ? parsed['payload'] as Map<String, dynamic>
                  : parsed;
              final payload = ReceiptPayload.fromJson(rawPayload);
              final result = await onPrintRequest(
                payload,
                PrintJobSource.webSocket,
              );
              socket.add(
                jsonEncode({
                  'event': 'print_result',
                  'data': result.toJson(),
                }),
              );
            }
          } catch (error) {
            socket.add(
              jsonEncode({
                'event': 'error',
                'error': error.toString(),
              }),
            );
          }
        },
        onDone: () {
          _sockets.remove(socket);
          onClientsChanged();
        },
        onError: (_) {
          _sockets.remove(socket);
          onClientsChanged();
        },
      );
    } catch (_) {}
  }

  void _applyCorsHeaders(HttpResponse response) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, Authorization, X-Requested-With',
    );
    // Required by Chrome Private Network Access when calling 127.0.0.1 from an HTTPS origin
    response.headers.set('Access-Control-Allow-Private-Network', 'true');
    response.headers.contentType = ContentType.json;
  }

  Future<void> _writeJsonResponse(
    HttpResponse response,
    int statusCode,
    Map<String, dynamic> body,
  ) async {
    response.statusCode = statusCode;
    response.write(jsonEncode(body));
    await response.close();
  }
}
