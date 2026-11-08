import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../models/paper_width.dart';
import '../../models/print_job_log.dart';
import '../../models/receipt_payload.dart';
import '../../services/esc_pos_encoder_service.dart';

/// Displays an authentic monospace thermal paper preview of a [PrintJobLog]
/// or the default sample receipt, scaled for phone and tablet screens.
class ThermalReceiptPreviewCard extends StatelessWidget {
  const ThermalReceiptPreviewCard({
    super.key,
    required this.selectedLog,
    required this.currentPaperWidth,
    required this.onReprint,
    required this.isPrinting,
    this.isTablet = false,
  });

  final PrintJobLog? selectedLog;
  final PaperWidth currentPaperWidth;
  final ValueChanged<PrintJobLog> onReprint;
  final bool isPrinting;
  final bool isTablet;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final effectivePaperWidth = selectedLog?.paperWidth ?? currentPaperWidth;
    final previewLines = selectedLog?.previewLines ??
        EscPosEncoderService()
            .compile(
              payload: ReceiptPayload.sample(paperWidth: currentPaperWidth),
              defaultPaperWidth: currentPaperWidth,
              defaultAutoCut: true,
              defaultOpenCashDrawer: false,
            )
            .previewLines;

    return Card(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isNarrow = constraints.maxWidth < 400;
          final pad = isTablet
              ? NyenyakTokens.space5
              : (isNarrow ? NyenyakTokens.space3 : NyenyakTokens.space4);

          final double maxSlipWidth = effectivePaperWidth == PaperWidth.mm80
              ? (isTablet ? 440 : 380)
              : (isTablet ? 330 : 295);

          final double monoFontSize = effectivePaperWidth == PaperWidth.mm80
              ? (isTablet ? 12.0 : 10.5)
              : (isTablet ? 12.5 : 11.5);

          return Padding(
            padding: EdgeInsets.all(pad),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.receipt_long_outlined,
                      size: 20,
                      color: NyenyakTokens.primary,
                    ),
                    const SizedBox(width: NyenyakTokens.space2),
                    Expanded(
                      child: Text(
                        selectedLog != null
                            ? 'Pratinjau Struk (${selectedLog!.receiptNumber})'
                            : 'Pratinjau Kertas Thermal',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontSize: isTablet ? 16.5 : 15.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: NyenyakTokens.space2),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: NyenyakTokens.primary.withValues(alpha: 0.14),
                        borderRadius:
                            BorderRadius.circular(NyenyakTokens.radiusSm),
                      ),
                      child: Text(
                        effectivePaperWidth.label,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: NyenyakTokens.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: NyenyakTokens.space4),
                Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: maxSlipWidth),
                    child: Container(
                      width: double.infinity,
                      padding: EdgeInsets.symmetric(
                        horizontal:
                            isTablet ? NyenyakTokens.space4 : NyenyakTokens.space3,
                        vertical:
                            isTablet ? NyenyakTokens.space5 : NyenyakTokens.space4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF1E1E22)
                            : const Color(0xFFFCFBF7),
                        borderRadius:
                            BorderRadius.circular(NyenyakTokens.radiusMd),
                        border: Border.all(
                          color: isDark
                              ? NyenyakTokens.darkBorder
                              : const Color(0xFFE5E0D5),
                        ),
                      ),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: SelectableText(
                          previewLines.join('\n'),
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: monoFontSize,
                            height: 1.38,
                            color: isDark
                                ? const Color(0xFFE4E4E7)
                                : const Color(0xFF18181B),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                if (selectedLog != null) ...[
                  const SizedBox(height: NyenyakTokens.space4),
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: NyenyakTokens.space3,
                    runSpacing: NyenyakTokens.space2,
                    children: [
                      Text(
                        'Ukuran stream: ${selectedLog!.byteCount} bytes · ${selectedLog!.sourceLabel}',
                        style: theme.textTheme.bodySmall,
                      ),
                      OutlinedButton.icon(
                        onPressed:
                            isPrinting ? null : () => onReprint(selectedLog!),
                        icon: const Icon(Icons.replay_outlined, size: 16),
                        label: const Text('Cetak Ulang'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
