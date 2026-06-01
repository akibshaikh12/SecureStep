const { getStore } = require('../store/memoryStore');

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

function findUserByEmail(email) {
  if (!email?.trim()) return null;
  const normalized = email.trim().toLowerCase();
  return getStore().users.find((u) => u.email === normalized) || null;
}

function findUserByPhone(phone) {
  const target = normalizePhone(phone);
  if (target.length < 10) return null;
  return (
    getStore().users.find((u) => normalizePhone(u.phone) === target && target) || null
  );
}

function linkContactToUser(contact) {
  if (contact.email) {
    const byEmail = findUserByEmail(contact.email);
    if (byEmail) {
      contact.linkedUserId = byEmail.id;
      return byEmail;
    }
  }
  const byPhone = findUserByPhone(contact.phone);
  if (byPhone) {
    contact.linkedUserId = byPhone.id;
    return byPhone;
  }
  contact.linkedUserId = null;
  return null;
}

function getPushTokensForUser(userId) {
  const user = getStore().users.find((u) => u.id === userId);
  if (!user?.pushTokens?.length) return [];
  return user.pushTokens.map((t) => t.token);
}

function getPushTokensForContactIds(ownerUserId, contactIds) {
  const store = getStore();
  const tokens = [];
  const contacts = store.contacts.filter(
    (c) => c.userId === ownerUserId && contactIds.includes(c.id)
  );
  for (const contact of contacts) {
    if (!contact.linkedUserId) linkContactToUser(contact);
    if (contact.linkedUserId) {
      tokens.push(...getPushTokensForUser(contact.linkedUserId));
    }
  }
  return [...new Set(tokens)];
}

module.exports = {
  normalizePhone,
  findUserByEmail,
  findUserByPhone,
  linkContactToUser,
  getPushTokensForUser,
  getPushTokensForContactIds,
};
