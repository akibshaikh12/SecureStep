import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Bot } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { chatApi } from '../services/api';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await chatApi.getMessages();
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError('');
    const optimistic = {
      id: `temp-${Date.now()}`,
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const { data } = await chatApi.send(text);
      setMessages((m) => {
        const withoutTemp = m.filter((msg) => msg.id !== optimistic.id);
        return [...withoutTemp, ...data.messages];
      });
    } catch (err) {
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      setError(err.message);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout
      title="Emergency assistant"
      subtitle="Confidential · Not a replacement for 911"
      backTo="/"
    >
      <div className="flex min-h-[55vh] flex-col">
        {error && (
          <div className="mb-3">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {loading ? (
            <p className="text-center text-sm text-text-tertiary">Loading chat…</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-overlay">
                    <Bot className="h-4 w-4 text-brand-400" />
                  </span>
                )}
                <Card
                  className={`max-w-[85%] !p-3 text-sm ${
                    msg.role === 'user' ? '!border-brand-600 !bg-brand-600 !text-white' : ''
                  }`}
                >
                  {msg.text}
                </Card>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form className="mt-auto flex gap-2 border-t border-border pt-4" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your situation..."
            className="flex-1 rounded-xl border border-border bg-surface-overlay px-4 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default ChatbotPage;
