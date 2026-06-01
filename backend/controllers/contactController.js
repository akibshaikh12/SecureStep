const { getStore, save, id } = require('../store/memoryStore');
const { linkContactToUser } = require('../utils/userMatch');

function userContacts(userId) {
  return getStore().contacts.filter((c) => c.userId === userId);
}

function normalizeContact(contact) {
  return {
    ...contact,
    pushPriority: Boolean(contact.pushPriority),
  };
}

exports.list = (req, res) => {
  const store = getStore();
  let migrated = false;
  const contacts = userContacts(req.user.userId).map((c) => {
    if (c.pushPriority === undefined) {
      c.pushPriority = false;
      migrated = true;
    }
    return normalizeContact(c);
  });
  if (migrated) save();
  res.json({ contacts });
};

exports.create = (req, res) => {
  const { name, phone, email, relation = 'Contact', pushPriority = false } = req.body;
  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }
  const contact = {
    id: id(),
    userId: req.user.userId,
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim().toLowerCase() || '',
    relation: relation.trim() || 'Contact',
    linkedUserId: null,
    pushPriority: Boolean(pushPriority),
    createdAt: new Date().toISOString(),
  };
  const linked = linkContactToUser(contact);
  getStore().contacts.push(contact);
  save();
  res.status(201).json({
    contact,
    linkedToAppUser: Boolean(linked),
    linkHint: linked
      ? `${linked.name} will receive push alerts if notifications are enabled.`
      : 'Add their SecureStep email or phone to send push alerts.',
  });
};

exports.update = (req, res) => {
  const contact = getStore().contacts.find(
    (c) => c.id === req.params.id && c.userId === req.user.userId
  );
  if (!contact) {
    return res.status(404).json({ message: 'Contact not found' });
  }
  const { name, phone, email, relation, pushPriority } = req.body;
  if (name !== undefined) contact.name = String(name).trim();
  if (phone !== undefined) contact.phone = String(phone).trim();
  if (email !== undefined) contact.email = String(email).trim().toLowerCase();
  if (relation !== undefined) contact.relation = String(relation).trim();
  if (pushPriority !== undefined) contact.pushPriority = Boolean(pushPriority);
  linkContactToUser(contact);
  save();
  res.json({ contact: normalizeContact(contact) });
};

exports.setPushPriority = (req, res) => {
  const contact = getStore().contacts.find(
    (c) => c.id === req.params.id && c.userId === req.user.userId
  );
  if (!contact) {
    return res.status(404).json({ message: 'Contact not found' });
  }
  const { pushPriority } = req.body;
  if (pushPriority === undefined) {
    return res.status(400).json({ message: 'pushPriority is required (true or false)' });
  }
  contact.pushPriority = pushPriority === true || pushPriority === 'true';
  save();
  res.json({ contact: normalizeContact(contact) });
};

exports.remove = (req, res) => {
  const store = getStore();
  const index = store.contacts.findIndex(
    (c) => c.id === req.params.id && c.userId === req.user.userId
  );
  if (index === -1) {
    return res.status(404).json({ message: 'Contact not found' });
  }
  const [removed] = store.contacts.splice(index, 1);
  save();
  res.json({ contact: removed });
};

exports.seedDemoContacts = (userId) => {
  const store = getStore();
  if (store.contacts.some((c) => c.userId === userId)) return;
  const authController = require('./authController');
  const alex = {
    id: id(),
    userId,
    name: 'Alex Morgan',
    phone: '+1 (555) 010-2234',
    email: authController.DEMO_CONTACT_EMAIL || '',
    relation: 'Primary',
    linkedUserId: null,
    pushPriority: true,
    createdAt: new Date().toISOString(),
  };
  linkContactToUser(alex);
  const jordan = {
    id: id(),
    userId,
    name: 'Jordan Lee',
    phone: '+1 (555) 010-8891',
    email: '',
    relation: 'Secondary',
    linkedUserId: null,
    pushPriority: false,
    createdAt: new Date().toISOString(),
  };
  linkContactToUser(jordan);
  store.contacts.push(alex, jordan);
  save();
};
