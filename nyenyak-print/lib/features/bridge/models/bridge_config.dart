import 'paper_width.dart';

/// Persisted configuration for the local HTTP/WebSocket bridge and printer preferences.
class BridgeConfig {
  const BridgeConfig({
    this.port = defaultPort,
    this.bindAllInterfaces = false,
    this.paperWidth = PaperWidth.mm58,
    this.autoCut = true,
    this.openCashDrawerByDefault = false,
    this.savedPrinterMac,
    this.savedPrinterName,
  });

  static const int defaultPort = 9123;

  final int port;
  final bool bindAllInterfaces;
  final PaperWidth paperWidth;
  final bool autoCut;
  final bool openCashDrawerByDefault;
  final String? savedPrinterMac;
  final String? savedPrinterName;

  String get bindAddressLabel => bindAllInterfaces ? '0.0.0.0' : '127.0.0.1';

  String get httpEndpointUrl => 'http://127.0.0.1:$port/print';

  String get wsEndpointUrl => 'ws://127.0.0.1:$port/ws';

  BridgeConfig copyWith({
    int? port,
    bool? bindAllInterfaces,
    PaperWidth? paperWidth,
    bool? autoCut,
    bool? openCashDrawerByDefault,
    String? savedPrinterMac,
    String? savedPrinterName,
    bool clearSavedPrinter = false,
  }) {
    return BridgeConfig(
      port: port ?? this.port,
      bindAllInterfaces: bindAllInterfaces ?? this.bindAllInterfaces,
      paperWidth: paperWidth ?? this.paperWidth,
      autoCut: autoCut ?? this.autoCut,
      openCashDrawerByDefault:
          openCashDrawerByDefault ?? this.openCashDrawerByDefault,
      savedPrinterMac:
          clearSavedPrinter ? null : (savedPrinterMac ?? this.savedPrinterMac),
      savedPrinterName: clearSavedPrinter
          ? null
          : (savedPrinterName ?? this.savedPrinterName),
    );
  }
}

