package io.codecat.quack

import android.util.Log
import okhttp3.*
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class QuackConnection(
    serverUrl: String,
    private val authToken: String,
    private val userId: String,
    private val listener: ConnectionListener
) {
    companion object {
        private const val TAG = "QuackConnection"
        private const val INITIAL_RECONNECT_DELAY_MS = 1000L
        private const val MAX_RECONNECT_DELAY_MS = 60000L
        private const val RECONNECT_BACKOFF_MULTIPLIER = 2.0

        /**
         * Normalizes the server URL for Android emulator.
         * Replaces localhost/127.0.0.1 with 10.0.2.2 (emulator's alias for host machine).
         */
        private fun normalizeUrl(url: String): String {
            return url
                .replace("://localhost", "://10.0.2.2")
                .replace("://127.0.0.1", "://10.0.2.2")
        }
    }

    private val serverUrl: String = normalizeUrl(serverUrl)
    private var reconnectAttempts = 0

    interface ConnectionListener {
        fun onConnected()
        fun onDisconnected()
        fun onNotification(notification: NotificationPayload)
        fun onError(error: String)
    }

    data class NotificationPayload(
        val type: String,
        val channelId: String?,
        val parentId: String?,
        val title: String,
        val body: String,
        val senderId: String?,
        val senderName: String?
    )

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS) // No read timeout for SSE
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    private var eventSource: EventSource? = null
    private var isRunning = false
    private var reconnectHandler: android.os.Handler? = null

    fun connect() {
        if (isRunning) {
            Log.d(TAG, "Already running, skipping connect")
            return
        }

        isRunning = true
        reconnectHandler = android.os.Handler(android.os.Looper.getMainLooper())
        doConnect()
    }

    private fun doConnect() {
        if (!isRunning) return

        Log.d(TAG, "Connecting to $serverUrl/api/mobile/notifications")

        val request = Request.Builder()
            .url("$serverUrl/api/mobile/notifications")
            .header("Authorization", "Bearer $authToken")
            .header("Accept", "text/event-stream")
            .build()

        val factory = EventSources.createFactory(client)
        eventSource = factory.newEventSource(request, object : EventSourceListener() {
            override fun onOpen(eventSource: EventSource, response: Response) {
                Log.d(TAG, "SSE connection opened")
            }

            override fun onEvent(
                eventSource: EventSource,
                id: String?,
                type: String?,
                data: String
            ) {
                Log.d(TAG, "SSE event received: $data")
                try {
                    handleEvent(data)
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling event", e)
                }
            }

            override fun onClosed(eventSource: EventSource) {
                Log.d(TAG, "SSE connection closed")
                listener.onDisconnected()
                scheduleReconnect()
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                Log.e(TAG, "SSE connection failed: ${t?.message}", t)
                listener.onDisconnected()
                listener.onError(t?.message ?: "Connection failed")
                scheduleReconnect()
            }
        })
    }

    private fun handleEvent(data: String) {
        if (data.isBlank()) return

        val json = JSONObject(data)

        // Check for connected status
        if (json.optString("status") == "connected") {
            Log.d(TAG, "Received connected status")
            reconnectAttempts = 0 // Reset backoff on successful connection
            listener.onConnected()
            return
        }

        // Check for ping/heartbeat (just acknowledge, no action needed)
        if (json.optString("type") == "ping") {
            Log.d(TAG, "Received heartbeat ping")
            return
        }

        // Check for notification
        if (json.optString("type") == "notification") {
            // Skip notifications from self (already filtered server-side, but double-check)
            val senderId = json.optString("senderId", null)
            if (senderId == userId) {
                Log.d(TAG, "Skipping notification from self")
                return
            }

            val notification = NotificationPayload(
                type = json.getString("type"),
                channelId = json.optString("channelId", null),
                parentId = json.optString("parentId", null),
                title = json.optString("title", "New message"),
                body = json.optString("body", ""),
                senderId = senderId,
                senderName = json.optString("senderName", null)
            )
            listener.onNotification(notification)
        }
    }

    private fun scheduleReconnect() {
        if (!isRunning) return

        // Calculate delay with exponential backoff
        val delay = minOf(
            (INITIAL_RECONNECT_DELAY_MS * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, reconnectAttempts.toDouble())).toLong(),
            MAX_RECONNECT_DELAY_MS
        )
        reconnectAttempts++

        Log.d(TAG, "Scheduling reconnect in ${delay}ms (attempt $reconnectAttempts)")
        reconnectHandler?.postDelayed({
            if (isRunning) {
                doConnect()
            }
        }, delay)
    }

    fun disconnect() {
        Log.d(TAG, "Disconnecting")
        isRunning = false
        reconnectAttempts = 0
        reconnectHandler?.removeCallbacksAndMessages(null)
        reconnectHandler = null
        eventSource?.cancel()
        eventSource = null
    }

    fun isConnected(): Boolean {
        return isRunning && eventSource != null
    }
}
