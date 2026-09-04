# EduNeuro ProGuard rules
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Keep our AuthGuard plugin
-keep class com.eduniche.app.plugins.AuthGuardPlugin { *; }

# Keep JS interface classes
-keep class **.JsInterface { *; }

# Keep WebView JavaScript interfaces
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes EnclosingMethod

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
