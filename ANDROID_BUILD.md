# ============================================
# EduNeuro — Android Build Guide
# ============================================
#
# Prerequisites:
#   - Android Studio (Arctic Fox or later)
#   - JDK 17 (bundled with Android Studio)
#   - Android SDK API 36
#
# Setup (one-time):
#   1. Install Android Studio from https://developer.android.com/studio
#   2. Open Android Studio → SDK Manager → Install:
#      - Android SDK Platform 36
#      - Android SDK Build-Tools 36
#      - Android SDK Platform-Tools
#   3. Set JAVA_HOME:
#      Windows: System Properties → Environment Variables
#      Mac/Linux: export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
#
# Build:
#   ./build-android.sh          # Debug APK
#   ./build-android.sh release  # Release APK (unsigned)
#   ./build-android.sh bundle   # Release AAB
#
# Install:
#   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
#
# Release signing:
#   1. Generate keystore:
#      keytool -genkey -v -keystore eduniche-release.keystore \
#        -keyalg RSA -keysize 2048 -validity 10000 \
#        -alias eduniche
#
#   2. Set environment variables (do NOT commit these):
#      ANDROID_KEYSTORE=eduniche-release.keystore
#      ANDROID_KEYSTORE_PASSWORD=your_password
#      ANDROID_KEY_ALIAS=eduniche
#      ANDROID_KEY_PASSWORD=your_password
#
#   3. Build release:
#      ./build-android.sh release
#
# Google Play upload:
#   1. Build AAB: ./build-android.sh bundle
#   2. Go to Google Play Console → Internal Testing
#   3. Create new release → Upload AAB
#   4. Add testers (internal) → Rollout
#
# Architecture:
#   - Capacitor wraps the Next.js web app (SSR mode, served from eduniche.com)
#   - All existing web functionality is preserved
#   - Native Android features: splash screen, status bar, deep links, back navigation
#   - Supabase auth works via existing cookie-based SSR session
#
# Files modified for Android:
#   - capacitor.config.ts         — Capacitor configuration
#   - next.config.ts              — CSP headers for Capacitor
#   - globals.css                 — Mobile-safe CSS
#   - src/lib/capacitor/index.ts  — Capacitor bridge utilities
#   - android/                    — Full Android project
#     - MainActivity.java         — Native activity with deep link handling
#     - AndroidManifest.xml       — Permissions + deep link intent filters
#     - build.gradle              — Build configuration
#     - res/                      — Branding, splash, icons
