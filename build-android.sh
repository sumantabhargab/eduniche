#!/bin/bash
# ============================================
# EduNeuro Android Build Script
# ============================================
# Builds the Next.js app, syncs to Capacitor, and builds APK/AAB.
#
# Usage:
#   ./build-android.sh              # Debug APK
#   ./build-android.sh release      # Release APK
#   ./build-android.sh bundle       # Release AAB
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

BUILD_TYPE="${1:-debug}"

echo "=========================================="
echo "EduNeuro Android Build"
echo "=========================================="
echo "Build type: $BUILD_TYPE"
echo "Project: $PROJECT_ROOT"
echo ""

# ─── Step 1: Build Next.js ────────────────────────────────────────────────────

echo "[1/4] Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo "ERROR: Next.js build failed"
    exit 1
fi

echo "✓ Next.js build complete"
echo ""

# ─── Step 2: Copy static export for Capacitor ─────────────────────────────────

echo "[2/4] Preparing web assets for Capacitor..."
mkdir -p android/app/src/main/assets/public

# Next.js outputs to .next/static for SSR, but we need static assets for Capacitor
# For SSR mode, Capacitor loads from the server URL in capacitor.config.ts
# This step ensures the out/ directory exists for local development
if [ -d "out" ]; then
    echo "  Static export found in out/"
elif [ -d ".next" ]; then
    echo "  Using .next/ for SSR (server mode)"
else
    echo "  WARNING: No build output found"
fi

echo "✓ Web assets prepared"
echo ""

# ─── Step 3: Sync Capacitor ───────────────────────────────────────────────────

echo "[3/4] Syncing Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "ERROR: Capacitor sync failed"
    exit 1
fi

echo "✓ Capacitor sync complete"
echo ""

# ─── Step 4: Build Android ────────────────────────────────────────────────────

cd android

echo "[4/4] Building Android $BUILD_TYPE..."

case "$BUILD_TYPE" in
    debug)
        echo "  → Building debug APK..."
        ./gradlew assembleDebug
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
        ;;
    release)
        echo "  → Building release APK..."
        ./gradlew assembleRelease
        APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
        ;;
    bundle)
        echo "  → Building release AAB..."
        ./gradlew bundleRelease
        AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
        ;;
    *)
        echo "ERROR: Unknown build type: $BUILD_TYPE"
        echo "Usage: $0 [debug|release|bundle]"
        exit 1
        ;;
esac

cd "$PROJECT_ROOT"

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="

case "$BUILD_TYPE" in
    debug)
        echo "Debug APK: $PROJECT_ROOT/android/$APK_PATH"
        echo ""
        echo "Install with:"
        echo "  adb install -r android/$APK_PATH"
        ;;
    release)
        echo "Release APK (unsigned): $PROJECT_ROOT/android/$APK_PATH"
        echo ""
        echo "Sign with:"
        echo "  apksigner sign --ks eduniche-release.keystore android/$APK_PATH"
        ;;
    bundle)
        echo "Release AAB: $PROJECT_ROOT/android/$AAB_PATH"
        echo ""
        echo "Upload to Google Play Console:"
        echo "  Internal testing → Create release → Upload AAB"
        ;;
esac

echo ""
echo "Package: com.eduniche.app"
echo "Version: 1.1.0 (code 1001000)"
echo "Min SDK: 24 (Android 7.0)"
echo "Target SDK: 36 (Android 16)"
