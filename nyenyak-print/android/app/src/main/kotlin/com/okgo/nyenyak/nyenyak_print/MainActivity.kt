package com.okgo.nyenyak.nyenyak_print

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "com.okgo.nyenyak.print/foreground_service"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            CHANNEL
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "areNotificationsEnabled" -> {
                    result.success(areNotificationsEnabledOnDevice())
                }
                "startOrUpdate" -> {
                    if (!areNotificationsEnabledOnDevice()) {
                        result.success(false)
                        return@setMethodCallHandler
                    }
                    val title = call.argument<String>("title") ?: "Nyenyak Print Server Aktif"
                    val body = call.argument<String>("body")
                        ?: "Server lokal berjalan di http://127.0.0.1:9123"
                    BridgeForegroundService.startOrUpdate(applicationContext, title, body)
                    result.success(true)
                }
                "stop" -> {
                    BridgeForegroundService.stop(applicationContext)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun areNotificationsEnabledOnDevice(): Boolean {
        val manager =
            applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            manager.areNotificationsEnabled()
        } else {
            true
        }
    }
}
