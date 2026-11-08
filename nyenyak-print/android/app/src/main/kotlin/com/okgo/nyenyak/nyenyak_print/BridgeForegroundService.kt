package com.okgo.nyenyak.nyenyak_print

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class BridgeForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "nyenyak_print_bridge_service"
        const val NOTIFICATION_ID = 9123
        const val ACTION_START_OR_UPDATE = "com.okgo.nyenyak.nyenyak_print.START_OR_UPDATE"
        const val ACTION_RESTORE = "com.okgo.nyenyak.nyenyak_print.RESTORE"
        const val ACTION_STOP = "com.okgo.nyenyak.nyenyak_print.STOP"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_BODY = "extra_body"

        @Volatile
        private var isRunningService = false
        private var lastTitle: String = "Nyenyak Print Server Aktif"
        private var lastBody: String = "Local bridge berjalan di http://127.0.0.1:9123"

        fun startOrUpdate(context: Context, title: String, body: String) {
            lastTitle = title
            lastBody = body
            val intent = Intent(context, BridgeForegroundService::class.java).apply {
                action = ACTION_START_OR_UPDATE
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_BODY, body)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            isRunningService = false
            val intent = Intent(context, BridgeForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        ensureNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                isRunningService = false
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_RESTORE -> {
                if (isRunningService) {
                    promoteToForeground(lastTitle, lastBody)
                }
                return START_STICKY
            }
            else -> {
                val title = intent?.getStringExtra(EXTRA_TITLE) ?: lastTitle
                val body = intent?.getStringExtra(EXTRA_BODY) ?: lastBody
                lastTitle = title
                lastBody = body
                isRunningService = true
                promoteToForeground(title, body)
                return START_STICKY
            }
        }
    }

    private fun promoteToForeground(title: String, body: String) {
        val notification = buildOngoingNotification(title, body)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildOngoingNotification(title: String, body: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            pendingOpenFlags
        )

        // Re-post notification if dismissed on Android 14+ OEM skins
        val restoreIntent = Intent(this, BridgeForegroundService::class.java).apply {
            action = ACTION_RESTORE
        }
        val deletePendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PendingIntent.getForegroundService(this, 1, restoreIntent, pendingOpenFlags)
        } else {
            PendingIntent.getService(this, 1, restoreIntent, pendingOpenFlags)
        }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        builder
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentPendingIntent)
            .setDeleteIntent(deletePendingIntent)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setCategory(Notification.CATEGORY_SERVICE)
            builder.setVisibility(Notification.VISIBILITY_PUBLIC)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        }

        val notification = builder.build()
        notification.flags =
            notification.flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
        return notification
    }

    private fun ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Nyenyak Print Bridge Server",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Menampilkan status server lokal ESC/POS Nyenyak Print"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

