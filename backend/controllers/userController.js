const { getStore, save } = require('../store/memoryStore');

function sanitizeUser(user) {
  const { passwordHash, twoFactorSecret, pending2FACode, ...safe } = user;
  return safe;
}

function getUserOr404(userId, res) {
  const user = getStore().users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return user;
}

exports.getProfile = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  res.json({ user: sanitizeUser(user) });
};

exports.updateProfile = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  const { name, phone } = req.body;
  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  save();
  res.json({ user: sanitizeUser(user) });
};

exports.getPreferences = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  const prefs = user.preferences || defaultPreferences();
  res.json({ preferences: prefs });
};

exports.updatePreferences = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  user.preferences = { ...defaultPreferences(), ...user.preferences, ...req.body };
  save();
  res.json({ preferences: user.preferences });
};

exports.enable2FA = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  user.twoFactorEnabled = true;
  save();
  res.json({ user: sanitizeUser(user), demoCode: '123456' });
};

exports.disable2FA = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  user.twoFactorEnabled = false;
  save();
  res.json({ user: sanitizeUser(user) });
};

function defaultPreferences() {
  return {
    notifications: true,
    sosSound: true,
    theme: 'light',
  };
}
