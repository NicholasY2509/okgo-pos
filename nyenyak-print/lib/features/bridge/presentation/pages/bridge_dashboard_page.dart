import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../controllers/bridge_controller.dart';
import '../../models/bluetooth_printer_device.dart';
import '../../models/print_job_log.dart';
import '../widgets/thermal_receipt_preview_card.dart';
import '../widgets/web_integration_dialog.dart';

/// Main dashboard screen for the Nyenyak Print ESC/POS thermal printer bridge.
///
/// Adapts across all 4 device + orientation combinations:
/// 1. **Phone Portrait** (`shortestSide < 600`, portrait): Tabbed bottom navigation
///    separating `Bridge & Printer` from `Pratinjau & Antrean` so a small phone screen
///    never requires excessive vertical scrolling.
/// 2. **Phone Landscape** (`shortestSide < 600`, horizontal): Compact dual-pane split
///    view with independent scroll areas and condensed top bar.
/// 3. **Tablet Portrait** (`shortestSide >= 600`, portrait): Balanced 2-column grid
///    with tablet-scaled typography and generous touch targets.
/// 4. **Tablet Landscape** (`shortestSide >= 600`, horizontal): Full wide-screen
///    command center (`maxWidth: 1240px`) with side-by-side independent scroll panes.
class BridgeDashboardPage extends StatefulWidget {
  const BridgeDashboardPage({
    super.key,
    required this.controller,
    required this.themeMode,
    required this.onToggleTheme,
  });

  final BridgeController controller;
  final ThemeMode themeMode;
  final VoidCallback onToggleTheme;

  @override
  State<BridgeDashboardPage> createState() => _BridgeDashboardPageState();
}

class _BridgeDashboardPageState extends State<BridgeDashboardPage>
    with WidgetsBindingObserver {
  late final TextEditingController _portController;
  int _phonePortraitTabIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _portController = TextEditingController(
      text: widget.controller.config.port.toString(),
    );
    widget.controller.addListener(_syncPortField);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      widget.controller.refreshPermissionOnResume();
    }
  }

  void _syncPortField() {
    final currentPortText = widget.controller.config.port.toString();
    if (_portController.text != currentPortText &&
        !FocusScope.of(context).hasFocus) {
      _portController.text = currentPortText;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    widget.controller.removeListener(_syncPortField);
    _portController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final ctrl = widget.controller;
        final theme = Theme.of(context);
        final mediaQuery = MediaQuery.of(context);

        final isTablet =
            mediaQuery.size.shortestSide >= NyenyakTokens.phoneMaxShortestSide;
        final isLandscape = mediaQuery.orientation == Orientation.landscape;

        // Phone Portrait uses bottom navigation tabs to keep each screen focused;
        // Phone Landscape, Tablet Portrait, and Tablet Landscape show dual columns.
        final usePhonePortraitTabs = !isTablet && !isLandscape;
        final isPhoneLandscape = !isTablet && isLandscape;

        return Scaffold(
          bottomNavigationBar: usePhonePortraitTabs
              ? NavigationBar(
                  selectedIndex: _phonePortraitTabIndex,
                  height: 64,
                  onDestinationSelected: (idx) {
                    setState(() {
                      _phonePortraitTabIndex = idx;
                    });
                  },
                  destinations: [
                    const NavigationDestination(
                      icon: Icon(Icons.bluetooth_searching_rounded),
                      selectedIcon: Icon(Icons.bluetooth_connected_rounded),
                      label: 'Server & Printer',
                    ),
                    NavigationDestination(
                      icon: Badge(
                        isLabelVisible: ctrl.jobLogs.isNotEmpty,
                        label: Text('${ctrl.jobLogs.length}'),
                        child: const Icon(Icons.receipt_long_outlined),
                      ),
                      selectedIcon: Badge(
                        isLabelVisible: ctrl.jobLogs.isNotEmpty,
                        label: Text('${ctrl.jobLogs.length}'),
                        child: const Icon(Icons.receipt_long_rounded),
                      ),
                      label: 'Pratinjau & Antrean',
                    ),
                  ],
                )
              : null,
          body: SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Signature Nyenyak warm-gold top accent line
                Container(
                  height: 2.0,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        NyenyakTokens.primary,
                        NyenyakTokens.primary.withValues(alpha: 0.25),
                      ],
                    ),
                  ),
                ),
                _buildTopBar(
                  context,
                  ctrl,
                  theme,
                  isTablet: isTablet,
                  isLandscape: isLandscape,
                ),
                const Divider(height: 1),
                Expanded(
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxWidth: NyenyakTokens.tabletWorkspaceMaxWidth,
                      ),
                      child: usePhonePortraitTabs
                          ? _buildPhonePortraitWorkspace(
                              context,
                              ctrl,
                              theme,
                            )
                          : _buildDualColumnWorkspace(
                              context,
                              ctrl,
                              theme,
                              isTablet: isTablet,
                              isPhoneLandscape: isPhoneLandscape,
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Phone Portrait workspace: switches cleanly between Tab 0 (Server + Bluetooth)
  /// and Tab 1 (Receipt Preview + Print Job Queue).
  Widget _buildPhonePortraitWorkspace(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(NyenyakTokens.space3),
      child: _phonePortraitTabIndex == 0
          ? Column(
              children: [
                _buildServerCard(context, ctrl, theme, isTablet: false),
                const SizedBox(height: NyenyakTokens.space3),
                _buildPrinterCard(
                  context,
                  ctrl,
                  theme,
                  isTablet: false,
                  switchTabOnTest: true,
                ),
              ],
            )
          : Column(
              children: [
                ThermalReceiptPreviewCard(
                  selectedLog: ctrl.selectedLogForPreview,
                  currentPaperWidth: ctrl.config.paperWidth,
                  isPrinting: ctrl.isPrinting,
                  isTablet: false,
                  onReprint: (log) => _handleReprint(context, log),
                ),
                const SizedBox(height: NyenyakTokens.space3),
                _buildJobLogCard(context, ctrl, theme, isTablet: false),
              ],
            ),
    );
  }

  /// Dual-column workspace for Tablet (Portrait & Landscape) and Phone Landscape.
  Widget _buildDualColumnWorkspace(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme, {
    required bool isTablet,
    required bool isPhoneLandscape,
  }) {
    final outerPadding = isPhoneLandscape
        ? NyenyakTokens.space3
        : (isTablet ? NyenyakTokens.space6 : NyenyakTokens.space4);
    final gap = isPhoneLandscape
        ? NyenyakTokens.space3
        : (isTablet ? NyenyakTokens.space5 : NyenyakTokens.space4);

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: outerPadding),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: isTablet ? 11 : 10,
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(vertical: outerPadding),
              child: Column(
                children: [
                  _buildServerCard(context, ctrl, theme, isTablet: isTablet),
                  SizedBox(height: gap),
                  _buildPrinterCard(
                    context,
                    ctrl,
                    theme,
                    isTablet: isTablet,
                    switchTabOnTest: false,
                  ),
                ],
              ),
            ),
          ),
          SizedBox(width: gap),
          Expanded(
            flex: 10,
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(vertical: outerPadding),
              child: Column(
                children: [
                  ThermalReceiptPreviewCard(
                    selectedLog: ctrl.selectedLogForPreview,
                    currentPaperWidth: ctrl.config.paperWidth,
                    isPrinting: ctrl.isPrinting,
                    isTablet: isTablet,
                    onReprint: (log) => _handleReprint(context, log),
                  ),
                  SizedBox(height: gap),
                  _buildJobLogCard(context, ctrl, theme, isTablet: isTablet),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme, {
    required bool isTablet,
    required bool isLandscape,
  }) {
    final isDark = theme.brightness == Brightness.dark;
    final isCompactPhone = !isTablet;
    final horizontalPad =
        isTablet ? NyenyakTokens.space6 : NyenyakTokens.space3;
    final verticalPad = (!isTablet && isLandscape)
        ? NyenyakTokens.space2
        : (isTablet ? NyenyakTokens.space4 : NyenyakTokens.space3);

    return Container(
      color: theme.cardTheme.color,
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPad,
        vertical: verticalPad,
      ),
      child: Row(
        children: [
          Image.asset(
            'assets/images/logo-only.png',
            height: isTablet ? 32 : 26,
            width: isTablet ? 32 : 26,
            errorBuilder: (context, error, stackTrace) => Icon(
              Icons.print_rounded,
              color: NyenyakTokens.primary,
              size: isTablet ? 28 : 24,
            ),
          ),
          SizedBox(
            width: isTablet ? NyenyakTokens.space3 : NyenyakTokens.space2,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Nyenyak Print Bridge',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: isTablet ? 18.0 : 15.0,
                  ),
                ),
                if (isTablet)
                  Text(
                    'ESC/POS Thermal Printer Web Bridge · Mode Tablet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall,
                  ),
              ],
            ),
          ),
          const SizedBox(width: NyenyakTokens.space2),
          _buildStatusPill(
            label: ctrl.isServerRunning
                ? (isCompactPhone
                    ? ':${ctrl.config.port} AKTIF'
                    : 'HTTP :${ctrl.config.port} AKTIF')
                : (isCompactPhone ? 'NONAKTIF' : 'SERVER NONAKTIF'),
            color: ctrl.isServerRunning
                ? NyenyakTokens.success
                : NyenyakTokens.destructive,
          ),
          const SizedBox(width: NyenyakTokens.space2),
          if (isCompactPhone && !isLandscape)
            IconButton(
              tooltip: 'Kontrak API Web',
              visualDensity: VisualDensity.compact,
              onPressed: () => _openWebIntegrationDialog(context, ctrl),
              icon: const Icon(Icons.code_rounded, size: 20),
            )
          else
            OutlinedButton.icon(
              onPressed: () => _openWebIntegrationDialog(context, ctrl),
              icon: const Icon(Icons.code_rounded, size: 16),
              label: const Text('API Web'),
            ),
          SizedBox(width: isCompactPhone ? 2 : NyenyakTokens.space2),
          IconButton(
            tooltip: isDark ? 'Mode Terang' : 'Mode Gelap',
            visualDensity:
                isCompactPhone ? VisualDensity.compact : VisualDensity.standard,
            onPressed: widget.onToggleTheme,
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            ),
          ),
        ],
      ),
    );
  }

  void _openWebIntegrationDialog(BuildContext context, BridgeController ctrl) {
    showDialog<void>(
      context: context,
      builder: (_) => WebIntegrationDialog(
        port: ctrl.config.port,
      ),
    );
  }

  Widget _buildServerCard(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme, {
    required bool isTablet,
  }) {
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      child: LayoutBuilder(
        builder: (context, cardConstraints) {
          final isNarrowCard = cardConstraints.maxWidth < 460;
          final pad = isTablet
              ? NyenyakTokens.space5
              : (isNarrowCard ? NyenyakTokens.space4 : NyenyakTokens.space5);

          return Padding(
            padding: EdgeInsets.all(pad),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.hub_outlined,
                      size: 20,
                      color: NyenyakTokens.primary,
                    ),
                    const SizedBox(width: NyenyakTokens.space2),
                    Expanded(
                      child: Text(
                        'Local HTTP & WebSocket Bridge',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontSize: isTablet ? 16.5 : 15.0,
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () async {
                        if (ctrl.isServerRunning) {
                          await ctrl.stopServer();
                        } else {
                          await _tryStartServerWithPermissionGate(
                            context,
                            ctrl,
                          );
                        }
                      },
                      icon: Icon(
                        ctrl.isServerRunning
                            ? Icons.stop_circle_outlined
                            : Icons.play_circle_outline,
                        size: 18,
                        color: ctrl.isServerRunning
                            ? NyenyakTokens.destructive
                            : NyenyakTokens.success,
                      ),
                      label: Text(
                        ctrl.isServerRunning ? 'Hentikan' : 'Jalankan',
                      ),
                    ),
                  ],
                ),
                if (!ctrl.isInitializing && !ctrl.isNotificationGranted) ...[
                  const SizedBox(height: NyenyakTokens.space3),
                  Container(
                    padding: const EdgeInsets.all(NyenyakTokens.space3),
                    decoration: BoxDecoration(
                      color: NyenyakTokens.warning.withValues(alpha: 0.12),
                      borderRadius:
                          BorderRadius.circular(NyenyakTokens.radiusMd),
                      border: Border.all(
                        color: NyenyakTokens.warning.withValues(alpha: 0.5),
                      ),
                    ),
                    child: isNarrowCard
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.notifications_off_outlined,
                                    color: NyenyakTokens.warning,
                                    size: 20,
                                  ),
                                  const SizedBox(width: NyenyakTokens.space2),
                                  Expanded(
                                    child: Text(
                                      'Izin notifikasi belum aktif. Server lokal tidak dapat dinyalakan sebelum notifikasi diizinkan.',
                                      style:
                                          theme.textTheme.bodySmall?.copyWith(
                                        color: theme.colorScheme.onSurface,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: NyenyakTokens.space2),
                              FilledButton.tonal(
                                onPressed: () =>
                                    _tryStartServerWithPermissionGate(
                                  context,
                                  ctrl,
                                ),
                                child: const Text('Izinkan Notifikasi'),
                              ),
                            ],
                          )
                        : Row(
                            children: [
                              const Icon(
                                Icons.notifications_off_outlined,
                                color: NyenyakTokens.warning,
                                size: 20,
                              ),
                              const SizedBox(width: NyenyakTokens.space3),
                              Expanded(
                                child: Text(
                                  'Izin notifikasi belum aktif. Server lokal tidak dapat dinyalakan sebelum notifikasi diizinkan.',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurface,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(width: NyenyakTokens.space2),
                              FilledButton.tonal(
                                onPressed: () =>
                                    _tryStartServerWithPermissionGate(
                                  context,
                                  ctrl,
                                ),
                                child: const Text('Izinkan Notifikasi'),
                              ),
                            ],
                          ),
                  ),
                ],
                const SizedBox(height: NyenyakTokens.space3),
                Container(
                  padding: const EdgeInsets.all(NyenyakTokens.space3),
                  decoration: BoxDecoration(
                    color: isDark
                        ? NyenyakTokens.darkSurfaceSubtle
                        : NyenyakTokens.lightMuted,
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'POST ${ctrl.config.httpEndpointUrl}',
                              style: theme.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'WS ${ctrl.config.wsEndpointUrl} · ${ctrl.activeWebSocketCount} klien WS terhubung',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: 'Salin URL Endpoint',
                        onPressed: () async {
                          await Clipboard.setData(
                            ClipboardData(text: ctrl.config.httpEndpointUrl),
                          );
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Disalin: ${ctrl.config.httpEndpointUrl}',
                                ),
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.copy_rounded, size: 18),
                      ),
                    ],
                  ),
                ),
                if (ctrl.serverError != null) ...[
                  const SizedBox(height: NyenyakTokens.space3),
                  Text(
                    ctrl.serverError!,
                    style: const TextStyle(
                      color: NyenyakTokens.destructive,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
                const SizedBox(height: NyenyakTokens.space4),
                if (isNarrowCard)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _portController,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              decoration: const InputDecoration(
                                labelText: 'Port Lokal',
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: NyenyakTokens.space3),
                          OutlinedButton(
                            onPressed: () => _applyPortChange(context, ctrl),
                            child: const Text('Terapkan Port'),
                          ),
                        ],
                      ),
                      const SizedBox(height: NyenyakTokens.space2),
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        title: Text(
                          'Izinkan LAN (0.0.0.0)',
                          style: theme.textTheme.bodyMedium,
                        ),
                        subtitle: Text(
                          'Akses dari perangkat lain di jaringan Wi-Fi yang sama',
                          style: theme.textTheme.bodySmall,
                        ),
                        value: ctrl.config.bindAllInterfaces,
                        onChanged: (val) =>
                            _toggleLanBinding(context, ctrl, val),
                      ),
                    ],
                  )
                else
                  Row(
                    children: [
                      SizedBox(
                        width: 130,
                        child: TextField(
                          controller: _portController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Port Lokal',
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: NyenyakTokens.space3),
                      OutlinedButton(
                        onPressed: () => _applyPortChange(context, ctrl),
                        child: const Text('Terapkan Port'),
                      ),
                      const Spacer(),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Izinkan LAN (0.0.0.0)',
                            style: theme.textTheme.bodySmall,
                          ),
                          const SizedBox(width: NyenyakTokens.space1),
                          Switch(
                            value: ctrl.config.bindAllInterfaces,
                            onChanged: (val) =>
                                _toggleLanBinding(context, ctrl, val),
                          ),
                        ],
                      ),
                    ],
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _applyPortChange(
    BuildContext context,
    BridgeController ctrl,
  ) async {
    final parsed = int.tryParse(_portController.text.trim());
    if (parsed == null) return;
    final ok = await ctrl.updateServerNetwork(
      port: parsed,
      bindAllInterfaces: ctrl.config.bindAllInterfaces,
    );
    if (!ok && context.mounted && !ctrl.isNotificationGranted) {
      await _showNotificationRequiredDialog(context, ctrl);
    }
  }

  Future<void> _toggleLanBinding(
    BuildContext context,
    BridgeController ctrl,
    bool val,
  ) async {
    final ok = await ctrl.updateServerNetwork(
      port: ctrl.config.port,
      bindAllInterfaces: val,
    );
    if (!ok && context.mounted && !ctrl.isNotificationGranted) {
      await _showNotificationRequiredDialog(context, ctrl);
    }
  }

  Widget _buildPrinterCard(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme, {
    required bool isTablet,
    required bool switchTabOnTest,
  }) {
    return Card(
      child: LayoutBuilder(
        builder: (context, cardConstraints) {
          final isNarrowCard = cardConstraints.maxWidth < 440;
          final pad = isTablet
              ? NyenyakTokens.space5
              : (isNarrowCard ? NyenyakTokens.space4 : NyenyakTokens.space5);

          return Padding(
            padding: EdgeInsets.all(pad),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.bluetooth_connected_rounded,
                      size: 20,
                      color: NyenyakTokens.primary,
                    ),
                    const SizedBox(width: NyenyakTokens.space2),
                    Expanded(
                      child: Text(
                        'Koneksi Printer Thermal Bluetooth',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontSize: isTablet ? 16.5 : 15.0,
                        ),
                      ),
                    ),
                    const SizedBox(width: NyenyakTokens.space2),
                    _buildStatusPill(
                      label: ctrl.isPrinterConnected
                          ? 'TERHUBUNG'
                          : (isNarrowCard ? 'TERPUTUS' : 'BELUM TERHUBUNG'),
                      color: ctrl.isPrinterConnected
                          ? NyenyakTokens.success
                          : NyenyakTokens.warning,
                    ),
                  ],
                ),
                const SizedBox(height: NyenyakTokens.space2),
                Text(
                  'Aplikasi ini hanya bertindak sebagai bridge perangkat keras. Format struk, ukuran kertas (58mm/80mm), auto-cut, dan laci kasir dikontrol penuh dari halaman Web POS.',
                  style: theme.textTheme.bodySmall,
                ),
                const Divider(height: NyenyakTokens.space6),

                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Perangkat Bluetooth (${ctrl.pairedDevices.length})',
                        style: theme.textTheme.labelLarge,
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed:
                          ctrl.isScanning ? null : () => ctrl.scanPrinters(),
                      icon: ctrl.isScanning
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.refresh_rounded, size: 16),
                      label: Text(
                        ctrl.isScanning ? 'Memindai...' : 'Pindai Ulang',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: NyenyakTokens.space3),

                if (ctrl.printerError != null) ...[
                  Container(
                    padding: const EdgeInsets.all(NyenyakTokens.space3),
                    margin:
                        const EdgeInsets.only(bottom: NyenyakTokens.space3),
                    decoration: BoxDecoration(
                      color: NyenyakTokens.destructive.withValues(alpha: 0.1),
                      borderRadius:
                          BorderRadius.circular(NyenyakTokens.radiusMd),
                    ),
                    child: Text(
                      ctrl.printerError!,
                      style: const TextStyle(
                        color: NyenyakTokens.destructive,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],

                if (ctrl.pairedDevices.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(NyenyakTokens.space4),
                    decoration: BoxDecoration(
                      borderRadius:
                          BorderRadius.circular(NyenyakTokens.radiusMd),
                      border: Border.all(color: theme.colorScheme.outline),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.bluetooth_searching_rounded,
                          size: 28,
                          color: theme.textTheme.bodySmall?.color,
                        ),
                        const SizedBox(height: NyenyakTokens.space2),
                        Text(
                          'Belum ada printer Bluetooth yang dipasangkan (Paired).',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Pasangkan printer thermal di Pengaturan Bluetooth perangkat Anda terlebih dahulu, lalu ketuk Pindai Ulang.',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: BoxConstraints(
                      maxHeight: isTablet ? 280 : 210,
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: ctrl.pairedDevices.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: NyenyakTokens.space2),
                      itemBuilder: (context, index) {
                        final device = ctrl.pairedDevices[index];
                        final isCurrent = ctrl.connectedPrinter?.macAddress ==
                            device.macAddress;
                        return _buildPrinterDeviceTile(
                          context,
                          ctrl,
                          device,
                          isCurrent,
                          theme,
                        );
                      },
                    ),
                  ),

                const SizedBox(height: NyenyakTokens.space5),
                FilledButton.icon(
                  onPressed: ctrl.isPrinting
                      ? null
                      : () async {
                          await _handleTestPrint(context);
                          if (switchTabOnTest && mounted) {
                            setState(() {
                              _phonePortraitTabIndex = 1;
                            });
                          }
                        },
                  icon: ctrl.isPrinting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.print_outlined),
                  label: Text(
                    ctrl.isPrinterConnected
                        ? 'Tes Koneksi Cetak Printer'
                        : 'Simulasi Tes Payload Bridge',
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPrinterDeviceTile(
    BuildContext context,
    BridgeController ctrl,
    BluetoothPrinterDevice device,
    bool isCurrent,
    ThemeData theme,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: NyenyakTokens.space4,
        vertical: NyenyakTokens.space3,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
        border: Border.all(
          color: isCurrent ? NyenyakTokens.primary : theme.colorScheme.outline,
          width: isCurrent ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isCurrent ? Icons.print_rounded : Icons.print_outlined,
            color: isCurrent
                ? NyenyakTokens.primary
                : theme.textTheme.bodySmall?.color,
          ),
          const SizedBox(width: NyenyakTokens.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  device.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  device.macAddress,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: NyenyakTokens.space2),
          if (isCurrent)
            OutlinedButton(
              onPressed: ctrl.isConnecting ? null : ctrl.disconnectPrinter,
              child: const Text('Putuskan'),
            )
          else
            FilledButton.tonal(
              onPressed: ctrl.isConnecting
                  ? null
                  : () => ctrl.connectPrinter(device),
              child: const Text('Hubungkan'),
            ),
        ],
      ),
    );
  }

  Widget _buildJobLogCard(
    BuildContext context,
    BridgeController ctrl,
    ThemeData theme, {
    required bool isTablet,
  }) {
    final pad = isTablet ? NyenyakTokens.space5 : NyenyakTokens.space4;

    return Card(
      child: Padding(
        padding: EdgeInsets.all(pad),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.history_rounded,
                  size: 20,
                  color: NyenyakTokens.primary,
                ),
                const SizedBox(width: NyenyakTokens.space2),
                Expanded(
                  child: Text(
                    'Riwayat Antrean Cetak (${ctrl.jobLogs.length})',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontSize: isTablet ? 16.5 : 15.0,
                    ),
                  ),
                ),
                if (ctrl.jobLogs.isNotEmpty)
                  TextButton(
                    onPressed: ctrl.clearJobLogs,
                    child: const Text('Bersihkan'),
                  ),
              ],
            ),
            const SizedBox(height: NyenyakTokens.space3),
            if (ctrl.jobLogs.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: NyenyakTokens.space6,
                ),
                child: Text(
                  'Belum ada permintaan cetak dari halaman web POS atau tombol uji coba.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall,
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: ctrl.jobLogs.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(height: NyenyakTokens.space2),
                itemBuilder: (context, index) {
                  final log = ctrl.jobLogs[index];
                  final isSelected = ctrl.selectedLogForPreview?.id == log.id;
                  final timeStr =
                      '${log.timestamp.hour.toString().padLeft(2, '0')}:${log.timestamp.minute.toString().padLeft(2, '0')}:${log.timestamp.second.toString().padLeft(2, '0')}';

                  final Color badgeColor;
                  final String badgeText;
                  switch (log.status) {
                    case PrintJobStatus.printed:
                      badgeColor = NyenyakTokens.success;
                      badgeText = 'TERCETAK';
                    case PrintJobStatus.previewOnly:
                      badgeColor = NyenyakTokens.warning;
                      badgeText = 'PRATINJAU';
                    case PrintJobStatus.failed:
                      badgeColor = NyenyakTokens.destructive;
                      badgeText = 'GAGAL';
                  }

                  return InkWell(
                    borderRadius: BorderRadius.circular(NyenyakTokens.radiusMd),
                    onTap: () => ctrl.selectLogForPreview(log),
                    child: Container(
                      padding: const EdgeInsets.all(NyenyakTokens.space3),
                      decoration: BoxDecoration(
                        borderRadius:
                            BorderRadius.circular(NyenyakTokens.radiusMd),
                        border: Border.all(
                          color: isSelected
                              ? NyenyakTokens.primary
                              : theme.colorScheme.outline,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${log.receiptNumber} · ${log.sourceLabel}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.labelLarge?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$timeStr · ${log.paperWidth.key} · ${log.byteCount} bytes · ${log.printerName}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: NyenyakTokens.space2),
                          _buildStatusPill(
                            label: badgeText,
                            color: badgeColor,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusPill({
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _tryStartServerWithPermissionGate(
    BuildContext context,
    BridgeController ctrl,
  ) async {
    final started = await ctrl.startServer();
    if (started || !context.mounted) return;

    if (!ctrl.isNotificationGranted) {
      await _showNotificationRequiredDialog(context, ctrl);
    }
  }

  Future<void> _showNotificationRequiredDialog(
    BuildContext context,
    BridgeController ctrl,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Row(
          children: [
            Icon(
              Icons.notifications_active_outlined,
              color: NyenyakTokens.primary,
            ),
            SizedBox(width: NyenyakTokens.space2),
            Expanded(child: Text('Izin Notifikasi Diperlukan')),
          ],
        ),
        content: const SingleChildScrollView(
          child: Text(
            'Nyenyak Print memerlukan izin notifikasi untuk menampilkan status server yang sedang berjalan dan menjaga agar server lokal tetap aktif saat Anda membuka browser POS.\n\nSilakan aktifkan izin notifikasi untuk menyalakan server.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Batal'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              minimumSize: const Size(160, 42),
            ),
            onPressed: () async {
              Navigator.of(dialogContext).pop();
              await ctrl.openNotificationSettings();
            },
            child: const Text('Buka Pengaturan Notifikasi'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleTestPrint(BuildContext context) async {
    final result = await widget.controller.triggerTestPrint();
    if (!context.mounted) return;

    final message = result.jobLog.status == PrintJobStatus.printed
        ? 'Struk uji coba berhasil dikirim ke printer Bluetooth.'
        : (result.errorMessage ?? 'Pratinjau struk berhasil dibuat.');

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _handleReprint(BuildContext context, PrintJobLog log) async {
    final result = await widget.controller.reprintJob(log);
    if (!context.mounted) return;

    final message = result.jobLog.status == PrintJobStatus.printed
        ? 'Cetak ulang (${log.receiptNumber}) berhasil dikirim ke printer.'
        : (result.errorMessage ?? 'Pratinjau cetak ulang diperbarui.');

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
