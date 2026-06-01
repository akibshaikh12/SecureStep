/* Auto-generated — run: npm run generate:sw */
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  "apiKey": "AIzaSyAQ73y-5acLDoF1VV8GFrpMcgnYD5CIuOg",
  "authDomain": "step-7eb5e.firebaseapp.com",
  "projectId": "step-7eb5e",
  "storageBucket": "step-7eb5e.firebasestorage.app",
  "messagingSenderId": "680335156143",
  "appId": "1:680335156143:web:01c036a09ab3f71af5c55a"
});

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
