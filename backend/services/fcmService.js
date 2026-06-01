let admin = null;
let messaging = null;

function initFirebaseAdmin() {
  if (messaging) return messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    const firebaseAdmin = require('firebase-admin');
    if (!admin) {
      admin = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    messaging = admin.messaging();
    return messaging;
  } catch (err) {
    console.error('Firebase Admin init failed:', err.message);
    return null;
  }
}

function isConfigured() {
  return Boolean(initFirebaseAdmin());
}

async function sendToTokens(tokens, notification, data = {}) {
  const fcm = initFirebaseAdmin();
  if (!fcm || !tokens?.length) {
    return { sent: 0, failed: 0, skipped: !fcm ? 'not_configured' : 'no_tokens' };
  }

  const unique = [...new Set(tokens.filter(Boolean))];
  const payload = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
    ),
    webpush: {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/vite.svg',
        requireInteraction: true,
      },
      fcmOptions: {
        link: data.url || '/',
      },
    },
  };

  const result = await fcm.sendEachForMulticast({
    tokens: unique,
    ...payload,
  });

  return {
    sent: result.successCount,
    failed: result.failureCount,
    responses: result.responses,
  };
}

async function sendSosAlert({ fromUserName, incident, recipientTokens, hasPhoto = false }) {
  const maps =
    incident.latitude != null && incident.longitude != null
      ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
      : '';

  const alertUrl = `/alerts/${incident.id}`;
  const body = hasPhoto
    ? `${fromUserName} triggered SOS with an emergency photo. Tap to view.`
    : `${fromUserName} needs help! Tap to view details.`;

  const notification = {
    title: hasPhoto ? '🚨 SOS + Photo — SecureStep' : '🚨 SOS Alert — SecureStep',
    body,
  };

  const webpushNotification = {
    title: notification.title,
    body: notification.body,
    icon: '/vite.svg',
    requireInteraction: true,
  };

  if (hasPhoto && incident.sharedPhoto?.dataUrl?.startsWith('data:image/')) {
    webpushNotification.image = incident.sharedPhoto.dataUrl;
  }

  const fcm = initFirebaseAdmin();
  if (!fcm || !recipientTokens?.length) {
    return { sent: 0, failed: 0, skipped: !fcm ? 'not_configured' : 'no_tokens' };
  }

  const unique = [...new Set(recipientTokens.filter(Boolean))];
  const result = await fcm.sendEachForMulticast({
    tokens: unique,
    notification,
    data: Object.fromEntries(
      Object.entries({
        type: 'sos',
        incidentId: incident.id,
        url: alertUrl,
        maps,
        hasPhoto: hasPhoto ? '1' : '0',
      }).map(([k, v]) => [k, String(v ?? '')])
    ),
    webpush: {
      notification: webpushNotification,
      fcmOptions: { link: alertUrl },
    },
  });

  return {
    sent: result.successCount,
    failed: result.failureCount,
    responses: result.responses,
  };
}

async function sendSafeArrivalAlert({ fromUserName, journey, recipientTokens }) {
  return sendToTokens(
    recipientTokens,
    {
      title: '✓ Safe arrival — SecureStep',
      body: `${fromUserName} arrived safely at ${journey.destination}.`,
    },
    {
      type: 'safe_arrival',
      journeyId: journey.id,
      url: '/journey',
    }
  );
}

module.exports = {
  isConfigured,
  sendToTokens,
  sendSosAlert,
  sendSafeArrivalAlert,
};
