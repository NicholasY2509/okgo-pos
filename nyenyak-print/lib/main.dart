import 'package:flutter/material.dart';
import 'core/theme/nyenyak_theme.dart';
import 'features/bridge/controllers/bridge_controller.dart';
import 'features/bridge/presentation/pages/bridge_dashboard_page.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NyenyakPrintApp());
}

/// Root widget for the Nyenyak Print ESC/POS thermal printer bridge application.
class NyenyakPrintApp extends StatefulWidget {
  const NyenyakPrintApp({
    super.key,
    this.controller,
  });

  final BridgeController? controller;

  @override
  State<NyenyakPrintApp> createState() => _NyenyakPrintAppState();
}

class _NyenyakPrintAppState extends State<NyenyakPrintApp> {
  late final BridgeController _controller;
  late final bool _ownsController;
  ThemeMode _themeMode = ThemeMode.dark;

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    _controller = widget.controller ?? BridgeController();
    if (_ownsController) {
      _controller.initialize();
    }
  }

  @override
  void dispose() {
    if (_ownsController) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _toggleTheme() {
    setState(() {
      _themeMode =
          _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nyenyak Print Bridge',
      debugShowCheckedModeBanner: false,
      theme: NyenyakTheme.light(),
      darkTheme: NyenyakTheme.dark(),
      themeMode: _themeMode,
      home: BridgeDashboardPage(
        controller: _controller,
        themeMode: _themeMode,
        onToggleTheme: _toggleTheme,
      ),
    );
  }
}
