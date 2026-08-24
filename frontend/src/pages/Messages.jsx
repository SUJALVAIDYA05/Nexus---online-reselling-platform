import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Send, User, ExternalLink, Package } from 'lucide-react';
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
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMsgTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const styles = `
  .msg-page { height: calc(100vh - var(--nav-height)); display: flex; overflow: hidden; background: var(--bg); }
  .msg-left { width: 360px; min-width: 360px; border-right: 1px solid var(--border); background: var(--bg-glass); backdrop-filter: blur(16px); display: flex; flex-direction: column; }
  .msg-left-head { padding: 20px 24px; border-bottom: 1px solid var(--border-light); }
  .msg-conv-list { flex: 1; overflow-y: auto; padding: 12px; }

  .msg-conv-item { display: flex; gap: 14px; padding: 14px; border-radius: var(--radius-xl); cursor: pointer; border: 1px solid transparent; transition: all 0.2s; margin-bottom: 6px; }
  .msg-conv-item:hover { background: rgba(255,255,255,0.05); }
  .msg-conv-item.active { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.3); }

  .msg-right { flex: 1; display: flex; flex-direction: column; background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0b0f19 100%); }
  .msg-right-head { padding: 16px 24px; border-bottom: 1px solid var(--border); background: var(--bg-glass-strong); display: flex; align-items: center; justify-content: space-between; gap: 16px; }

  .msg-feed { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
  
  .msg-row { display: flex; width: 100%; gap: 10px; }
  .msg-row.me { justify-content: flex-end; }
  .msg-row.other { justify-content: flex-start; }

  .msg-bubble-wrap { display: flex; flex-direction: column; max-width: 70%; }
  .msg-row.me .msg-bubble-wrap { align-items: flex-end; }
  .msg-row.other .msg-bubble-wrap { align-items: flex-start; }

  .msg-sender-tag { font-size: 11px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .msg-sender-tag.me { color: #fb7185; }
  .msg-sender-tag.other { color: #38bdf8; }

  .msg-bubble { padding: 13px 18px; font-size: 14.5px; line-height: 1.5; word-break: break-word; }
  
  .msg-bubble.me { 
    background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); 
    color: #ffffff; 
    border-radius: 18px 18px 4px 18px; 
    box-shadow: 0 4px 15px rgba(244,63,94,0.35);
  }
  
  .msg-bubble.other { 
    background: rgba(30, 41, 59, 0.95); 
    color: #f8fafc; 
    border-radius: 18px 18px 18px 4px; 
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  }

  .msg-time { font-size: 10.5px; opacity: 0.75; margin-top: 4px; }
  .msg-row.me .msg-time { text-align: right; color: rgba(255,255,255,0.85); }
  .msg-row.other .msg-time { text-align: left; color: var(--text-tertiary); }

  .msg-input-bar { padding: 18px 24px; border-top: 1px solid var(--border); background: var(--bg-glass-strong); display: flex; gap: 12px; align-items: center; }
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

  const myId = String(user?.id || user?._id || '');

  // Helper to extract partner from conversation participants
  const getPartner = useCallback((participants) => {
    if (!Array.isArray(participants) || participants.length === 0) return { name: 'User' };
    const found = participants.find(p => {
      const pId = String(typeof p === 'object' ? (p?._id || p?.id || '') : p || '');
      return pId && pId !== myId;
    });
    return found && typeof found === 'object' ? found : (typeof participants[0] === 'object' ? participants[0] : { name: 'User' });
  }, [myId]);

  // Load conversations list
  useEffect(() => {
    conversationsApi.list().then(data => {
      const arr = Array.isArray(data) ? data : (data.conversations || []);
      setConvos(arr);
      if (targetConvoId) {
        const found = arr.find(c => String(c._id) === String(targetConvoId));
        if (found) setActiveConvo(found);
      } else if (arr.length > 0) {
        setActiveConvo(arr[0]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [targetConvoId]);

  // Load and periodically refresh messages for the active conversation
  useEffect(() => {
    if (!activeConvo?._id) return;

    const fetchMessages = () => {
      conversationsApi.getMessages(activeConvo._id).then(data => {
        const list = Array.isArray(data) ? data : (data.messages || []);
        setMessages(list);
      }).catch(() => {});
    };

    fetchMessages();

    // Auto-poll messages every 4 seconds so real-time chat updates seamlessly
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [activeConvo?._id]);

  // Scroll to bottom when messages update
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
      const msgObj = newMsg.message || newMsg;
      setMessages(prev => [...prev, msgObj]);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  const activePartner = activeConvo ? getPartner(activeConvo.participants) : null;

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="msg-page">
        {/* Left sidebar: Conversations list */}
        <div className="msg-left">
          <div className="msg-left-head">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
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
                const partner = getPartner(c.participants);
                const isSelected = activeConvo?._id === c._id;
                return (
                  <div
                    key={c._id}
                    className={`msg-conv-item ${isSelected ? 'active' : ''}`}
                    onClick={() => { setActiveConvo(c); setSearchParams({ convo: c._id }); }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isSelected ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 16
                    }}>
                      {(partner.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>{partner.name || 'User'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeAgo(c.lastMessageAt || c.updatedAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.listing?.title ? `Item: ${c.listing.title}` : (c.lastMessage?.text || 'Click to view conversation')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right chat panel */}
        <div className="msg-right">
          {activeConvo ? (
            <>
              {/* Header with partner details and listing info */}
              <div className="msg-right-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {(activePartner?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: 16 }}>
                      {activePartner?.name || 'Conversation Partner'}
                    </div>
                    <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Active Chat
                    </div>
                  </div>
                </div>

                {activeConvo.listing && (
                  <Link
                    to={`/listings/${activeConvo.listing._id || activeConvo.listing}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 14px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Package size={15} color="var(--accent)" />
                    <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ffffff', fontWeight: 600 }}>
                      {activeConvo.listing.title || 'View Listing'}
                    </span>
                    <ExternalLink size={13} />
                  </Link>
                )}
              </div>

              {/* Message feed with distinct bubbles & sender tags */}
              <div className="msg-feed">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                    <p style={{ fontSize: 15, color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>No messages yet</p>
                    <p style={{ fontSize: 13 }}>Send a message below to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const senderId = String(typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id || '') : m.sender || '');
                    const isMe = Boolean(myId && senderId && myId === senderId);
                    const senderName = isMe ? 'You' : (typeof m.sender === 'object' && m.sender?.name ? m.sender.name : (activePartner?.name || 'Seller'));

                    return (
                      <motion.div
                        key={m._id || i}
                        className={`msg-row ${isMe ? 'me' : 'other'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Partner Avatar for incoming messages */}
                        {!isMe && (
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(56, 189, 248, 0.2)',
                            color: '#38bdf8',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            flexShrink: 0,
                            marginTop: 18
                          }}>
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="msg-bubble-wrap">
                          {/* Clear sender label above bubble */}
                          <div className={`msg-sender-tag ${isMe ? 'me' : 'other'}`}>
                            {isMe ? 'You' : senderName}
                          </div>

                          {/* Message Bubble */}
                          <div className={`msg-bubble ${isMe ? 'me' : 'other'}`}>
                            <div>{m.text}</div>
                          </div>

                          {/* Message timestamp */}
                          <div className="msg-time">
                            {formatMsgTime(m.createdAt)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={feedEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="msg-input-bar">
                <input
                  type="text"
                  placeholder={`Message ${activePartner?.name || 'seller'}...`}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '13px 22px',
                    color: '#ffffff',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
                <motion.button
                  type="submit"
                  disabled={!text.trim() || sending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: text.trim() ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: text.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    opacity: text.trim() ? 1 : 0.6
                  }}
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
                description="Choose a conversation from the left sidebar to view messages."
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
