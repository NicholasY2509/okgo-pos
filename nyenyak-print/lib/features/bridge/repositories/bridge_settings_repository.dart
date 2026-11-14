import 'package:shared_preferences/shared_preferences.dart';
import '../models/bridge_config.dart';
import '../models/paper_width.dart';

/// Persists bridge configuration and last-used Bluetooth printer settings.
class BridgeSettingsRepository {
  static const String _keyPort = 'nyenyak_print_port';
  static const String _keyBindAll = 'nyenyak_print_bind_all';
  static const String _keyPaperWidth = 'nyenyak_print_paper_width';
  static const String _keyAutoCut = 'nyenyak_print_auto_cut';
  static const String _keyCashDrawer = 'nyenyak_print_cash_drawer';
  static const String _keySavedMac = 'nyenyak_print_saved_mac';
  static const String _keySavedName = 'nyenyak_print_saved_name';

  Future<BridgeConfig> loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final port = prefs.getInt(_keyPort) ?? BridgeConfig.defaultPort;
    final bindAll = prefs.getBool(_keyBindAll) ?? false;
    final paperWidthKey = prefs.getString(_keyPaperWidth);
    final autoCut = prefs.getBool(_keyAutoCut) ?? true;
    final cashDrawer = prefs.getBool(_keyCashDrawer) ?? false;
    final savedMac = prefs.getString(_keySavedMac);
    final savedName = prefs.getString(_keySavedName);

    return BridgeConfig(
      port: port,
      bindAllInterfaces: bindAll,
      paperWidth: PaperWidth.fromKey(paperWidthKey),
      autoCut: autoCut,
      openCashDrawerByDefault: cashDrawer,
      savedPrinterMac: savedMac,
      savedPrinterName: savedName,
    );
  }

  Future<void> saveConfig(BridgeConfig config) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyPort, config.port);
    await prefs.setBool(_keyBindAll, config.bindAllInterfaces);
    await prefs.setString(_keyPaperWidth, config.paperWidth.key);
    await prefs.setBool(_keyAutoCut, config.autoCut);
    await prefs.setBool(_keyCashDrawer, config.openCashDrawerByDefault);

    if (config.savedPrinterMac != null && config.savedPrinterMac!.isNotEmpty) {
      await prefs.setString(_keySavedMac, config.savedPrinterMac!);
    } else {
      await prefs.remove(_keySavedMac);
    }

    if (config.savedPrinterName != null &&
        config.savedPrinterName!.isNotEmpty) {
      await prefs.setString(_keySavedName, config.savedPrinterName!);
    } else {
      await prefs.remove(_keySavedName);
    }
  }
}

