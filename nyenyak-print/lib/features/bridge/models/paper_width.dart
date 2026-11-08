/// Thermal printer paper width specification.
enum PaperWidth {
  mm58(
    key: '58mm',
    label: '58mm (32 cols)',
    charactersPerLine: 32,
    dotsWidth: 384,
  ),
  mm80(
    key: '80mm',
    label: '80mm (48 cols)',
    charactersPerLine: 48,
    dotsWidth: 576,
  );

  const PaperWidth({
    required this.key,
    required this.label,
    required this.charactersPerLine,
    required this.dotsWidth,
  });

  final String key;
  final String label;
  final int charactersPerLine;
  final int dotsWidth;

  static PaperWidth fromKey(String? value) {
    if (value == null) return PaperWidth.mm58;
    final normalized = value.trim().toLowerCase();
    if (normalized == '80mm' || normalized == '80' || normalized == 'mm80') {
      return PaperWidth.mm80;
    }
    return PaperWidth.mm58;
  }
}

