import 'package:flutter/foundation.dart';
import '../models/bluetooth_printer_device.dart';
import '../models/bridge_config.dart';
import '../models/paper_width.dart';
import '../models/print_job_log.dart';
import '../models/receipt_payload.dart';
import '../repositories/bluetooth_printer_repository.dart';
import '../repositories/bridge_settings_repository.dart';
import '../services/bridge_notification_service.dart';
import '../services/esc_pos_encoder_service.dart';
import '../services/local_bridge_server_service.dart';

/// Orchestrates the local HTTP/WebSocket bridge server, Bluetooth printer state,
/// notification permission gate, and ESC/POS receipt job queue.
class BridgeController extends ChangeNotifier {
  BridgeController({
    BridgeSettingsRepository? settingsRepository,
    BluetoothPrinterRepository? printerRepository,
    EscPosEncoderService? encoderService,
    LocalBridgeServerService? serverService,
    BridgeNotificationService? notificationService,
  })  : _settingsRepository =
            settingsRepository ?? BridgeSettingsRepository(),
        _printerRepository = printerRepository ?? BluetoothPrinterRepository(),
        _encoderService = encoderService ?? EscPosEncoderService(),
        _serverService = serverService ?? LocalBridgeServerService(),
        _notificationService =
            notificationService ?? BridgeNotificationService();

  final BridgeSettingsRepository _settingsRepository;
  final BluetoothPrinterRepository _printerRepository;
  final EscPosEncoderService _encoderService;
  final LocalBridgeServerService _serverService;
  final BridgeNotificationService _notificationService;

  BridgeConfig _config = const BridgeConfig();
  List<BluetoothPrinterDevice> _pairedDevices = const [];
  BluetoothPrinterDevice? _connectedPrinter;
  final List<PrintJobLog> _jobLogs = <PrintJobLog>[];
  PrintJobLog? _selectedLogForPreview;

  bool _isInitializing = true;
  bool _isScanning = false;
  bool _isConnecting = false;
  bool _isPrinting = false;
  bool _isNotificationGranted = false;
  bool _isNotificationPermanentlyDenied = false;
  bool _pendingStartAfterPermission = false;
  String? _serverError;
  String? _printerError;
  int _jobCounter = 0;

  BridgeConfig get config => _config;
  List<BluetoothPrinterDevice> get pairedDevices => _pairedDevices;
  BluetoothPrinterDevice? get connectedPrinter => _connectedPrinter;
  List<PrintJobLog> get jobLogs => List.unmodifiable(_jobLogs);
  PrintJobLog? get selectedLogForPreview => _selectedLogForPreview;

  bool get isInitializing => _isInitializing;
  bool get isServerRunning => _serverService.isRunning;
  int get activeWebSocketCount => _serverService.activeWebSocketCount;
  bool get isScanning => _isScanning;
  bool get isConnecting => _isConnecting;
  bool get isPrinting => _isPrinting;
  bool get isPrinterConnected => _connectedPrinter != null;
  bool get isNotificationGranted => _isNotificationGranted;
  bool get isNotificationPermanentlyDenied => _isNotificationPermanentlyDenied;
  String? get serverError => _serverError;
  String? get printerError => _printerError;

  /// Initializes settings, prompts for notification permission, starts the local
  /// HTTP/WebSocket bridge server if permitted, and scans paired Bluetooth printers.
  Future<void> initialize() async {
    _isInitializing = true;
    notifyListeners();

    try {
      _config = await _settingsRepository.loadConfig();
      await startServer();
      await scanPrinters(autoReconnectSaved: true);
    } finally {
      _isInitializing = false;
      notifyListeners();
    }
  }

  /// Starts or restarts the local HTTP & WebSocket server.
  ///
  /// Strictly gated on OS notification permission: if notifications are not
  /// enabled, prompts the user first and refuses to start the server until
  /// notification permission is granted.
  Future<bool> startServer() async {
    _serverError = null;
    notifyListeners();

    final permission =
        await _notificationService.ensurePermissionPromptIfNeeded();
    _isNotificationGranted = permission.isGranted;
    _isNotificationPermanentlyDenied = permission.isPermanentlyDenied;

    if (!permission.isGranted) {
      _pendingStartAfterPermission = true;
      await _serverService.stop();
      await _notificationService.stopServerNotification();
      _serverError =
          'Izin notifikasi wajib diaktifkan sebelum server lokal dapat dijalankan.';
      notifyListeners();
      return false;
    }

    _pendingStartAfterPermission = false;

    try {
      await _serverService.start(
        port: _config.port,
        bindAllInterfaces: _config.bindAllInterfaces,
        onStatusRequest: _buildStatusSnapshot,
        onPrintRequest: _handlePrintJob,
        onClientsChanged: notifyListeners,
      );
      await _syncForegroundNotification();
      notifyListeners();
      return true;
    } catch (error) {
      _serverError = 'Gagal menjalankan server di port ${_config.port}: $error';
      await _notificationService.stopServerNotification();
      notifyListeners();
      return false;
    }
  }

  /// Re-evaluates notification permissions when the user returns from OS Settings.
  /// If notifications were turned off while running, stops the server immediately;
  /// if notifications were newly enabled, starts the server.
  Future<void> refreshPermissionOnResume() async {
    final status = await _notificationService.checkPermissionStatus();
    _isNotificationGranted = status.isGranted;
    _isNotificationPermanentlyDenied = status.isPermanentlyDenied;

    if (!status.isGranted && _serverService.isRunning) {
      await stopServer();
      _serverError =
          'Server dihentikan karena izin notifikasi dinonaktifkan di pengaturan perangkat.';
      notifyListeners();
      return;
    }

    if (status.isGranted &&
        !_serverService.isRunning &&
        _pendingStartAfterPermission) {
      await startServer();
      return;
    }

    notifyListeners();
  }

  /// Opens the OS application settings screen so the user can toggle notifications on.
  Future<void> openNotificationSettings() async {
    _pendingStartAfterPermission = true;
    await _notificationService.openNotificationSettings();
  }

  /// Stops the local HTTP & WebSocket server.
  Future<void> stopServer() async {
    _pendingStartAfterPermission = false;
    await _serverService.stop();
    await _notificationService.stopServerNotification();
    notifyListeners();
  }

  /// Scans paired/bonded Bluetooth thermal printers.
  Future<void> scanPrinters({bool autoReconnectSaved = false}) async {
    _isScanning = true;
    _printerError = null;
    notifyListeners();

    try {
      final devices = await _printerRepository.getPairedPrinters();
      _pairedDevices = devices;

      final connected = await _printerRepository.isConnected();
      if (!connected) {
        _connectedPrinter = null;
      }

      if (autoReconnectSaved &&
          _connectedPrinter == null &&
          _config.savedPrinterMac != null) {
        final savedMatch = devices
            .where((d) => d.macAddress == _config.savedPrinterMac)
            .toList();
        final target = savedMatch.isNotEmpty
            ? savedMatch.first
            : BluetoothPrinterDevice(
                name: _config.savedPrinterName ?? 'Saved Thermal Printer',
                macAddress: _config.savedPrinterMac!,
              );
        await connectPrinter(target, silentOnFail: true);
      }
    } catch (error) {
      _printerError = 'Gagal memindai perangkat Bluetooth: $error';
    } finally {
      _isScanning = false;
      _broadcastStatus();
      notifyListeners();
    }
  }

  /// Connects to the selected [device] and saves it as the default printer.
  Future<bool> connectPrinter(
    BluetoothPrinterDevice device, {
    bool silentOnFail = false,
  }) async {
    _isConnecting = true;
    _printerError = null;
    notifyListeners();

    try {
      final ok = await _printerRepository.connect(device.macAddress);
      if (ok) {
        _connectedPrinter = device;
        _config = _config.copyWith(
          savedPrinterMac: device.macAddress,
          savedPrinterName: device.name,
        );
        await _settingsRepository.saveConfig(_config);
        _broadcastStatus();
        return true;
      } else {
        _connectedPrinter = null;
        if (!silentOnFail) {
          _printerError =
              'Tidak dapat terhubung ke "${device.name}" (${device.macAddress}). Pastikan printer menyala.';
        }
        return false;
      }
    } finally {
      _isConnecting = false;
      notifyListeners();
    }
  }

  /// Disconnects from the active Bluetooth printer.
  Future<void> disconnectPrinter() async {
    await _printerRepository.disconnect();
    _connectedPrinter = null;
    _broadcastStatus();
    notifyListeners();
  }

  /// Updates the thermal paper width (`58mm` or `80mm`).
  Future<void> updatePaperWidth(PaperWidth width) async {
    if (_config.paperWidth == width) return;
    _config = _config.copyWith(paperWidth: width);
    await _settingsRepository.saveConfig(_config);
    _broadcastStatus();
    notifyListeners();
  }

  /// Updates the auto-cut preference.
  Future<void> updateAutoCut(bool enabled) async {
    _config = _config.copyWith(autoCut: enabled);
    await _settingsRepository.saveConfig(_config);
    notifyListeners();
  }

  /// Updates the default cash-drawer kick preference.
  Future<void> updateOpenCashDrawer(bool enabled) async {
    _config = _config.copyWith(openCashDrawerByDefault: enabled);
    await _settingsRepository.saveConfig(_config);
    notifyListeners();
  }

  /// Updates port and/or LAN binding and restarts the server.
  Future<bool> updateServerNetwork({
    required int port,
    required bool bindAllInterfaces,
  }) async {
    if (port < 1024 || port > 65535) {
      _serverError = 'Port harus berada di antara 1024 dan 65535.';
      notifyListeners();
      return false;
    }

    _config = _config.copyWith(
      port: port,
      bindAllInterfaces: bindAllInterfaces,
    );
    await _settingsRepository.saveConfig(_config);
    return await startServer();
  }

  /// Triggers a sample receipt test print (or preview if no printer is connected).
  Future<BridgePrintDispatchResult> triggerTestPrint() {
    return _handlePrintJob(
      ReceiptPayload.sample(paperWidth: _config.paperWidth),
      PrintJobSource.testButton,
    );
  }

  /// Reprints a historical [PrintJobLog].
  Future<BridgePrintDispatchResult> reprintJob(PrintJobLog log) {
    return _handlePrintJob(
      log.payload,
      PrintJobSource.testButton,
    );
  }

  /// Selects a job log to display in the receipt preview pane.
  void selectLogForPreview(PrintJobLog? log) {
    _selectedLogForPreview = log;
    notifyListeners();
  }

  /// Clears the in-memory print job history.
  void clearJobLogs() {
    _jobLogs.clear();
    _selectedLogForPreview = null;
    notifyListeners();
  }

  Future<BridgePrintDispatchResult> _handlePrintJob(
    ReceiptPayload payload,
    PrintJobSource source,
  ) async {
    _isPrinting = true;
    _printerError = null;
    notifyListeners();

    try {
      final compiled = _encoderService.compile(
        payload: payload,
        defaultPaperWidth: _config.paperWidth,
        defaultAutoCut: _config.autoCut,
        defaultOpenCashDrawer: _config.openCashDrawerByDefault,
      );

      _jobCounter += 1;
      final jobId =
          'JOB-${DateTime.now().millisecondsSinceEpoch}-$_jobCounter';
      final receiptNo = payload.receiptNumber ?? 'STRUK-$_jobCounter';

      var hasActivePrinter = _connectedPrinter != null &&
          await _printerRepository.isConnected();

      if (!hasActivePrinter && _config.savedPrinterMac != null) {
        final reconnected = await _printerRepository.connect(
          _config.savedPrinterMac!,
        );
        if (reconnected) {
          _connectedPrinter = BluetoothPrinterDevice(
            name: _config.savedPrinterName ?? 'Thermal Printer',
            macAddress: _config.savedPrinterMac!,
          );
          hasActivePrinter = true;
        } else {
          _connectedPrinter = null;
        }
      }

      PrintJobStatus status;
      String? errorMessage;
      var success = false;

      if (hasActivePrinter) {
        final written = await _printerRepository.writeBytes(compiled.bytes);
        if (written) {
          status = PrintJobStatus.printed;
          success = true;
        } else {
          status = PrintJobStatus.failed;
          errorMessage =
              'Gagal mengirim byte ESC/POS ke printer "${_connectedPrinter?.name}".';
          _printerError = errorMessage;
        }
      } else {
        status = PrintJobStatus.previewOnly;
        success = true;
        errorMessage =
            'Printer Bluetooth belum terhubung (Mode Simulasi / Pratinjau).';
      }

      final logEntry = PrintJobLog(
        id: jobId,
        timestamp: DateTime.now(),
        source: source,
        status: status,
        receiptNumber: receiptNo,
        printerName: _connectedPrinter?.name ?? 'Pratinjau Tanpa Printer',
        paperWidth: compiled.paperWidth,
        byteCount: compiled.bytes.length,
        previewLines: compiled.previewLines,
        payload: payload,
        errorMessage: errorMessage,
      );

      _jobLogs.insert(0, logEntry);
      if (_jobLogs.length > 50) {
        _jobLogs.removeLast();
      }
      _selectedLogForPreview = logEntry;

      return BridgePrintDispatchResult(
        success: success,
        jobLog: logEntry,
        errorMessage: errorMessage,
      );
    } finally {
      _isPrinting = false;
      _broadcastStatus();
      notifyListeners();
    }
  }

  Map<String, dynamic> _buildStatusSnapshot() {
    return {
      'ok': true,
      'service': 'nyenyak-print',
      'version': '1.0.0',
      'serverRunning': _serverService.isRunning,
      'port': _config.port,
      'bindAddress': _config.bindAddressLabel,
      'paperWidth': _config.paperWidth.key,
      'charactersPerLine': _config.paperWidth.charactersPerLine,
      'printerConnected': _connectedPrinter != null,
      'printer': _connectedPrinter?.toJson(),
      'activeWebSockets': _serverService.activeWebSocketCount,
      'totalJobsProcessed': _jobCounter,
    };
  }

  void _broadcastStatus() {
    _serverService.broadcastStatus(_buildStatusSnapshot());
    _syncForegroundNotification();
  }

  Future<void> _syncForegroundNotification() async {
    if (_serverService.isRunning && _isNotificationGranted) {
      await _notificationService.showServerRunningNotification(
        config: _config,
        connectedPrinter: _connectedPrinter,
      );
    } else {
      await _notificationService.stopServerNotification();
    }
  }

  @override
  void dispose() {
    _notificationService.stopServerNotification();
    _serverService.stop();
    super.dispose();
  }
}
