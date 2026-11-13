import 'package:flutter/services.dart';

/// Contract for playing an audible and haptic alert when a new service session
/// is assigned to the bound room device.
abstract interface class NotificationSoundPlayer {
  Future<void> playNewServiceSound();
}

/// Production notification sound player that invokes the native platform
/// notification chime channel with a [SystemSound] + [HapticFeedback] fallback.
class PlatformNotificationSoundPlayer implements NotificationSoundPlayer {
  const PlatformNotificationSoundPlayer();

  static const MethodChannel _channel = MethodChannel(
    'com.okgo.nyenyak.nyenyak_portal/notification_sound',
  );

  @override
  Future<void> playNewServiceSound() async {
    try {
      await _channel.invokeMethod<void>('playNotificationSound');
    } on MissingPluginException {
      // Fallback when native channel is unavailable (e.g. hot-reload or desktop test)
      await SystemSound.play(SystemSoundType.alert);
    } on PlatformException {
      await SystemSound.play(SystemSoundType.alert);
    } catch (_) {
      // Ignore audio hardware errors on headless devices
    }

    try {
      await HapticFeedback.mediumImpact();
    } catch (_) {
      // Ignore haptic errors on unsupported platforms
    }
  }
}

/// Test double for verifying notification sound playback in widget and unit tests.
class FakeNotificationSoundPlayer implements NotificationSoundPlayer {
  int playCount = 0;

  @override
  Future<void> playNewServiceSound() async {
    playCount += 1;
  }
}

