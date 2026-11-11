import Constants from 'expo-constants';

type Extra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

function getExtra(): Extra {
  return (Constants.expoConfig?.extra ?? {}) as Extra;
}

export function getGoogleAuthConfig() {
  const extra = getExtra();
  return {
    webClientId: extra.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: extra.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId:
      extra.googleAndroidClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      '',
  };
}

export function isGoogleConfigured(): boolean {
  const { webClientId, iosClientId, androidClientId } = getGoogleAuthConfig();
  return Boolean(webClientId || iosClientId || androidClientId);
}

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
