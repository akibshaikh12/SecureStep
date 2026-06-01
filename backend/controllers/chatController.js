const { getStore, save, id } = require('../store/memoryStore');

function getSession(userId) {
  let session = getStore().chatSessions.find((s) => s.userId === userId);
  if (!session) {
    session = {
      id: id(),
      userId,
      messages: [
        {
          id: id(),
          role: 'assistant',
          text: "Hi — I'm your emergency assistant. Are you safe right now?",
          createdAt: new Date().toISOString(),
        },
      ],
    };
    getStore().chatSessions.push(session);
    save();
  }
  return session;
}

function assistantReply(userText) {
  const text = userText.toLowerCase();
  if (/911|emergency|help|danger|unsafe|hurt|attack/.test(text)) {
    return 'If you are in immediate danger, call 911 now. I can help you alert your emergency contacts — use the SOS button on your dashboard.';
  }
  if (/location|where|lost|track/.test(text)) {
    return 'Open Navigation to share your live location with trusted contacts. Enable live tracking when you feel unsafe.';
  }
  if (/contact|notify|call/.test(text)) {
    return 'Your emergency contacts can be managed under Contacts. When you trigger SOS, they are notified automatically.';
  }
  if (/evidence|photo|record|proof/.test(text)) {
    return 'Use Evidence collection to capture photos, audio, or notes. Everything is timestamped and stored securely.';
  }
  if (/safe|okay|fine|good/.test(text)) {
    return "I'm glad to hear that. Stay aware of your surroundings. You can enable location sharing if you'd like extra protection.";
  }
  return 'I understand. Stay calm. Tell me more about your situation, or use SOS on the home screen if you need immediate help.';
}

exports.getMessages = (req, res) => {
  const session = getSession(req.user.userId);
  res.json({ messages: session.messages });
};

exports.sendMessage = (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }
  const session = getSession(req.user.userId);
  const userMsg = {
    id: id(),
    role: 'user',
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const assistantMsg = {
    id: id(),
    role: 'assistant',
    text: assistantReply(text),
    createdAt: new Date().toISOString(),
  };
  session.messages.push(userMsg, assistantMsg);
  save();
  res.json({ messages: [userMsg, assistantMsg] });
};

exports.clearSession = (req, res) => {
  const store = getStore();
  const index = store.chatSessions.findIndex((s) => s.userId === req.user.userId);
  if (index !== -1) {
    store.chatSessions.splice(index, 1);
    save();
  }
  getSession(req.user.userId);
  res.json({ message: 'Chat reset' });
};
