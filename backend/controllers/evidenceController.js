const { getStore, save, id } = require('../store/memoryStore');
const { encryptPayload, decryptPayload } = require('../utils/vaultCrypto');

function decryptEvidenceItem(userId, item) {
  const safe = { ...item };
  if (item.encrypted && item.vault) {
    try {
      const plain = decryptPayload(userId, item.vault);
      if (item.type === 'note') {
        safe.note = plain;
      } else {
        safe.dataUrl = plain;
      }
    } catch {
      safe.dataUrl = null;
      safe.decryptError = true;
    }
  }
  delete safe.vault;
  return safe;
}

exports.list = (req, res) => {
  const evidence = getStore()
    .evidence.filter((e) => e.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((item) => decryptEvidenceItem(req.user.userId, item));
  res.json({ evidence, vaultEncrypted: true });
};

exports.create = (req, res) => {
  const { type, note, dataUrl, source, incidentId, mimeType } = req.body;
  if (!type || !['photo', 'audio', 'note'].includes(type)) {
    return res.status(400).json({ message: 'Valid type required: photo, audio, or note' });
  }

  const item = {
    id: id(),
    userId: req.user.userId,
    type,
    note: note?.trim() || '',
    source: source || 'manual',
    incidentId: incidentId || null,
    mimeType: mimeType || (type === 'audio' ? 'audio/webm' : type === 'photo' ? 'image/jpeg' : null),
    encrypted: false,
    vault: null,
    dataUrl: null,
    createdAt: new Date().toISOString(),
  };

  if (type === 'note') {
    item.note = note?.trim() || '';
    if (note?.trim()) {
      item.encrypted = true;
      item.vault = encryptPayload(req.user.userId, note.trim());
      item.note = '[Encrypted note]';
    }
  } else if (dataUrl) {
    item.encrypted = true;
    item.vault = encryptPayload(req.user.userId, dataUrl);
  } else if (type !== 'note') {
    return res.status(400).json({ message: 'Media evidence requires data' });
  }

  getStore().evidence.push(item);
  save();
  res.status(201).json({ evidence: decryptEvidenceItem(req.user.userId, item) });
};

exports.remove = (req, res) => {
  const store = getStore();
  const index = store.evidence.findIndex(
    (e) => e.id === req.params.id && e.userId === req.user.userId
  );
  if (index === -1) {
    return res.status(404).json({ message: 'Evidence not found' });
  }
  const [removed] = store.evidence.splice(index, 1);
  save();
  res.json({ evidence: decryptEvidenceItem(req.user.userId, removed) });
};

exports.getOne = (req, res) => {
  const item = getStore().evidence.find(
    (e) => e.id === req.params.id && e.userId === req.user.userId
  );
  if (!item) {
    return res.status(404).json({ message: 'Evidence not found' });
  }
  res.json({ evidence: decryptEvidenceItem(req.user.userId, item) });
};
