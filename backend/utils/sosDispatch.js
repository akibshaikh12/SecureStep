const { getStore, save } = require('../store/memoryStore');
const fcmService = require('../services/fcmService');
const { getPushTokensForContacts } = require('./pushContacts');

async function dispatchSosPush(incident, ownerUserId, { hasPhoto = false, photoEvidenceId = null } = {}) {
  const store = getStore();
  const contacts = store.contacts.filter((c) => c.userId === ownerUserId);
  const fromUser = store.users.find((u) => u.id === ownerUserId);
  const { targets, tokens, priorityOnly } = getPushTokensForContacts(contacts);

  incident.pushDispatchedAt = incident.pushDispatchedAt || new Date().toISOString();
  incident.pushPriorityMode = priorityOnly;
  if (photoEvidenceId) incident.photoEvidenceId = photoEvidenceId;
  if (hasPhoto) incident.hasSharedPhoto = true;

  let pushResult = { sent: 0, failed: 0, skipped: 'not_configured' };
  if (tokens.length && fcmService.isConfigured()) {
    pushResult = await fcmService.sendSosAlert({
      fromUserName: fromUser?.name || 'Someone',
      incident,
      recipientTokens: tokens,
      hasPhoto,
    });
  }

  save();

  return {
    pushResult,
    targets,
    tokensTargeted: tokens.length,
    priorityOnly,
  };
}

module.exports = { dispatchSosPush };
