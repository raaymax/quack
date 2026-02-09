package io.codecat.quack

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    companion object {
        private const val TAG = "MainActivity"
    }

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d(TAG, "Notification permission granted")
        } else {
            Log.w(TAG, "Notification permission denied")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register plugins before calling super.onCreate()
        registerPlugin(QuackPlugin::class.java)
        super.onCreate(savedInstanceState)

        // Request notification permission on Android 13+
        requestNotificationPermission()

        // Check for battery optimization exemption
        checkBatteryOptimization()

        // Handle deep links from notifications
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    Log.d(TAG, "Notification permission already granted")
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
                else -> {
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }

    private fun checkBatteryOptimization() {
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.w(TAG, "Could not request battery optimization exemption", e)
            }
        }
    }

    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            Log.d(TAG, "Handling deep link: $uri")

            when (uri.scheme) {
                "quack" -> {
                    val path = uri.host
                    val id = uri.pathSegments.firstOrNull()

                    when (path) {
                        "channel" -> id?.let { navigateToChannel(it) }
                        "thread" -> id?.let { navigateToThread(it) }
                        else -> Log.d(TAG, "Unknown deep link path: $path")
                    }
                }
                else -> Log.d(TAG, "Unknown URI scheme: ${uri.scheme}")
            }
        }
    }

    private fun navigateToChannel(channelId: String) {
        Log.d(TAG, "Navigating to channel: $channelId")
        runOnUiThread {
            bridge?.webView?.evaluateJavascript(
                "window.location.href = '/channel/$channelId'",
                null
            )
        }
    }

    private fun navigateToThread(threadId: String) {
        Log.d(TAG, "Navigating to thread: $threadId")
        runOnUiThread {
            bridge?.webView?.evaluateJavascript(
                "window.location.href = '/thread/$threadId'",
                null
            )
        }
    }
}
