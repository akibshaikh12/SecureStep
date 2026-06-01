import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { pushApi } from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey
  );
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
  } catch (err) {
    console.warn('Service worker registration failed', err);
    return null;
  }
}

export async function enablePushNotifications({ onForegroundMessage } = {}) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_* keys to frontend/.env and run npm run generate:sw'
    );
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const app = getFirebaseApp();
  const registration = await registerServiceWorker();
  const messaging = getMessaging(app, registration ? { serviceWorkerRegistration: registration } : undefined);

  const token = await getToken(messaging, { vapidKey });

  if (!token) {
    throw new Error('Could not get push token. Check VAPID key in Firebase Console.');
  }

  await pushApi.register(token);
  localStorage.setItem('securestep_push_token', token);

  if (onForegroundMessage) {
    onMessage(messaging, (payload) => {
      onForegroundMessage(payload);
      if (payload.notification?.title) {
        const incidentId = payload.data?.incidentId;
        const url =
          incidentId && payload.data?.type === 'sos'
            ? `/alerts/${incidentId}`
            : payload.data?.url || '/';
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/vite.svg',
          image: payload.notification?.image,
          data: { url },
        }).onclick = () => {
          window.focus();
          window.location.href = url;
        };
      }
    });
  }

  return token;
}

export async function disablePushNotifications() {
  const token = localStorage.getItem('securestep_push_token');
  if (token) {
    await pushApi.unregister(token);
    localStorage.removeItem('securestep_push_token');
  }
}

export async function syncPushTokenIfGranted() {
  if (!isFirebaseConfigured()) return null;
  if (Notification.permission !== 'granted') return null;
  try {
    return await enablePushNotifications();
  } catch {
    return null;
  }
}
