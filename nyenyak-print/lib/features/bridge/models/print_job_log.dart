import 'paper_width.dart';
import 'receipt_payload.dart';

/// Delivery outcome of a print job.
enum PrintJobStatus {
  printed,
  previewOnly,
  failed,
}

/// Origin channel of the print job.
enum PrintJobSource {
  http,
  webSocket,
  testButton,
}

/// Audit log entry for an incoming print job in the bridge session.
class PrintJobLog {
  const PrintJobLog({
    required this.id,
    required this.timestamp,
    required this.source,
    required this.status,
    required this.receiptNumber,
    required this.printerName,
    required this.paperWidth,
    required this.byteCount,
    required this.previewLines,
    required this.payload,
    this.errorMessage,
  });

  final String id;
  final DateTime timestamp;
  final PrintJobSource source;
  final PrintJobStatus status;
  final String receiptNumber;
  final String printerName;
  final PaperWidth paperWidth;
  final int byteCount;
  final List<String> previewLines;
  final ReceiptPayload payload;
  final String? errorMessage;

  String get sourceLabel {
    switch (source) {
      case PrintJobSource.http:
        return 'HTTP POST';
      case PrintJobSource.webSocket:
        return 'WebSocket';
      case PrintJobSource.testButton:
        return 'Test Print';
    }
  }
}

