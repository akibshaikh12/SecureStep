const { linkContactToUser, getPushTokensForUser } = require('./userMatch');

/** Contacts that receive SOS push: priority-linked first, else all linked. */
function getPushTargetContacts(contacts) {
  contacts.forEach((c) => linkContactToUser(c));
  const linked = contacts.filter((c) => c.linkedUserId);
  const priority = linked.filter((c) => c.pushPriority);
  if (priority.length > 0) return priority;
  return linked;
}

function getPushTokensForContacts(contacts) {
  const targets = getPushTargetContacts(contacts);
  const tokens = [];
  for (const contact of targets) {
    tokens.push(...getPushTokensForUser(contact.linkedUserId));
  }
  return {
    targets,
    tokens: [...new Set(tokens.filter(Boolean))],
    priorityOnly: contacts.some((c) => c.pushPriority && c.linkedUserId),
  };
}

module.exports = {
  getPushTargetContacts,
  getPushTokensForContacts,
};
