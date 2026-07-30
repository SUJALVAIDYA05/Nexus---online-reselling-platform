import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { conversations as conversationsApi } from '../api/api';
import { PageLoader } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import PageTransition from '../components/ui/PageTransition';

function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = `
  .msg-page { height: calc(100vh - var(--nav-height)); display: flex; overflow: hidden; background: var(--bg); }
  .msg-left { width: 360px; min-width: 360px; border-right: 1px solid var(--border); background: var(--bg-glass); backdrop-filter: blur(16px); display: flex; flex-direction: column; }
  .msg-left-head { padding: 24px; border-bottom: 1px solid var(--border-light); }
  .msg-conv-list { flex: 1; overflow-y: auto; padding: 12px; }

  .msg-conv-item { display: flex; gap: 14px; padding: 14px; border-radius: var(--radius-xl); cursor: pointer; border: 1px solid transparent; transition: all 0.2s; margin-bottom: 6px; }
  .msg-conv-item:hover { background: rgba(255,255,255,0.05); }
  .msg-conv-item.active { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.3); }

  .msg-right { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0b0f19 100%); }
  .msg-right-head { padding: 20px 24px; border-bottom: 1px solid var(--border); background: var(--bg-glass-strong); display: flex; align-items: center; justify-content: space-between; }

  .msg-feed { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .msg-bubble { max-width: 65%; padding: 14px 18px; border-radius: var(--radius-xl); font-size: 14.5px; line-height: 1.5; }
  .msg-bubble.me { align-self: flex-end; background: var(--gradient-primary); color: white; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(244,63,94,0.3); }
  .msg-bubble.other { align-self: flex-start; background: rgba(255,255,255,0.08); color: #ffffff; border-bottom-left-radius: 4px; border: 1px solid var(--border-light); }

  .msg-input-bar { padding: 20px 24px; border-top: 1px solid var(--border); background: var(--bg-glass-strong); display: flex; gap: 12px; }
`;

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetConvoId = searchParams.get('convo');

  const [convos, setConvos] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const feedEndRef = useRef(null);

  useEffect(() => {
    conversationsApi.list().then(data => {
      const arr = Array.isArray(data) ? data : (data.conversations || []);
      setConvos(arr);
      if (targetConvoId) {
        const found = arr.find(c => c._id === targetConvoId);
        if (found) setActiveConvo(found);
      } else if (arr.length > 0) {
        setActiveConvo(arr[0]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [targetConvoId]);

  useEffect(() => {
    if (!activeConvo) return;
    conversationsApi.getMessages(activeConvo._id).then(data => {
      setMessages(Array.isArray(data) ? data : (data.messages || []));
    }).catch(() => {});
  }, [activeConvo]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvo || sending) return;

    const currentText = text.trim();
    setText('');
    setSending(true);

    try {
      const newMsg = await conversationsApi.sendMessage(activeConvo._id, currentText);
      setMessages(prev => [...prev, newMsg.message || newMsg]);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="msg-page">
        <div className="msg-left">
          <div className="msg-left-head">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={22} color="var(--accent)" /> Direct Messages
            </h2>
          </div>

          <div className="msg-conv-list">
            {convos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)', fontSize: 14 }}>
                No active conversations yet
              </div>
            ) : (
              convos.map(c => {
                const partner = c.participants?.find(p => (p._id || p) !== (user.id || user._id)) || {};
                const isSelected = activeConvo?._id === c._id;
                return (
                  <div
                    key={c._id}
                    className={`msg-conv-item ${isSelected ? 'active' : ''}`}
                    onClick={() => { setActiveConvo(c); setSearchParams({ convo: c._id }); }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {(partner.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>{partner.name || 'User'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeAgo(c.updatedAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lastMessage?.text || 'Click to view conversation'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="msg-right">
          {activeConvo ? (
            <>
              <div className="msg-right-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 17 }}>
                    {activeConvo.listing?.title ? `Re: ${activeConvo.listing.title}` : 'Chat'}
                  </div>
                </div>
              </div>

              <div className="msg-feed">
                {messages.map((m, i) => {
                  const senderId = m.sender?._id || m.sender;
                  const isMe = senderId === (user.id || user._id);
                  return (
                    <motion.div
                      key={m._id || i}
                      className={`msg-bubble ${isMe ? 'me' : 'other'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div>{m.text}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {timeAgo(m.createdAt)}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={feedEndRef} />
              </div>

              <form onSubmit={handleSend} className="msg-input-bar">
                <input
                  type="text"
                  placeholder="Write your message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '12px 20px', color: '#ffffff', outline: 'none' }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--gradient-primary)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Send size={18} />
                </motion.button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                icon={MessageSquare}
                title="No conversation selected"
                description="Choose a conversation from the left to start chatting."
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
