package com.eduniche.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

/**
 * EduNeuro MainActivity — native Android wrapper for the Capacitor web app.
 *
 * Handles:
 * - Splash screen via Android 12+ SplashScreen API
 * - Deep link routing (auth callbacks, password reset, learning content)
 * - Android back button with proper navigation hierarchy
 * - Status bar / navigation bar theming
 */
public class MainActivity extends BridgeActivity {
    private static final String TAG = "EduNeuro";

    // Deep link host
    public static final String HOST = "eduniche.com";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Install splash screen BEFORE super.onCreate
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Handle deep links that arrive while app is running
        if (intent != null && intent.getData() != null) {
            handleDeepLink(intent.getData());
        }
    }

    @Override
    public void onBackPressed() {
        // Let Capacitor/Bridge handle back navigation first (webView.canGoBack)
        if (getBridge() != null && getBridge().getWebView() != null
                && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
            return;
        }

        // If webView has no history, use system back behavior
        super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();

        // Light navigation bar icons on light background
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        );
    }

    /**
     * Handle incoming deep links from browser/email/etc.
     */
    private void handleDeepLink(Uri uri) {
        String path = uri.getPath();

        if (path == null) return;

        Log.d(TAG, "Deep link received: " + uri.toString());

        // Auth callback (Google OAuth, email verification, password reset)
        if (path.contains("/auth/callback") || path.contains("/auth/reset-password")) {
            loadUrl(uri.toString());
            return;
        }

        // Payment return URLs (Razorpay)
        if (path.contains("/success") || path.contains("/pricing")) {
            loadUrl(uri.toString());
            return;
        }

        // Learning content links
        if (path.startsWith("/library") || path.startsWith("/gate")
                || path.startsWith("/dashboard") || path.startsWith("/chat")
                || path.startsWith("/profile")) {
            loadUrl(uri.toString());
            return;
        }

        // Default: load the URL
        loadUrl(uri.toString());
    }

    private void loadUrl(String url) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().loadUrl(url);
        }
    }
}
