package io.codecat.quack

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {

            Log.d(TAG, "Boot completed, checking if service should be started")

            // Only start if credentials are configured
            if (QuackNotificationService.isConfigured(context)) {
                Log.d(TAG, "Starting notification service after boot")
                val serviceIntent = Intent(context, QuackNotificationService::class.java)
                context.startForegroundService(serviceIntent)
            } else {
                Log.d(TAG, "Service not configured, skipping start")
            }
        }
    }
}
