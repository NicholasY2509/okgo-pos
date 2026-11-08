import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/nyenyak_tokens.dart';

/// Displays copy-ready JavaScript integration examples showing how the Web POS
/// controls 100% of the receipt layout, paper width, and hardware commands.
class WebIntegrationDialog extends StatelessWidget {
  const WebIntegrationDialog({
    super.key,
    required this.port,
  });

  final int port;

  String get _fetchSnippet => '''
// The Web App controls 100% of the print layout, paper width, and ESC/POS options.
// Nyenyak Print only acts as a local HTTP/WebSocket-to-Bluetooth bridge.
async function printFromWebToBridge() {
  const response = await fetch("http://127.0.0.1:$port/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobTitle: "INV-20261104-0042",
      paperWidth: "58mm",        // Controlled from Web: "58mm" (32 cols) or "80mm" (48 cols)
      charactersPerLine: 32,     // Optional explicit character width override (e.g. 32, 42, 48)
      cutPaper: true,            // Controlled from Web
      openCashDrawer: false,     // Controlled from Web
      feedLines: 3,              // Trailing blank lines before cut
      lines: [
        { type: "text", text: "NYENYAK REFLEXOLOGY", align: "center", bold: true, size: "double_height" },
        { type: "text", text: "Jl. Senopati No. 88, Jakarta", align: "center" },
        { type: "divider", char: "=" },
        { type: "row", left: "No. Struk", right: "INV-20261104-0042" },
        { type: "row", left: "Kasir", right: "Rina" },
        { type: "divider", char: "-" },
        {
          type: "columns",
          bold: true,
          columns: [
            { text: "Layanan", flex: 6, align: "left" },
            { text: "Qty", flex: 2, align: "center" },
            { text: "Total", flex: 4, align: "right" }
          ]
        },
        {
          type: "columns",
          columns: [
            { text: "Reflexology 90m", flex: 6, align: "left" },
            { text: "1", flex: 2, align: "center" },
            { text: "245.000", flex: 4, align: "right" }
          ]
        },
        { type: "divider", char: "-" },
        { type: "row", left: "TOTAL", right: "Rp 245.000", bold: true, size: "double_height" },
        { type: "feed", lines: 1 },
        { type: "qr", data: "https://nyenyak.id/inv/42", size: 5, align: "center" },
        { type: "text", text: "Terima kasih atas kunjungan Anda", align: "center" }
      ]
    }),
  });

  return await response.json();
}''';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final media = MediaQuery.of(context);
    final isShort = media.size.height < 520;
    final isNarrow = media.size.width < 460;
    final pad =
        isShort || isNarrow ? NyenyakTokens.space4 : NyenyakTokens.space6;

    return Dialog(
      insetPadding: EdgeInsets.symmetric(
        horizontal: isNarrow ? NyenyakTokens.space3 : NyenyakTokens.space6,
        vertical: isShort ? NyenyakTokens.space3 : NyenyakTokens.space6,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusXl),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 660),
        child: Padding(
          padding: EdgeInsets.all(pad),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.code_rounded,
                    color: NyenyakTokens.primary,
                  ),
                  const SizedBox(width: NyenyakTokens.space2),
                  Expanded(
                    child: Text(
                      'Kontrak API Layout Web ke Nyenyak Print Bridge',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: NyenyakTokens.space1),
              Text(
                'HTTP: http://127.0.0.1:$port/print  ·  Status: GET /status  ·  WS: ws://127.0.0.1:$port/ws',
                style: theme.textTheme.bodySmall,
              ),
              SizedBox(
                height: isShort ? NyenyakTokens.space2 : NyenyakTokens.space4,
              ),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.all(NyenyakTokens.space3),
                  decoration: BoxDecoration(
                    color: isDark
                        ? NyenyakTokens.darkBackground
                        : NyenyakTokens.lightMuted,
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                    border: Border.all(
                      color: isDark
                          ? NyenyakTokens.darkBorder
                          : NyenyakTokens.lightBorder,
                    ),
                  ),
                  child: SingleChildScrollView(
                    child: SelectableText(
                      _fetchSnippet,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11.5,
                        height: 1.45,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(
                height: isShort ? NyenyakTokens.space3 : NyenyakTokens.space4,
              ),
              Wrap(
                alignment: WrapAlignment.end,
                spacing: NyenyakTokens.space3,
                runSpacing: NyenyakTokens.space2,
                children: [
                  OutlinedButton.icon(
                    onPressed: () async {
                      await Clipboard.setData(
                        ClipboardData(text: _fetchSnippet),
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content:
                                Text('Kode integrasi disalin ke clipboard.'),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    label: const Text('Salin Snippet JS'),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(100, 40),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Tutup'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
