const { getStore, save } = require('../store/memoryStore');
const fcmService = require('../services/fcmService');

function getUserOr404(userId, res) {
  const user = getStore().users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return null;
  }
  return user;
}

exports.getStatus = (req, res) => {
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  if (!user.pushTokens) user.pushTokens = [];
  res.json({
    configured: fcmService.isConfigured(),
    tokenCount: user.pushTokens.length,
    tokens: user.pushTokens.map((t) => ({
      id: t.id,
      createdAt: t.createdAt,
      userAgent: t.userAgent,
    })),
  });
};

exports.register = (req, res) => {
  const { token } = req.body;
  if (!token?.trim()) {
    return res.status(400).json({ message: 'Push token is required' });
  }
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;

  if (!user.pushTokens) user.pushTokens = [];
  const existing = user.pushTokens.find((t) => t.token === token);
  if (!existing) {
    const { id } = require('../store/memoryStore');
    user.pushTokens.push({
      id: id(),
      token: token.trim(),
      userAgent: req.headers['user-agent'] || '',
      createdAt: new Date().toISOString(),
    });
  }
  save();
  res.json({
    message: 'Push notifications enabled for this device',
    configured: fcmService.isConfigured(),
    tokenCount: user.pushTokens.length,
  });
};

exports.unregister = (req, res) => {
  const { token } = req.body;
  const user = getUserOr404(req.user.userId, res);
  if (!user) return;
  if (!user.pushTokens) user.pushTokens = [];

  user.pushTokens = token
    ? user.pushTokens.filter((t) => t.token !== token)
    : [];
  save();
  res.json({ message: 'Push token removed', tokenCount: user.pushTokens.length });
};
