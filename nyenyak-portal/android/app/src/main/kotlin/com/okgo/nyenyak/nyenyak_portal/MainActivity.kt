package com.okgo.nyenyak.nyenyak_portal

import android.media.AudioManager
import android.media.RingtoneManager
import android.media.ToneGenerator
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        private const val SOUND_CHANNEL = "com.okgo.nyenyak.nyenyak_portal/notification_sound"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SOUND_CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "playNotificationSound") {
                    playSystemNotificationSound()
                    result.success(null)
                } else {
                    result.notImplemented()
                }
            }
    }

    private fun playSystemNotificationSound() {
        try {
            val notificationUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val ringtone = RingtoneManager.getRingtone(applicationContext, notificationUri)
            if (ringtone != null) {
                ringtone.play()
                return
            }
        } catch (_: Exception) {
            // Fall through to ToneGenerator fallback
        }

        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 85)
            toneGen.startTone(ToneGenerator.TONE_PROP_ACK, 350)
        } catch (_: Exception) {
            // Ignore audio hardware failures
        }
    }
}
