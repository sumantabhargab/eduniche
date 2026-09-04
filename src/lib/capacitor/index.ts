/**
 * Capacitor adapter — bridges web app to native Android capabilities.
 *
 * Detects if running inside Capacitor, falls back to web behavior.
 * All native operations are feature-gated: web behavior is preserved
 * when Capacitor plugins are unavailable.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: boolean;
      platform: string;
      getPlugin: (name: string) => any;
      Plugins: Record<string, any>;
    };
  }
}

export type Platform = 'web' | 'android' | 'ios';

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web';
  if (window.Capacitor?.isNativePlatform) {
    if (window.Capacitor.platform === 'android') return 'android';
    if (window.Capacitor.platform === 'ios') return 'ios';
  }
  return 'web';
}

export function isNative(): boolean {
  return getPlatform() !== 'web';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function getAppVersion(): string {
  try {
    if (window.Capacitor?.Plugins?.App?.getInfo) {
      // Async — return promise
      return window.Capacitor.Plugins.App.getInfo();
    }
  } catch {
    // not available
  }
  return 'web';
}

// ─── Network Status ──────────────────────────────────────────────────────────

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    if (window.Capacitor?.Plugins?.Network) {
      const status = await window.Capacitor.Plugins.Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType === 'wifi' ? 'wifi'
          : status.connectionType === 'cellular' ? 'cellular'
          : status.connectionType === 'none' ? 'none'
          : 'unknown',
      };
    }
  } catch {
    // fall through to web check
  }

  // Web fallback
  if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? 'unknown' : 'none',
    };
  }

  return { connected: true, connectionType: 'unknown' };
}

export async function onNetworkChange(callback: (status: NetworkStatus) => void): Promise<(() => void) | null> {
  try {
    if (window.Capacitor?.Plugins?.Network) {
      const listener = await window.Capacitor.Plugins.Network.addListener('networkStatusChange', callback);
      return () => listener.remove();
    }
  } catch {
    // fall through
  }

  // Web fallback
  if (typeof window !== 'undefined') {
    const handler = () => {
      callback({
        connected: navigator.onLine ?? true,
        connectionType: (navigator.onLine ?? true) ? 'unknown' : 'none',
      });
    };
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }

  return null;
}

// ─── Auth Guard (Session Persistence) ────────────────────────────────────────

/**
 * Save auth tokens to secure native storage (when available).
 * Falls back to httpOnly cookies (web behavior).
 */
export async function persistAuthSession(session: {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user_id: string;
}): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.AuthGuard) {
      const expiresAt = session.expires_at
        ? session.expires_at * 1000 // Supabase uses seconds, JS uses ms
        : Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days default

      await window.Capacitor.Plugins.AuthGuard.saveSession({
        sessionToken: session.access_token,
        refreshToken: session.refresh_token,
        userId: session.user_id,
        expiresAt,
      });
      return;
    }
  } catch {
    // fall through — web handles it via cookies
  }
}

export async function checkPersistedSession(): Promise<{
  valid: boolean;
  userId?: string;
  expired?: boolean;
} | null> {
  try {
    if (window.Capacitor?.Plugins?.AuthGuard) {
      const result = await window.Capacitor.Plugins.AuthGuard.checkSession();
      return result;
    }
  } catch {
    // fall through
  }
  return null;
}

export async function clearPersistedSession(): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.AuthGuard) {
      await window.Capacitor.Plugins.AuthGuard.clearSession();
    }
  } catch {
    // fall through
  }
}

// ─── Deep Link Handling ───────────────────────────────────────────────────────

export async function handleIncomingDeepLink(url: string): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.AuthGuard) {
      await window.Capacitor.Plugins.AuthGuard.handleDeepLink({ url });
      return;
    }
  } catch {
    // fall through
  }

  // Web fallback: navigate to the URL
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

export async function setStatusBarStyle(style: 'light' | 'dark'): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.StatusBar) {
      await window.Capacitor.Plugins.StatusBar.setStyle({
        style: style === 'light' ? 'LIGHT' : 'DARK',
      });
    }
  } catch {
    // not available
  }
}

export async function setStatusBarColor(color: string): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.StatusBar) {
      await window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color });
    }
  } catch {
    // not available
  }
}

// ─── Keyboard ────────────────────────────────────────────────────────────────

export async function setKeyboardResize(resize: 'body' | 'ionic' | 'native' | 'none'): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.Keyboard) {
      await window.Capacitor.Plugins.Keyboard.setResizeMode({ mode: resize });
    }
  } catch {
    // not available
  }
}

// ─── Splash Screen ───────────────────────────────────────────────────────────

export async function hideSplashScreen(): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.SplashScreen) {
      await window.Capacitor.Plugins.SplashScreen.hide();
    }
  } catch {
    // not available
  }
}

export async function showSplashScreen(): Promise<void> {
  try {
    if (window.Capacitor?.Plugins?.SplashScreen) {
      await window.Capacitor.Plugins.SplashScreen.show();
    }
  } catch {
    // not available
  }
}
