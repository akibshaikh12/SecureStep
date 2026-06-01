const { getStore, save, id } = require('../store/memoryStore');
const fcmService = require('../services/fcmService');
const { linkContactToUser, getPushTokensForUser } = require('../utils/userMatch');

function resolveNotifyContacts(userId, trustedGroupId) {
  const store = getStore();
  if (trustedGroupId) {
    const group = store.trustedGroups?.find(
      (g) => g.id === trustedGroupId && g.userId === userId
    );
    if (group) {
      return store.contacts
        .filter((c) => group.contactIds.includes(c.id))
        .map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
    }
  }
  return store.contacts
    .filter((c) => c.userId === userId)
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
}

exports.getActive = (req, res) => {
  if (!getStore().journeys) getStore().journeys = [];
  const journey = getStore().journeys.find(
    (j) => j.userId === req.user.userId && j.status === 'active'
  );
  res.json({ journey: journey || null });
};

exports.list = (req, res) => {
  const journeys = (getStore().journeys || [])
    .filter((j) => j.userId === req.user.userId)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 20);
  res.json({ journeys });
};

exports.start = (req, res) => {
  const { destination, trustedGroupId, note } = req.body;
  if (!destination?.trim()) {
    return res.status(400).json({ message: 'Destination is required' });
  }
  const store = getStore();
  if (!store.journeys) store.journeys = [];

  const active = store.journeys.find(
    (j) => j.userId === req.user.userId && j.status === 'active'
  );
  if (active) {
    return res.status(400).json({ message: 'You already have an active trip. End it first.' });
  }

  const notifyContacts = resolveNotifyContacts(req.user.userId, trustedGroupId);
  const group = trustedGroupId
    ? store.trustedGroups?.find((g) => g.id === trustedGroupId && g.userId === req.user.userId)
    : null;

  const journey = {
    id: id(),
    userId: req.user.userId,
    destination: destination.trim(),
    trustedGroupId: trustedGroupId || null,
    trustedGroupName: group?.name || null,
    note: note?.trim() || '',
    status: 'active',
    startedAt: new Date().toISOString(),
    completedAt: null,
    arrivalNotified: false,
    notifiedContacts: notifyContacts,
    startNotifiedAt: new Date().toISOString(),
  };
  store.journeys.push(journey);
  save();

  res.status(201).json({
    journey,
    message: `Trip started. ${notifyContacts.length} contact(s) can follow your journey.`,
  });
};

exports.complete = async (req, res) => {
  const store = getStore();
  const journey = store.journeys?.find(
    (j) => j.id === req.params.id && j.userId === req.user.userId
  );
  if (!journey) {
    return res.status(404).json({ message: 'Trip not found' });
  }
  if (journey.status !== 'active') {
    return res.status(400).json({ message: 'This trip is not active' });
  }

  const fromUser = store.users.find((u) => u.id === req.user.userId);
  const userPrivacy = fromUser?.privacy || {};
  const shouldPush = userPrivacy.notifyOnSafeArrival !== false;

  journey.status = 'completed';
  journey.completedAt = new Date().toISOString();
  journey.arrivalNotified = true;
  journey.arrivalNotifiedAt = new Date().toISOString();
  save();

  let pushSent = 0;
  if (shouldPush && fcmService.isConfigured()) {
    const contacts = store.contacts.filter(
      (c) =>
        c.userId === req.user.userId &&
        journey.notifiedContacts.some((n) => n.id === c.id)
    );
    contacts.forEach((c) => linkContactToUser(c));
    const tokens = [
      ...new Set(
        contacts.flatMap((c) =>
          c.linkedUserId ? getPushTokensForUser(c.linkedUserId) : []
        )
      ),
    ];
    if (tokens.length) {
      const result = await fcmService.sendSafeArrivalAlert({
        fromUserName: fromUser?.name || 'Someone',
        journey,
        recipientTokens: tokens,
      });
      pushSent = result.sent;
    }
  }

  res.json({
    journey,
    pushSent,
    message:
      pushSent > 0
        ? `Safe arrival confirmed. ${pushSent} push notification(s) sent.`
        : `Safe arrival confirmed. ${journey.notifiedContacts.length} contact(s) on file.`,
  });
};

exports.cancel = (req, res) => {
  const journey = getStore().journeys?.find(
    (j) => j.id === req.params.id && j.userId === req.user.userId
  );
  if (!journey) {
    return res.status(404).json({ message: 'Trip not found' });
  }
  if (journey.status !== 'active') {
    return res.status(400).json({ message: 'This trip is not active' });
  }
  journey.status = 'cancelled';
  journey.completedAt = new Date().toISOString();
  save();
  res.json({ journey, message: 'Trip cancelled' });
};
