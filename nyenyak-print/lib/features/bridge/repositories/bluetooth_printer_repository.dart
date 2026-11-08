import 'dart:io';
import 'package:permission_handler/permission_handler.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../models/bluetooth_printer_device.dart';

/// Low-level hardware adapter for Bluetooth ESC/POS thermal printers.
class BluetoothPrinterRepository {
  /// Requests OS Bluetooth runtime permissions on Android and iOS.
  Future<bool> ensurePermissions() async {
    try {
      if (Platform.isAndroid) {
        final statuses = await [
          Permission.bluetoothScan,
          Permission.bluetoothConnect,
        ].request();

        final scanGranted =
            statuses[Permission.bluetoothScan]?.isGranted ?? false;
        final connectGranted =
            statuses[Permission.bluetoothConnect]?.isGranted ?? false;

        if (scanGranted && connectGranted) {
          return true;
        }

        final pluginCheck =
            await PrintBluetoothThermal.isPermissionBluetoothGranted;
        return pluginCheck;
      }

      if (Platform.isIOS) {
        final status = await Permission.bluetooth.request();
        return status.isGranted || status.isLimited;
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  /// Checks whether the device Bluetooth adapter is powered on.
  Future<bool> isBluetoothEnabled() async {
    try {
      return await PrintBluetoothThermal.bluetoothEnabled;
    } catch (_) {
      return false;
    }
  }

  /// Lists paired/bonded Bluetooth devices capable of thermal printing.
  Future<List<BluetoothPrinterDevice>> getPairedPrinters() async {
    final granted = await ensurePermissions();
    if (!granted) {
      return const [];
    }

    try {
      final rawDevices = await PrintBluetoothThermal.pairedBluetooths;
      return rawDevices
          .map(
            (info) => BluetoothPrinterDevice(
              name: info.name.trim().isEmpty
                  ? 'Thermal Printer'
                  : info.name.trim(),
              macAddress: info.macAdress.trim(),
            ),
          )
          .where((device) => device.macAddress.isNotEmpty)
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// Returns true if an active RFCOMM/BLE thermal printer socket is open.
  Future<bool> isConnected() async {
    try {
      return await PrintBluetoothThermal.connectionStatus;
    } catch (_) {
      return false;
    }
  }

  /// Opens a connection to the printer with [macAddress].
  Future<bool> connect(String macAddress) async {
    final granted = await ensurePermissions();
    if (!granted) return false;

    try {
      final alreadyConnected = await PrintBluetoothThermal.connectionStatus;
      if (alreadyConnected) {
        await PrintBluetoothThermal.disconnect;
      }
      return await PrintBluetoothThermal.connect(
        macPrinterAddress: macAddress,
      );
    } catch (_) {
      return false;
    }
  }

  /// Closes the current Bluetooth printer connection.
  Future<bool> disconnect() async {
    try {
      return await PrintBluetoothThermal.disconnect;
    } catch (_) {
      return false;
    }
  }

  /// Sends raw ESC/POS command bytes to the connected Bluetooth printer.
  Future<bool> writeBytes(List<int> bytes) async {
    try {
      return await PrintBluetoothThermal.writeBytes(bytes);
    } catch (_) {
      return false;
    }
  }
}

