import 'dart:io';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/bluetooth_printer_device.dart';
import '../models/bridge_config.dart';

/// Result of checking or requesting OS notification permissions.
class NotificationPermissionResult {
  const NotificationPermissionResult({
    required this.isGranted,
    required this.isPermanentlyDenied,
  });

  final bool isGranted;
  final bool isPermanentlyDenied;
}

/// Manages the native undismissable Foreground Service notification and
/// enforces notification permission gating before the bridge server can start.
class BridgeNotificationService {
  static const MethodChannel _channel = MethodChannel(
    'com.okgo.nyenyak.print/foreground_service',
  );

  /// Checks current notification permission without prompting.
  Future<NotificationPermissionResult> checkPermissionStatus() async {
    try {
      if (!Platform.isAndroid && !Platform.isIOS) {
        return const NotificationPermissionResult(
          isGranted: true,
          isPermanentlyDenied: false,
        );
      }

      final status = await Permission.notification.status;
      final nativeEnabled = await _checkNativeNotificationsEnabled();
      final granted = (status.isGranted || status.isProvisional) && nativeEnabled;

      return NotificationPermissionResult(
        isGranted: granted,
        isPermanentlyDenied: status.isPermanentlyDenied || (!nativeEnabled && status.isGranted),
      );
    } catch (_) {
      return const NotificationPermissionResult(
        isGranted: false,
        isPermanentlyDenied: false,
      );
    }
  }

  /// Checks whether notification permission is granted; if not, prompts the
  /// OS runtime permission dialog and returns the resulting status.
  Future<NotificationPermissionResult> ensurePermissionPromptIfNeeded() async {
    try {
      if (!Platform.isAndroid && !Platform.isIOS) {
        return const NotificationPermissionResult(
          isGranted: true,
          isPermanentlyDenied: false,
        );
      }

      var status = await Permission.notification.status;
      if (!status.isGranted && !status.isProvisional) {
        status = await Permission.notification.request();
      }

      final nativeEnabled = await _checkNativeNotificationsEnabled();
      final granted = (status.isGranted || status.isProvisional) && nativeEnabled;

      return NotificationPermissionResult(
        isGranted: granted,
        isPermanentlyDenied:
            status.isPermanentlyDenied || (!nativeEnabled && status.isGranted),
      );
    } catch (_) {
      return const NotificationPermissionResult(
        isGranted: false,
        isPermanentlyDenied: false,
      );
    }
  }

  /// Opens the operating system app settings page so the user can enable notifications.
  Future<bool> openNotificationSettings() async {
    try {
      return await openAppSettings();
    } catch (_) {
      return false;
    }
  }

  /// Displays or updates the ongoing undismissable server notification.
  Future<bool> showServerRunningNotification({
    required BridgeConfig config,
    required BluetoothPrinterDevice? connectedPrinter,
  }) async {
    try {
      final printerLabel = connectedPrinter != null
          ? 'Printer: ${connectedPrinter.name}'
          : 'Printer belum terhubung';

      final title = 'Nyenyak Print Server Aktif (:${config.port})';
      final body =
          'http://${config.bindAddressLabel}:${config.port}/print · $printerLabel';

      final shown = await _channel.invokeMethod<bool>('startOrUpdate', {
        'title': title,
        'body': body,
      });
      return shown ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Dismisses and stops the Foreground Service notification when the server stops.
  Future<void> stopServerNotification() async {
    try {
      await _channel.invokeMethod<bool>('stop');
    } catch (_) {}
  }

  Future<bool> _checkNativeNotificationsEnabled() async {
    try {
      final enabled = await _channel.invokeMethod<bool>('areNotificationsEnabled');
      return enabled ?? true;
    } catch (_) {
      return true;
    }
  }
}
