const { getStore, save, id } = require('../store/memoryStore');

exports.getLatest = (req, res) => {
  const locations = getStore().locations
    .filter((l) => l.userId === req.user.userId)
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  res.json({ location: locations[0] || null, history: locations.slice(0, 20) });
};

exports.update = (req, res) => {
  const { latitude, longitude, trackingEnabled } = req.body;
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  const user = getStore().users.find((u) => u.id === req.user.userId);
  if (user) {
    user.trackingEnabled = Boolean(trackingEnabled);
  }
  const entry = {
    id: id(),
    userId: req.user.userId,
    latitude,
    longitude,
    recordedAt: new Date().toISOString(),
  };
  getStore().locations.push(entry);
  save();
  res.json({ location: entry, trackingEnabled: user?.trackingEnabled ?? false });
};

exports.getTrackingStatus = (req, res) => {
  const user = getStore().users.find((u) => u.id === req.user.userId);
  res.json({ trackingEnabled: Boolean(user?.trackingEnabled) });
};

exports.setTracking = (req, res) => {
  const user = getStore().users.find((u) => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  user.trackingEnabled = Boolean(req.body.enabled);
  save();
  res.json({ trackingEnabled: user.trackingEnabled });
};
