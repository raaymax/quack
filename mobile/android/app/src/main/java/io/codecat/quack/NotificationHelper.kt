package io.codecat.quack

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class NotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_ID_MESSAGES = "quack_messages"
        const val CHANNEL_ID_SERVICE = "quack_service"
        const val NOTIFICATION_ID_SERVICE = 1
        private var messageNotificationId = 1000
    }

    init {
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(NotificationManager::class.java)

            // Messages channel with custom sound
            val messagesChannel = NotificationChannel(
                CHANNEL_ID_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "New message notifications"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 250, 250)

                // Set custom notification sound
                val soundUri = Uri.parse("android.resource://${context.packageName}/raw/quack_notification")
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()
                setSound(soundUri, audioAttributes)
            }

            // Service channel (low importance, no sound)
            val serviceChannel = NotificationChannel(
                CHANNEL_ID_SERVICE,
                "Connection Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background connection status"
                setShowBadge(false)
                setSound(null, null)
            }

            notificationManager.createNotificationChannel(messagesChannel)
            notificationManager.createNotificationChannel(serviceChannel)
        }
    }

    fun showServiceNotification(isConnected: Boolean): android.app.Notification {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusText = if (isConnected) "Connected" else "Connecting..."

        return NotificationCompat.Builder(context, CHANNEL_ID_SERVICE)
            .setContentTitle("Quack")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    fun showMessageNotification(
        title: String,
        body: String,
        channelId: String?,
        parentId: String?
    ) {
        // Build deep link intent
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data = Uri.parse(buildDeepLink(channelId, parentId))
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            messageNotificationId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Set custom sound
        val soundUri = Uri.parse("android.resource://${context.packageName}/raw/quack_notification")

        val notification = NotificationCompat.Builder(context, CHANNEL_ID_MESSAGES)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_VIBRATE)
            .setSound(soundUri)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .build()

        try {
            NotificationManagerCompat.from(context).notify(messageNotificationId++, notification)
        } catch (e: SecurityException) {
            // Notification permission not granted
            android.util.Log.w("NotificationHelper", "Notification permission not granted", e)
        }
    }

    private fun buildDeepLink(channelId: String?, parentId: String?): String {
        return when {
            parentId != null -> "quack://thread/$parentId"
            channelId != null -> "quack://channel/$channelId"
            else -> "quack://home"
        }
    }
}
