package io.codecat.quack

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Quack")
class QuackPlugin : Plugin() {

    companion object {
        private const val TAG = "QuackPlugin"
    }

    @PluginMethod
    fun startNotificationService(call: PluginCall) {
        val serverUrl = call.getString("serverUrl")
        val authToken = call.getString("authToken")
        val userId = call.getString("userId")

        if (serverUrl.isNullOrBlank() || authToken.isNullOrBlank() || userId.isNullOrBlank()) {
            call.reject("serverUrl, authToken, and userId are required")
            return
        }

        Log.d(TAG, "Starting notification service for server: $serverUrl")

        activity?.let { act ->
            QuackNotificationService.start(act, serverUrl, authToken, userId)
            call.resolve()
        } ?: call.reject("Activity not available")
    }

    @PluginMethod
    fun stopNotificationService(call: PluginCall) {
        Log.d(TAG, "Stopping notification service")

        activity?.let { act ->
            QuackNotificationService.stop(act)
            call.resolve()
        } ?: call.reject("Activity not available")
    }

    @PluginMethod
    fun isServiceRunning(call: PluginCall) {
        activity?.let { act ->
            val isConfigured = QuackNotificationService.isConfigured(act)
            val result = JSObject()
            result.put("running", isConfigured)
            call.resolve(result)
        } ?: call.reject("Activity not available")
    }

    @PluginMethod
    fun clearCredentials(call: PluginCall) {
        Log.d(TAG, "Clearing service credentials")

        activity?.let { act ->
            QuackNotificationService.stop(act)
            QuackNotificationService.clearCredentials(act)
            call.resolve()
        } ?: call.reject("Activity not available")
    }

    @PluginMethod
    fun getServiceStatus(call: PluginCall) {
        activity?.let { act ->
            val isConfigured = QuackNotificationService.isConfigured(act)
            val result = JSObject()
            result.put("configured", isConfigured)
            result.put("platform", "android")
            call.resolve(result)
        } ?: call.reject("Activity not available")
    }
}
