import 'paper_width.dart';

/// Column definition inside a multi-column web layout block (`type: "columns"`).
class WebPrintColumn {
  const WebPrintColumn({
    required this.text,
    this.flex = 1,
    this.align = 'left',
  });

  final String text;
  final int flex;
  final String align;

  factory WebPrintColumn.fromJson(Map<String, dynamic> json) {
    final parsedFlex = _parseNum(json['flex'] ?? json['width'] ?? 1).toInt();
    return WebPrintColumn(
      text: (json['text'] ?? '').toString(),
      flex: parsedFlex <= 0 ? 1 : parsedFlex,
      align: (json['align'] ?? 'left').toString().toLowerCase(),
    );
  }

  Map<String, dynamic> toJson() => {
        'text': text,
        'flex': flex,
        'align': align,
      };
}

/// Web-defined layout directive block.
///
/// Allows the web application to control 100% of the receipt layout without
/// changing the Flutter bridge app.
///
/// Supported `type` values:
/// - `"text"`: `{ "type": "text", "text": "...", "align": "left|center|right", "bold": true, "underline": false, "size": "normal|double_height|double_width|large" }`
/// - `"row"` / `"key_value"`: `{ "type": "row", "left": "Subtotal", "right": "Rp 350.000", "bold": true, "size": "normal" }`
/// - `"columns"`: `{ "type": "columns", "columns": [{ "text": "1x Reflexology", "flex": 7, "align": "left" }, { "text": "Rp 245.000", "flex": 5, "align": "right" }], "bold": false }`
/// - `"divider"`: `{ "type": "divider", "char": "-" }`
/// - `"feed"`: `{ "type": "feed", "lines": 2 }`
/// - `"qr"`: `{ "type": "qr", "data": "https://...", "size": 5, "align": "center" }`
/// - `"barcode"`: `{ "type": "barcode", "data": "INV20261104" }`
/// - `"cut"`: `{ "type": "cut" }`
/// - `"cash_drawer"`: `{ "type": "cash_drawer" }`
class CustomReceiptLine {
  const CustomReceiptLine({
    this.type = 'text',
    this.text = '',
    this.left,
    this.right,
    this.columns = const [],
    this.align = 'left',
    this.bold = false,
    this.underline = false,
    this.size = 'normal',
    this.dividerChar = '-',
    this.feedLines = 1,
    this.qrData,
    this.qrSize = 5,
    this.barcodeData,
  });

  final String type;
  final String text;
  final String? left;
  final String? right;
  final List<WebPrintColumn> columns;
  final String align;
  final bool bold;
  final bool underline;
  final String size;
  final String dividerChar;
  final int feedLines;
  final String? qrData;
  final int qrSize;
  final String? barcodeData;

  bool get isDivider => type == 'divider' || type == 'line' || type == 'hr';

  factory CustomReceiptLine.fromJson(Map<String, dynamic> json) {
    final rawCols = json['columns'] ?? json['cols'];
    final cols = rawCols is List
        ? rawCols
            .whereType<Map<String, dynamic>>()
            .map(WebPrintColumn.fromJson)
            .toList()
        : const <WebPrintColumn>[];

    // Infer block type if omitted
    String resolvedType = (json['type'] ?? '').toString().trim().toLowerCase();
    if (resolvedType.isEmpty) {
      if (json['isDivider'] == true) {
        resolvedType = 'divider';
      } else if (cols.isNotEmpty) {
        resolvedType = 'columns';
      } else if (json['left'] != null || json['right'] != null) {
        resolvedType = 'row';
      } else if (json['qrData'] != null || json['qr'] != null) {
        resolvedType = 'qr';
      } else if (json['barcodeData'] != null || json['barcode'] != null) {
        resolvedType = 'barcode';
      } else {
        resolvedType = 'text';
      }
    }

    String resolvedSize = (json['size'] ?? '').toString().trim().toLowerCase();
    if (resolvedSize.isEmpty) {
      if (json['doubleSize'] == true || json['large'] == true) {
        resolvedSize = 'large';
      } else if (json['doubleHeight'] == true) {
        resolvedSize = 'double_height';
      } else if (json['doubleWidth'] == true) {
        resolvedSize = 'double_width';
      } else {
        resolvedSize = 'normal';
      }
    }

    final rawChar = (json['char'] ?? json['character'] ?? '-').toString();

    return CustomReceiptLine(
      type: resolvedType,
      text: (json['text'] ?? json['value'] ?? '').toString(),
      left: _nullableString(json['left']),
      right: _nullableString(json['right']),
      columns: cols,
      align: (json['align'] ?? 'left').toString().toLowerCase(),
      bold: json['bold'] == true,
      underline: json['underline'] == true,
      size: resolvedSize,
      dividerChar: rawChar.isEmpty ? '-' : rawChar[0],
      feedLines: _parseNum(json['lines'] ?? json['count'] ?? 1).toInt().clamp(1, 20),
      qrData: _nullableString(json['qrData'] ?? json['qr'] ?? json['data']),
      qrSize: _parseNum(json['qrSize'] ?? json['size'] ?? 5).toInt().clamp(3, 8),
      barcodeData: _nullableString(
        json['barcodeData'] ?? json['barcode'] ?? json['data'],
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'type': type,
        if (text.isNotEmpty) 'text': text,
        if (left != null) 'left': left,
        if (right != null) 'right': right,
        if (columns.isNotEmpty)
          'columns': columns.map((c) => c.toJson()).toList(),
        'align': align,
        if (bold) 'bold': bold,
        if (underline) 'underline': underline,
        if (size != 'normal') 'size': size,
        if (isDivider) 'char': dividerChar,
        if (type == 'feed') 'lines': feedLines,
        if (qrData != null) 'data': qrData,
        if (barcodeData != null) 'barcode': barcodeData,
      };
}

/// Complete print job payload sent from the web application to `POST /print` or `WS /ws`.
///
/// All layout, paper width, formatting, cutting, and cash drawer instructions are
/// driven by the web payload; the Flutter app acts strictly as a hardware bridge.
class ReceiptPayload {
  const ReceiptPayload({
    this.jobTitle,
    this.paperWidthOverride,
    this.charactersPerLineOverride,
    this.customLines = const [],
    this.rawText,
    this.rawBase64,
    this.rawBytes,
    this.openCashDrawer,
    this.cutPaper,
    this.feedLines = 3,
  });

  /// Optional job identifier or invoice number for the bridge activity log.
  final String? jobTitle;

  /// Paper width specified by the web page (`"58mm"` or `"80mm"`).
  final PaperWidth? paperWidthOverride;

  /// Explicit character-per-line width specified by the web page (e.g. `32`, `42`, `48`).
  final int? charactersPerLineOverride;

  /// Web-defined layout blocks (`lines` / `commands` / `elements`).
  final List<CustomReceiptLine> customLines;

  /// Pre-formatted plain-text receipt string built on the web page.
  final String? rawText;

  /// Raw ESC/POS command stream encoded as Base64 from the web page.
  final String? rawBase64;

  /// Raw ESC/POS byte array (`[27, 64, ...]`) sent from the web page.
  final List<int>? rawBytes;

  /// Whether to kick the RJ11 cash drawer (`ESC p`).
  final bool? openCashDrawer;

  /// Whether to send a paper cut command (`GS V`) at the end of the job.
  final bool? cutPaper;

  /// Number of trailing line feeds before cutting.
  final int feedLines;

  String? get receiptNumber => jobTitle;

  factory ReceiptPayload.fromJson(Map<String, dynamic> json) {
    final rawLines = json['lines'] ?? json['commands'] ?? json['elements'] ?? json['customLines'];
    final parsedLines = rawLines is List
        ? rawLines
            .whereType<Map<String, dynamic>>()
            .map(CustomReceiptLine.fromJson)
            .toList()
        : const <CustomReceiptLine>[];

    List<int>? parsedRawBytes;
    if (json['rawBytes'] is List) {
      parsedRawBytes = (json['rawBytes'] as List)
          .map((e) => _parseNum(e).toInt() & 0xFF)
          .toList();
    }

    int? customCols;
    if (json['charactersPerLine'] != null || json['cols'] != null) {
      final parsedCols =
          _parseNum(json['charactersPerLine'] ?? json['cols']).toInt();
      if (parsedCols >= 16 && parsedCols <= 96) {
        customCols = parsedCols;
      }
    }

    PaperWidth? widthOverride;
    if (json['paperWidth'] != null) {
      widthOverride = PaperWidth.fromKey(json['paperWidth'].toString());
    } else if (customCols != null && customCols >= 42) {
      widthOverride = PaperWidth.mm80;
    }

    return ReceiptPayload(
      jobTitle: _nullableString(
        json['jobTitle'] ??
            json['receiptNumber'] ??
            json['invoiceNumber'] ??
            json['id'],
      ),
      paperWidthOverride: widthOverride,
      charactersPerLineOverride: customCols,
      customLines: parsedLines,
      rawText: _nullableString(json['rawText'] ?? json['text']),
      rawBase64: _nullableString(json['rawBase64']),
      rawBytes: parsedRawBytes,
      openCashDrawer:
          json['openCashDrawer'] is bool ? json['openCashDrawer'] as bool : null,
      cutPaper: json['cutPaper'] is bool ? json['cutPaper'] as bool : null,
      feedLines: _parseNum(json['feedLines'] ?? 3).toInt().clamp(0, 15),
    );
  }

  /// Creates a hardware connection test slip using the web-driven `lines` DSL.
  factory ReceiptPayload.sample({PaperWidth? paperWidth}) {
    final width = paperWidth ?? PaperWidth.mm58;
    return ReceiptPayload(
      jobTitle: 'TEST-BRIDGE-01',
      paperWidthOverride: width,
      cutPaper: true,
      openCashDrawer: false,
      customLines: const [
        CustomReceiptLine(
          type: 'text',
          text: 'NYENYAK PRINT BRIDGE',
          align: 'center',
          bold: true,
          size: 'double_height',
        ),
        CustomReceiptLine(
          type: 'text',
          text: 'Web-to-Bluetooth ESC/POS Bridge',
          align: 'center',
        ),
        CustomReceiptLine(type: 'divider', dividerChar: '='),
        CustomReceiptLine(
          type: 'row',
          left: 'Status Bridge',
          right: 'READY',
          bold: true,
        ),
        CustomReceiptLine(
          type: 'row',
          left: 'Mode Layout',
          right: 'Web-Controlled JSON',
        ),
        CustomReceiptLine(type: 'divider', dividerChar: '-'),
        CustomReceiptLine(
          type: 'columns',
          bold: true,
          columns: [
            WebPrintColumn(text: 'Item', flex: 6, align: 'left'),
            WebPrintColumn(text: 'Qty', flex: 2, align: 'center'),
            WebPrintColumn(text: 'Total', flex: 4, align: 'right'),
          ],
        ),
        CustomReceiptLine(type: 'divider', dividerChar: '-'),
        CustomReceiptLine(
          type: 'columns',
          columns: [
            WebPrintColumn(text: 'Reflexology 90m', flex: 6, align: 'left'),
            WebPrintColumn(text: '1', flex: 2, align: 'center'),
            WebPrintColumn(text: '245.000', flex: 4, align: 'right'),
          ],
        ),
        CustomReceiptLine(
          type: 'columns',
          columns: [
            WebPrintColumn(text: 'Ginger Tea', flex: 6, align: 'left'),
            WebPrintColumn(text: '2', flex: 2, align: 'center'),
            WebPrintColumn(text: '50.000', flex: 4, align: 'right'),
          ],
        ),
        CustomReceiptLine(type: 'divider', dividerChar: '-'),
        CustomReceiptLine(
          type: 'row',
          left: 'TOTAL',
          right: 'Rp 295.000',
          bold: true,
          size: 'double_height',
        ),
        CustomReceiptLine(type: 'divider', dividerChar: '-'),
        CustomReceiptLine(
          type: 'qr',
          qrData: 'https://nyenyak.id/bridge-ok',
          align: 'center',
        ),
        CustomReceiptLine(
          type: 'text',
          text: 'Layout diatur sepenuhnya dari Web POS',
          align: 'center',
        ),
      ],
    );
  }

  Map<String, dynamic> toJson() => {
        if (jobTitle != null) 'jobTitle': jobTitle,
        if (paperWidthOverride != null) 'paperWidth': paperWidthOverride!.key,
        if (charactersPerLineOverride != null)
          'charactersPerLine': charactersPerLineOverride,
        if (customLines.isNotEmpty)
          'lines': customLines.map((e) => e.toJson()).toList(),
        if (rawText != null) 'rawText': rawText,
        if (rawBase64 != null) 'rawBase64': rawBase64,
        if (rawBytes != null) 'rawBytes': rawBytes,
        if (openCashDrawer != null) 'openCashDrawer': openCashDrawer,
        if (cutPaper != null) 'cutPaper': cutPaper,
        'feedLines': feedLines,
      };
}

num _parseNum(Object? value) {
  if (value is num) return value;
  if (value is String) {
    final cleaned = value.replaceAll(RegExp(r'[^0-9.-]'), '');
    return num.tryParse(cleaned) ?? 0;
  }
  return 0;
}

String? _nullableString(Object? value) {
  if (value == null) return null;
  final trimmed = value.toString().trim();
  return trimmed.isEmpty ? null : trimmed;
}
