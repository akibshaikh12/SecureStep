const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const i = t.indexOf('=');
      if (i === -1) return;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    });
  return env;
}

const env = { ...loadEnv(path.join(__dirname, '../.env.example')), ...loadEnv(path.join(__dirname, '../.env')) };

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const sw = `/* Auto-generated — run: npm run generate:sw */
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'SecureStep Alert';
  const options = {
    body: payload.notification?.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data || {},
    requireInteraction: true,
  };
  if (payload.notification?.image) {
    options.image = payload.notification.image;
  }
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
`;

const out = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(out, sw, 'utf8');
console.log('Wrote', out);
