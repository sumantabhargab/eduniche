const config = {
  appId: 'com.padhaishuru.app',
  appName: 'PadhaiShuru',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://padhaishuru.com',
    cleartext: false,
  },
  android: {
    statusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#1A1A1A',
      overlaysWebView: false,
    },
    splashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1A1A1A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    captureInput: true,
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1A1A1A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#1A1A1A',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    App: {},
  },
};

module.exports = config;
