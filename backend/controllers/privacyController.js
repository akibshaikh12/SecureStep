const { getStore, save } = require('../store/memoryStore');

function defaultPrivacy() {
  return {
    shareLocationWithGroups: true,
    notifyOnTripStart: true,
    notifyOnSafeArrival: true,
    retainLocationDays: 30,
    retainEvidenceDays: 90,
    autoDeleteAfterDays: 0,
  };
}

function getUserOr404(userId, res) {
  const user = getStore().users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return user;
}

exports.getSettings = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  user.privacy = { ...defaultPrivacy(), ...user.privacy };
  save();
  res.json({ privacy: user.privacy });
};

exports.updateSettings = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  user.privacy = { ...defaultPrivacy(), ...user.privacy, ...req.body };
  save();
  res.json({ privacy: user.privacy });
};

exports.getDataSummary = (req, res) => {
  const userId = req.user.userId;
  const store = getStore();
  res.json({
    summary: {
      contacts: store.contacts.filter((c) => c.userId === userId).length,
      trustedGroups: (store.trustedGroups || []).filter((g) => g.userId === userId).length,
      locationPoints: (store.locations || []).filter((l) => l.userId === userId).length,
      evidenceItems: (store.evidence || []).filter((e) => e.userId === userId).length,
      chatMessages: (store.chatSessions || []).find((s) => s.userId === userId)?.messages
        ?.length || 0,
      trips: (store.journeys || []).filter((j) => j.userId === userId).length,
      incidents: (store.incidents || []).filter((i) => i.userId === userId).length,
    },
  });
};

exports.deleteData = (req, res) => {
  const userId = req.user.userId;
  const {
    deleteLocationHistory,
    deleteEvidence,
    deleteChatHistory,
    deleteTripHistory,
    deleteIncidents,
  } = req.body;

  const store = getStore();
  const deleted = {};

  if (deleteLocationHistory) {
    const before = store.locations.length;
    store.locations = store.locations.filter((l) => l.userId !== userId);
    deleted.locationPoints = before - store.locations.length;
  }
  if (deleteEvidence) {
    const before = store.evidence.length;
    store.evidence = store.evidence.filter((e) => e.userId !== userId);
    deleted.evidenceItems = before - store.evidence.length;
  }
  if (deleteChatHistory) {
    const idx = store.chatSessions.findIndex((s) => s.userId === userId);
    if (idx !== -1) {
      deleted.chatMessages = store.chatSessions[idx].messages?.length || 0;
      store.chatSessions.splice(idx, 1);
    } else {
      deleted.chatMessages = 0;
    }
  }
  if (deleteTripHistory) {
    const before = (store.journeys || []).length;
    store.journeys = (store.journeys || []).filter((j) => j.userId !== userId);
    deleted.trips = before - store.journeys.length;
  }
  if (deleteIncidents) {
    const before = store.incidents.length;
    store.incidents = store.incidents.filter((i) => i.userId !== userId);
    deleted.incidents = before - store.incidents.length;
  }

  if (!Object.values({ deleteLocationHistory, deleteEvidence, deleteChatHistory, deleteTripHistory, deleteIncidents }).some(Boolean)) {
    return res.status(400).json({ message: 'Select at least one data type to delete' });
  }

  save();
  res.json({
    message: 'Selected data deleted successfully',
    deleted,
  });
};
