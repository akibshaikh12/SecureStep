const { getStore, save, id } = require('../store/memoryStore');
const fcmService = require('../services/fcmService');
const { linkContactToUser } = require('../utils/userMatch');
const { getPushTargetContacts, getPushTokensForContacts } = require('../utils/pushContacts');
const { dispatchSosPush } = require('../utils/sosDispatch');

function mapNotifiedContact(c) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    linkedUserId: c.linkedUserId,
    pushEligible: Boolean(c.linkedUserId),
    pushPriority: Boolean(c.pushPriority),
  };
}

function buildPushMessage({ pushResult, targets, tokensTargeted, hasPhoto, contactCount }) {
  if (tokensTargeted && pushResult.sent > 0) {
    const mode = targets.some((t) => t.pushPriority)
      ? `${targets.length} priority contact(s)`
      : `${targets.length} contact(s)`;
    const photoPart = hasPhoto ? ' Emergency photo included.' : '';
    return `SOS alert sent to ${mode}.${photoPart}`;
  }
  const pushEligible = targets.length;
  if (pushEligible === 0) {
    return `SOS recorded. Add contacts with SecureStep accounts (email/phone) and mark priority for push alerts.`;
  }
  if (fcmService.isConfigured()) {
    return `SOS recorded. ${pushEligible} push contact(s) have no notification token yet — ask them to enable alerts in the app.`;
  }
  return `SOS recorded for ${contactCount} contact(s). Configure Firebase on the server for push delivery.`;
}

exports.list = (req, res) => {
  const incidents = getStore().incidents
    .filter((i) => i.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ incidents });
};

exports.create = async (req, res) => {
  const { latitude, longitude, note } = req.body;
  const store = getStore();
  const contacts = store.contacts.filter((c) => c.userId === req.user.userId);

  contacts.forEach((c) => linkContactToUser(c));

  const incident = {
    id: id(),
    userId: req.user.userId,
    type: 'sos',
    status: 'active',
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    note: note || 'Emergency SOS triggered',
    notifiedContacts: contacts.map(mapNotifiedContact),
    sharedPhoto: null,
    photoEvidenceId: null,
    hasSharedPhoto: false,
    pushDispatchedAt: null,
    createdAt: new Date().toISOString(),
  };
  store.incidents.push(incident);
  save();

  const { targets, tokens } = getPushTokensForContacts(contacts);

  res.status(201).json({
    incident,
    push: {
      configured: fcmService.isConfigured(),
      pendingPhoto: true,
      eligibleContacts: targets.length,
      tokensTargeted: tokens.length,
      priorityMode: contacts.some((c) => c.pushPriority && c.linkedUserId),
      sent: 0,
      failed: 0,
    },
    message: 'SOS activated. Capturing emergency photo…',
  });
};

exports.uploadSosPhoto = async (req, res) => {
  const { dataUrl, mimeType } = req.body;
  if (!dataUrl?.startsWith('data:')) {
    return res.status(400).json({ message: 'Photo data is required' });
  }

  const store = getStore();
  const incident = store.incidents.find(
    (i) => i.id === req.params.id && i.userId === req.user.userId && i.status === 'active'
  );
  if (!incident) {
    return res.status(404).json({ message: 'Active SOS incident not found' });
  }

  if (dataUrl.length > 2_500_000) {
    return res.status(413).json({ message: 'Photo is too large. Try again in better lighting.' });
  }

  const evidenceItem = {
    id: id(),
    userId: req.user.userId,
    type: 'photo',
    note: 'SOS automatic photo',
    source: 'sos_auto_photo',
    incidentId: incident.id,
    mimeType: mimeType || 'image/jpeg',
    encrypted: false,
    vault: null,
    dataUrl: null,
    createdAt: new Date().toISOString(),
  };

  const { encryptPayload } = require('../utils/vaultCrypto');
  evidenceItem.encrypted = true;
  evidenceItem.vault = encryptPayload(req.user.userId, dataUrl);

  store.evidence.push(evidenceItem);

  incident.sharedPhoto = {
    mimeType: evidenceItem.mimeType,
    dataUrl,
    capturedAt: new Date().toISOString(),
  };
  incident.photoEvidenceId = evidenceItem.id;
  incident.hasSharedPhoto = true;
  save();

  const { pushResult, targets, tokensTargeted, priorityOnly } = await dispatchSosPush(
    incident,
    req.user.userId,
    { hasPhoto: true, photoEvidenceId: evidenceItem.id }
  );

  res.json({
    incident,
    evidenceId: evidenceItem.id,
    push: {
      configured: fcmService.isConfigured(),
      eligibleContacts: targets.length,
      tokensTargeted,
      priorityMode: priorityOnly,
      sent: pushResult.sent,
      failed: pushResult.failed,
    },
    message: buildPushMessage({
      pushResult,
      targets,
      tokensTargeted,
      hasPhoto: true,
      contactCount: store.contacts.filter((c) => c.userId === req.user.userId).length,
    }),
  });
};

exports.dispatchPush = async (req, res) => {
  const store = getStore();
  const incident = store.incidents.find(
    (i) => i.id === req.params.id && i.userId === req.user.userId && i.status === 'active'
  );
  if (!incident) {
    return res.status(404).json({ message: 'Active SOS incident not found' });
  }

  if (incident.pushDispatchedAt) {
    return res.json({ incident, message: 'Push alert was already sent.', push: { sent: 0 } });
  }

  const contacts = store.contacts.filter((c) => c.userId === req.user.userId);
  const { pushResult, targets, tokensTargeted, priorityOnly } = await dispatchSosPush(
    incident,
    req.user.userId,
    { hasPhoto: false }
  );

  res.json({
    incident,
    push: {
      configured: fcmService.isConfigured(),
      eligibleContacts: targets.length,
      tokensTargeted,
      priorityMode: priorityOnly,
      sent: pushResult.sent,
      failed: pushResult.failed,
    },
    message: buildPushMessage({
      pushResult,
      targets,
      tokensTargeted,
      hasPhoto: false,
      contactCount: contacts.length,
    }),
  });
};

exports.listIncoming = (req, res) => {
  const store = getStore();
  const userId = req.user.userId;
  const user = store.users.find((u) => u.id === userId);
  if (!user) return res.json({ alerts: [] });

  const alerts = store.incidents
    .filter((inc) => {
      if (inc.status !== 'active' || inc.type !== 'sos') return false;
      const ownerContacts = store.contacts.filter((c) => c.userId === inc.userId);
      const targets = getPushTargetContacts(ownerContacts);
      return targets.some((t) => t.linkedUserId === userId);
    })
    .map((inc) => {
      const owner = store.users.find((u) => u.id === inc.userId);
      return {
        id: inc.id,
        fromUserId: inc.userId,
        fromUserName: owner?.name || 'Someone',
        latitude: inc.latitude,
        longitude: inc.longitude,
        note: inc.note,
        createdAt: inc.createdAt,
        hasSharedPhoto: Boolean(inc.sharedPhoto?.dataUrl),
        sharedPhoto: inc.sharedPhoto
          ? { mimeType: inc.sharedPhoto.mimeType, dataUrl: inc.sharedPhoto.dataUrl }
          : null,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ alerts });
};

exports.getIncoming = (req, res) => {
  const store = getStore();
  const userId = req.user.userId;
  const incident = store.incidents.find((i) => i.id === req.params.id && i.status === 'active');
  if (!incident) {
    return res.status(404).json({ message: 'Alert not found or resolved' });
  }

  const ownerContacts = store.contacts.filter((c) => c.userId === incident.userId);
  const targets = getPushTargetContacts(ownerContacts);
  const isRecipient = targets.some((t) => t.linkedUserId === userId);
  if (!isRecipient) {
    return res.status(403).json({ message: 'Not authorized to view this alert' });
  }

  const owner = store.users.find((u) => u.id === incident.userId);
  res.json({
    alert: {
      id: incident.id,
      fromUserName: owner?.name || 'Someone',
      latitude: incident.latitude,
      longitude: incident.longitude,
      note: incident.note,
      createdAt: incident.createdAt,
      sharedPhoto: incident.sharedPhoto,
      maps:
        incident.latitude != null
          ? `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`
          : null,
    },
  });
};

exports.resolve = (req, res) => {
  const incident = getStore().incidents.find(
    (i) => i.id === req.params.id && i.userId === req.user.userId
  );
  if (!incident) {
    return res.status(404).json({ message: 'Incident not found' });
  }
  incident.status = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  save();
  res.json({ incident });
};

exports.getActive = (req, res) => {
  const incident = getStore().incidents.find(
    (i) => i.userId === req.user.userId && i.status === 'active'
  );
  res.json({ incident: incident || null });
};
