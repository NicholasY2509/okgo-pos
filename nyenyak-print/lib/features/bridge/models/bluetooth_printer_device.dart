/// Represents a paired or discovered Bluetooth ESC/POS thermal printer.
class BluetoothPrinterDevice {
  const BluetoothPrinterDevice({
    required this.name,
    required this.macAddress,
  });

  final String name;
  final String macAddress;

  Map<String, dynamic> toJson() => {
        'name': name,
        'macAddress': macAddress,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BluetoothPrinterDevice &&
          runtimeType == other.runtimeType &&
          macAddress == other.macAddress;

  @override
  int get hashCode => macAddress.hashCode;
}

