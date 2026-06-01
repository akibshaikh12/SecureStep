const { getStore, save, id } = require('../store/memoryStore');

function userGroups(userId) {
  if (!getStore().trustedGroups) getStore().trustedGroups = [];
  return getStore().trustedGroups.filter((g) => g.userId === userId);
}

function enrichGroup(group) {
  const contacts = getStore().contacts.filter((c) => group.contactIds?.includes(c.id));
  return { ...group, members: contacts, memberCount: contacts.length };
}

exports.list = (req, res) => {
  const groups = userGroups(req.user.userId).map(enrichGroup);
  res.json({ groups });
};

exports.create = (req, res) => {
  const { name, type = 'custom', description = '', contactIds = [] } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ message: 'Group name is required' });
  }
  const store = getStore();
  if (!store.trustedGroups) store.trustedGroups = [];

  const validIds = getStore()
    .contacts.filter((c) => c.userId === req.user.userId && contactIds.includes(c.id))
    .map((c) => c.id);

  const group = {
    id: id(),
    userId: req.user.userId,
    name: name.trim(),
    type: ['family', 'friends', 'custom'].includes(type) ? type : 'custom',
    description: String(description).trim(),
    contactIds: validIds,
    createdAt: new Date().toISOString(),
  };
  store.trustedGroups.push(group);
  save();
  res.status(201).json({ group: enrichGroup(group) });
};

exports.update = (req, res) => {
  const group = getStore().trustedGroups?.find(
    (g) => g.id === req.params.id && g.userId === req.user.userId
  );
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }
  const { name, type, description, contactIds } = req.body;
  if (name !== undefined) group.name = String(name).trim();
  if (type !== undefined && ['family', 'friends', 'custom'].includes(type)) group.type = type;
  if (description !== undefined) group.description = String(description).trim();
  if (contactIds !== undefined) {
    group.contactIds = getStore()
      .contacts.filter((c) => c.userId === req.user.userId && contactIds.includes(c.id))
      .map((c) => c.id);
  }
  save();
  res.json({ group: enrichGroup(group) });
};

exports.remove = (req, res) => {
  const store = getStore();
  const index = store.trustedGroups?.findIndex(
    (g) => g.id === req.params.id && g.userId === req.user.userId
  );
  if (index === -1 || index === undefined) {
    return res.status(404).json({ message: 'Group not found' });
  }
  const [removed] = store.trustedGroups.splice(index, 1);
  save();
  res.json({ group: removed });
};

exports.seedDemoGroups = (userId) => {
  const store = getStore();
  if (!store.trustedGroups) store.trustedGroups = [];
  if (store.trustedGroups.some((g) => g.userId === userId)) return;

  const userContacts = store.contacts.filter((c) => c.userId === userId);
  const familyIds = userContacts.slice(0, 1).map((c) => c.id);
  const friendIds = userContacts.slice(1).map((c) => c.id);

  store.trustedGroups.push(
    {
      id: id(),
      userId,
      name: 'Family circle',
      type: 'family',
      description: 'Close family members notified first',
      contactIds: familyIds,
      createdAt: new Date().toISOString(),
    },
    {
      id: id(),
      userId,
      name: 'Friends circle',
      type: 'friends',
      description: 'Trusted friends for trips and check-ins',
      contactIds: friendIds,
      createdAt: new Date().toISOString(),
    }
  );
  save();
};
