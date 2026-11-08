import 'dart:convert';
import '../models/paper_width.dart';
import '../models/receipt_payload.dart';

/// Compiled ESC/POS output containing raw printer bytes and human-readable preview lines.
class CompiledEscPosJob {
  const CompiledEscPosJob({
    required this.bytes,
    required this.previewLines,
    required this.paperWidth,
    required this.charactersPerLine,
  });

  final List<int> bytes;
  final List<String> previewLines;
  final PaperWidth paperWidth;
  final int charactersPerLine;
}

/// Pure ESC/POS byte compiler that translates web-defined layout instructions
/// (`lines` blocks, `rawText`, `rawBase64`, or `rawBytes`) into thermal printer commands.
class EscPosEncoderService {
  static const List<int> _cmdInit = [0x1B, 0x40]; // ESC @
  static const List<int> _cmdCodePagePc437 = [0x1B, 0x74, 0x00]; // ESC t 0
  static const List<int> _cmdAlignLeft = [0x1B, 0x61, 0x00]; // ESC a 0
  static const List<int> _cmdAlignCenter = [0x1B, 0x61, 0x01]; // ESC a 1
  static const List<int> _cmdAlignRight = [0x1B, 0x61, 0x02]; // ESC a 2
  static const List<int> _cmdBoldOn = [0x1B, 0x45, 0x01]; // ESC E 1
  static const List<int> _cmdBoldOff = [0x1B, 0x45, 0x00]; // ESC E 0
  static const List<int> _cmdUnderlineOn = [0x1B, 0x2D, 0x01]; // ESC - 1
  static const List<int> _cmdUnderlineOff = [0x1B, 0x2D, 0x00]; // ESC - 0
  static const List<int> _cmdSizeNormal = [0x1D, 0x21, 0x00]; // GS ! 0
  static const List<int> _cmdSizeDoubleHeight = [0x1D, 0x21, 0x01]; // GS ! 1
  static const List<int> _cmdSizeDoubleWidth = [0x1D, 0x21, 0x10]; // GS ! 16
  static const List<int> _cmdSizeLarge = [0x1D, 0x21, 0x11]; // GS ! 17
  static const List<int> _cmdCutPartial = [0x1D, 0x56, 0x42, 0x03]; // GS V 66 3
  static const List<int> _cmdOpenCashDrawer = [
    0x1B,
    0x70,
    0x00,
    0x19,
    0xFA,
  ]; // ESC p 0 25 250

  /// Compiles a web [ReceiptPayload] into ESC/POS bytes and plain-text preview lines.
  CompiledEscPosJob compile({
    required ReceiptPayload payload,
    PaperWidth defaultPaperWidth = PaperWidth.mm58,
    bool defaultAutoCut = true,
    bool defaultOpenCashDrawer = false,
  }) {
    final paperWidth = payload.paperWidthOverride ?? defaultPaperWidth;
    final cols =
        payload.charactersPerLineOverride ?? paperWidth.charactersPerLine;

    // 1. Raw byte array pass-through mode
    if (payload.rawBytes != null && payload.rawBytes!.isNotEmpty) {
      return CompiledEscPosJob(
        bytes: payload.rawBytes!,
        previewLines: [
          _centerText('[RAW ESC/POS BYTE ARRAY]', cols),
          _centerText('${payload.rawBytes!.length} bytes', cols),
        ],
        paperWidth: paperWidth,
        charactersPerLine: cols,
      );
    }

    // 2. Raw Base64 pass-through mode
    if (payload.rawBase64 != null && payload.rawBase64!.isNotEmpty) {
      final rawBytes = base64Decode(payload.rawBase64!);
      return CompiledEscPosJob(
        bytes: rawBytes,
        previewLines: [
          _centerText('[RAW ESC/POS BASE64 STREAM]', cols),
          _centerText('${rawBytes.length} bytes', cols),
        ],
        paperWidth: paperWidth,
        charactersPerLine: cols,
      );
    }

    final bytes = <int>[];
    final preview = <String>[];

    bytes.addAll(_cmdInit);
    bytes.addAll(_cmdCodePagePc437);

    final shouldOpenDrawer = payload.openCashDrawer ?? defaultOpenCashDrawer;
    if (shouldOpenDrawer) {
      bytes.addAll(_cmdOpenCashDrawer);
    }

    void writeTextBlock(
      String text, {
      String align = 'left',
      bool bold = false,
      bool underline = false,
      String size = 'normal',
    }) {
      final alignCode = align == 'center'
          ? 1
          : align == 'right'
              ? 2
              : 0;
      bytes.addAll(
        alignCode == 1
            ? _cmdAlignCenter
            : alignCode == 2
                ? _cmdAlignRight
                : _cmdAlignLeft,
      );

      if (bold) bytes.addAll(_cmdBoldOn);
      if (underline) bytes.addAll(_cmdUnderlineOn);

      final isDoubleWidth = size == 'double_width' || size == 'large';
      if (size == 'large') {
        bytes.addAll(_cmdSizeLarge);
      } else if (size == 'double_height') {
        bytes.addAll(_cmdSizeDoubleHeight);
      } else if (size == 'double_width') {
        bytes.addAll(_cmdSizeDoubleWidth);
      } else {
        bytes.addAll(_cmdSizeNormal);
      }

      final effectiveCols = isDoubleWidth ? (cols ~/ 2) : cols;
      for (final rawParagraph in text.split('\n')) {
        final wrapped = _wrapText(_sanitizeAscii(rawParagraph), effectiveCols);
        for (final line in wrapped) {
          bytes.addAll(ascii.encode(line));
          bytes.add(0x0A);

          if (alignCode == 1) {
            preview.add(_centerText(line, cols));
          } else if (alignCode == 2) {
            preview.add(_rightText(line, cols));
          } else {
            preview.add(line);
          }
        }
      }

      if (bold) bytes.addAll(_cmdBoldOff);
      if (underline) bytes.addAll(_cmdUnderlineOff);
      if (size != 'normal') bytes.addAll(_cmdSizeNormal);
    }

    // 3. Raw pre-formatted text mode from web
    if (payload.rawText != null &&
        payload.rawText!.isNotEmpty &&
        payload.customLines.isEmpty) {
      writeTextBlock(payload.rawText!);
    } else {
      // 4. Declarative Web Layout Blocks (`lines`)
      var hasExplicitCut = false;
      for (final block in payload.customLines) {
        switch (block.type) {
          case 'divider':
          case 'line':
          case 'hr':
            writeTextBlock(block.dividerChar * cols);
          case 'feed':
            for (var i = 0; i < block.feedLines; i++) {
              bytes.add(0x0A);
              preview.add('');
            }
          case 'row':
          case 'key_value':
            final isDoubleW =
                block.size == 'double_width' || block.size == 'large';
            final effectiveCols = isDoubleW ? (cols ~/ 2) : cols;
            final formattedRow = formatKeyValue(
              _sanitizeAscii(block.left ?? ''),
              _sanitizeAscii(block.right ?? ''),
              effectiveCols,
            );
            writeTextBlock(
              formattedRow,
              align: 'left',
              bold: block.bold,
              underline: block.underline,
              size: block.size,
            );
          case 'columns':
            if (block.columns.isNotEmpty) {
              final formattedCols = formatMultiColumns(block.columns, cols);
              writeTextBlock(
                formattedCols,
                align: 'left',
                bold: block.bold,
                underline: block.underline,
                size: block.size,
              );
            }
          case 'qr':
            if (block.qrData != null && block.qrData!.isNotEmpty) {
              bytes.addAll(
                block.align == 'left'
                    ? _cmdAlignLeft
                    : block.align == 'right'
                        ? _cmdAlignRight
                        : _cmdAlignCenter,
              );
              bytes.addAll(
                _encodeQrCodeBytes(block.qrData!, moduleSize: block.qrSize),
              );
              bytes.add(0x0A);
              preview.add(_centerText('[QR: ${block.qrData!}]', cols));
            }
          case 'barcode':
            if (block.barcodeData != null && block.barcodeData!.isNotEmpty) {
              bytes.addAll(_cmdAlignCenter);
              bytes.addAll(_encodeCode128Bytes(block.barcodeData!));
              bytes.add(0x0A);
              preview.add(
                _centerText('[BARCODE: ${block.barcodeData!}]', cols),
              );
            }
          case 'cash_drawer':
            bytes.addAll(_cmdOpenCashDrawer);
          case 'cut':
            hasExplicitCut = true;
            bytes.addAll(_cmdCutPartial);
          default:
            writeTextBlock(
              block.text,
              align: block.align,
              bold: block.bold,
              underline: block.underline,
              size: block.size,
            );
        }
      }

      if (hasExplicitCut) {
        return CompiledEscPosJob(
          bytes: bytes,
          previewLines: preview,
          paperWidth: paperWidth,
          charactersPerLine: cols,
        );
      }
    }

    // Trailing feed lines controlled by web payload
    for (var i = 0; i < payload.feedLines; i++) {
      bytes.add(0x0A);
    }
    if (payload.feedLines > 0) {
      preview.add('');
    }

    final shouldCut = payload.cutPaper ?? defaultAutoCut;
    if (shouldCut) {
      bytes.addAll(_cmdCutPartial);
    }

    return CompiledEscPosJob(
      bytes: bytes,
      previewLines: preview,
      paperWidth: paperWidth,
      charactersPerLine: cols,
    );
  }

  /// Formats a two-column key-value string padded to [width] characters.
  static String formatKeyValue(String left, String right, int width) {
    final cleanLeft = left.trimRight();
    final cleanRight = right.trim();
    const minSpacing = 1;
    final availableLeft = width - cleanRight.length - minSpacing;

    if (availableLeft <= 4) {
      return '$cleanLeft $cleanRight';
    }

    final truncatedLeft = cleanLeft.length > availableLeft
        ? cleanLeft.substring(0, availableLeft)
        : cleanLeft;
    final spaces = width - truncatedLeft.length - cleanRight.length;
    return '$truncatedLeft${' ' * spaces}$cleanRight';
  }

  /// Formats an arbitrary number of flex-weighted columns across [totalWidth] chars.
  static String formatMultiColumns(
    List<WebPrintColumn> columns,
    int totalWidth,
  ) {
    final totalFlex = columns.fold<int>(0, (sum, c) => sum + c.flex);
    if (totalFlex <= 0) return '';

    final buffer = StringBuffer();
    var remainingWidth = totalWidth;

    for (var i = 0; i < columns.length; i++) {
      final col = columns[i];
      final isLast = i == columns.length - 1;
      final colWidth = isLast
          ? remainingWidth
          : ((totalWidth * col.flex) / totalFlex).floor().clamp(1, remainingWidth);
      remainingWidth -= colWidth;

      final clean = _sanitizeAscii(col.text).trim();
      final clipped =
          clean.length > colWidth ? clean.substring(0, colWidth) : clean;

      if (col.align == 'right') {
        buffer.write(clipped.padLeft(colWidth));
      } else if (col.align == 'center') {
        final leftPad = (colWidth - clipped.length) ~/ 2;
        final rightPad = colWidth - clipped.length - leftPad;
        buffer.write('${' ' * leftPad}$clipped${' ' * rightPad}');
      } else {
        buffer.write(clipped.padRight(colWidth));
      }
    }

    return buffer.toString();
  }

  static List<String> _wrapText(String text, int maxWidth) {
    if (text.isEmpty) return [''];
    final words = text.split(RegExp(r'\s+'));
    final lines = <String>[];
    var currentLine = '';

    for (final word in words) {
      if (word.length > maxWidth) {
        if (currentLine.isNotEmpty) {
          lines.add(currentLine);
          currentLine = '';
        }
        var start = 0;
        while (start < word.length) {
          final end =
              (start + maxWidth < word.length) ? start + maxWidth : word.length;
          lines.add(word.substring(start, end));
          start = end;
        }
      } else if (currentLine.isEmpty) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxWidth) {
        currentLine = '$currentLine $word';
      } else {
        lines.add(currentLine);
        currentLine = word;
      }
    }

    if (currentLine.isNotEmpty) {
      lines.add(currentLine);
    }

    return lines.isEmpty ? [''] : lines;
  }

  static String _centerText(String text, int width) {
    if (text.length >= width) return text.substring(0, width);
    final leftPad = (width - text.length) ~/ 2;
    return '${' ' * leftPad}$text';
  }

  static String _rightText(String text, int width) {
    if (text.length >= width) return text.substring(0, width);
    final leftPad = width - text.length;
    return '${' ' * leftPad}$text';
  }

  static String _sanitizeAscii(String input) {
    final buffer = StringBuffer();
    for (final rune in input.runes) {
      if (rune >= 0x20 && rune <= 0x7E) {
        buffer.writeCharCode(rune);
      } else if (rune == 0x2013 || rune == 0x2014) {
        buffer.write('-');
      } else {
        buffer.write(' ');
      }
    }
    return buffer.toString();
  }

  static List<int> _encodeQrCodeBytes(String data, {int moduleSize = 5}) {
    final contentBytes = ascii.encode(_sanitizeAscii(data));
    final storeLen = contentBytes.length + 3;
    final pL = storeLen & 0xFF;
    final pH = (storeLen >> 8) & 0xFF;

    return <int>[
      0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
      0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize.clamp(3, 8),
      0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31,
      0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30,
      ...contentBytes,
      0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30,
    ];
  }

  static List<int> _encodeCode128Bytes(String data) {
    final contentBytes = ascii.encode(_sanitizeAscii(data));
    return <int>[
      0x1D, 0x68, 0x50, // GS h 80 (barcode height)
      0x1D, 0x77, 0x02, // GS w 2 (barcode width)
      0x1D, 0x6B, 0x49, contentBytes.length + 2, 0x7B, 0x42, // Code128 Subset B
      ...contentBytes,
    ];
  }
}
