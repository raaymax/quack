package io.codecat.quack

import android.app.ActivityManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class QuackNotificationService : Service(), QuackConnection.ConnectionListener {

    companion object {
        private const val TAG = "QuackNotificationService"
        private const val PREFS_NAME = "quack_secure_prefs"
        private const val PREF_SERVER_URL = "server_url"
        private const val PREF_AUTH_TOKEN = "auth_token"
        private const val PREF_USER_ID = "user_id"
        private const val WAKE_LOCK_TIMEOUT_MS = 10 * 60 * 1000L // 10 minutes

        private fun getEncryptedPrefs(context: Context) = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create encrypted prefs, falling back to regular prefs", e)
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }

        fun start(context: Context, serverUrl: String, authToken: String, userId: String) {
            val prefs = getEncryptedPrefs(context)
            prefs.edit()
                .putString(PREF_SERVER_URL, serverUrl)
                .putString(PREF_AUTH_TOKEN, authToken)
                .putString(PREF_USER_ID, userId)
                .apply()

            val intent = Intent(context, QuackNotificationService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, QuackNotificationService::class.java)
            context.stopService(intent)
        }

        fun isConfigured(context: Context): Boolean {
            val prefs = getEncryptedPrefs(context)
            return prefs.getString(PREF_AUTH_TOKEN, null) != null
        }

        fun isRunning(context: Context): Boolean {
            val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            @Suppress("DEPRECATION")
            for (service in manager.getRunningServices(Int.MAX_VALUE)) {
                if (QuackNotificationService::class.java.name == service.service.className) {
                    return true
                }
            }
            return false
        }

        fun clearCredentials(context: Context) {
            val prefs = getEncryptedPrefs(context)
            prefs.edit().clear().apply()
        }
    }

    private var connection: QuackConnection? = null
    private var notificationHelper: NotificationHelper? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var isConnected = false

    private val binder = LocalBinder()

    inner class LocalBinder : Binder() {
        fun getService(): QuackNotificationService = this@QuackNotificationService
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
        notificationHelper = NotificationHelper(this)

        // Acquire partial wake lock with timeout to keep CPU running
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Quack::NotificationService"
        )
        wakeLock?.acquire(WAKE_LOCK_TIMEOUT_MS)

        // Register for network changes
        registerNetworkCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service started")

        // Start foreground immediately
        val notification = notificationHelper?.showServiceNotification(false)
        if (notification != null) {
            ServiceCompat.startForeground(
                this,
                NotificationHelper.NOTIFICATION_ID_SERVICE,
                notification,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
                } else {
                    0
                }
            )
        }

        // Get credentials and connect
        val prefs = getEncryptedPrefs(this)
        val serverUrl = prefs.getString(PREF_SERVER_URL, null)
        val authToken = prefs.getString(PREF_AUTH_TOKEN, null)
        val userId = prefs.getString(PREF_USER_ID, null)

        if (serverUrl != null && authToken != null && userId != null) {
            startConnection(serverUrl, authToken, userId)
        } else {
            Log.w(TAG, "No credentials configured, stopping service")
            stopSelf()
        }

        return START_STICKY
    }

    private fun startConnection(serverUrl: String, authToken: String, userId: String) {
        connection?.disconnect()
        connection = QuackConnection(serverUrl, authToken, userId, this)
        connection?.connect()
    }

    private fun registerNetworkCallback() {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Network available, reconnecting")
                // Reconnect when network becomes available
                val prefs = getEncryptedPrefs(this@QuackNotificationService)
                val serverUrl = prefs.getString(PREF_SERVER_URL, null)
                val authToken = prefs.getString(PREF_AUTH_TOKEN, null)
                val userId = prefs.getString(PREF_USER_ID, null)
                if (serverUrl != null && authToken != null && userId != null) {
                    startConnection(serverUrl, authToken, userId)
                }
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "Network lost")
                onDisconnected()
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(request, networkCallback!!)
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")

        connection?.disconnect()
        connection = null

        networkCallback?.let {
            val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            connectivityManager.unregisterNetworkCallback(it)
        }
        networkCallback = null

        wakeLock?.release()
        wakeLock = null
    }

    // QuackConnection.ConnectionListener implementation

    override fun onConnected() {
        Log.d(TAG, "Connected to server")
        isConnected = true
        updateServiceNotification()
    }

    override fun onDisconnected() {
        Log.d(TAG, "Disconnected from server")
        isConnected = false
        updateServiceNotification()
    }

    override fun onNotification(notification: QuackConnection.NotificationPayload) {
        Log.d(TAG, "Received notification: ${notification.title}")

        // Check if app is in foreground
        if (isAppInForeground()) {
            Log.d(TAG, "App is in foreground, skipping notification")
            return
        }

        notificationHelper?.showMessageNotification(
            title = notification.title,
            body = notification.body,
            channelId = notification.channelId,
            parentId = notification.parentId
        )
    }

    override fun onError(error: String) {
        Log.e(TAG, "Connection error: $error")
    }

    private fun updateServiceNotification() {
        val notification = notificationHelper?.showServiceNotification(isConnected)
        if (notification != null) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            notificationManager.notify(NotificationHelper.NOTIFICATION_ID_SERVICE, notification)
        }
    }

    private fun isAppInForeground(): Boolean {
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val appProcesses = activityManager.runningAppProcesses ?: return false

        for (appProcess in appProcesses) {
            if (appProcess.processName == packageName &&
                appProcess.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                return true
            }
        }
        return false
    }

    fun isServiceConnected(): Boolean = isConnected
}
