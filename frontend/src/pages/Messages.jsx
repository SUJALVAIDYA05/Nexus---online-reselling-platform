import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Send, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { conversations as conversationsApi } from '../api/api';
import { PageLoader } from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

function timeAgo(date) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = `
  .messages-page {
    height: calc(100vh - var(--nav-height));
    display: flex;
    animation: fadeIn 0.4s var(--transition);
    overflow: hidden;
  }

  /* Left panel */
  .msg-panel-left {
    width: 400px;
    min-width: 400px;
    border-right: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    background: var(--bg-secondary);
    box-shadow: var(--shadow-card);
  }
  .msg-panel-header {
    padding: 24px 24px 0;
    flex-shrink: 0;
  }
  .msg-panel-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.3px;
  }
  .msg-panel-header h2 svg {
    color: var(--accent);
  }
  .msg-search-wrap {
    position: relative;
  }
  .msg-search-wrap svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
  }
  .msg-search {
    width: 100%;
    padding: 11px 16px 11px 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: all var(--transition);
  }
  .msg-search:focus {
    border-color: var(--accent);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .msg-search::placeholder {
    color: var(--text-tertiary);
  }

  .msg-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
  .msg-list::-webkit-scrollbar { width: 4px; }

  .msg-conversation {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 14px;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition);
    position: relative;
  }
  .msg-conversation:hover {
    background: var(--bg);
    box-shadow: var(--shadow-sm);
  }
  .msg-conversation.active {
    background: var(--accent-light);
    box-shadow: inset 3px 0 0 var(--accent);
  }
  .msg-conversation-avatar {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-xl);
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent-light), var(--bg-tertiary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--accent);
  }
  .msg-conversation-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .msg-conversation-body {
    flex: 1;
    min-width: 0;
  }
  .msg-conversation-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .msg-conversation-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .msg-conversation-time {
    font-size: 12px;
    color: var(--text-tertiary);
    flex-shrink: 0;
    margin-left: 8px;
    font-weight: 500;
  }
  .msg-conversation-preview {
    font-size: 13px;
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
  }
  .msg-conversation-unread {
    position: absolute;
    top: 16px;
    right: 14px;
  }

  /* Right panel */
  .msg-panel-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    min-width: 0;
  }
  .msg-thread-header {
    padding: 16px 28px;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    box-shadow: var(--shadow-xs);
  }
  .msg-thread-back {
    display: none;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
    border: none;
    background: var(--bg);
  }
  .msg-thread-back:hover {
    background: var(--bg-tertiary);
    color: var(--text);
  }
  .msg-thread-avatar {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent-light), var(--bg-tertiary));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
  }
  .msg-thread-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .msg-thread-info {
    flex: 1;
    min-width: 0;
  }
  .msg-thread-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }
  .msg-thread-listing {
    font-size: 12px;
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
  .msg-thread-listing a {
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
    transition: color var(--transition-fast);
  }
  .msg-thread-listing a:hover {
    text-decoration: underline;
  }

  .msg-messages {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .msg-date-divider {
    text-align: center;
    margin: 20px 0;
    position: relative;
  }
  .msg-date-divider span {
    background: var(--bg);
    padding: 0 16px;
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
    position: relative;
    z-index: 1;
    letter-spacing: 0.3px;
  }

  .msg-bubble-row {
    display: flex;
    margin-bottom: 4px;
  }
  .msg-bubble-row.sent {
    justify-content: flex-end;
  }
  .msg-bubble-row.received {
    justify-content: flex-start;
  }

  .msg-bubble {
    max-width: 65%;
    padding: 12px 18px;
    border-radius: 20px;
    font-size: 14px;
    line-height: 1.55;
    word-break: break-word;
    transition: transform var(--transition-fast);
  }
  .msg-bubble.sent {
    background: linear-gradient(135deg, var(--accent), #d63851);
    color: #fff;
    border-bottom-right-radius: 8px;
    box-shadow: 0 2px 8px rgba(233, 69, 96, 0.25);
  }
  .msg-bubble.received {
    background: var(--bg-secondary);
    color: var(--text);
    border: 1px solid var(--border-light);
    border-bottom-left-radius: 8px;
    box-shadow: var(--shadow-xs);
  }
  .msg-bubble-time {
    font-size: 11px;
    margin-top: 6px;
    opacity: 0.7;
  }
  .msg-bubble.sent .msg-bubble-time {
    text-align: right;
    color: rgba(255,255,255,0.8);
  }
  .msg-bubble.received .msg-bubble-time {
    color: var(--text-tertiary);
  }

  /* Input */
  .msg-input-bar {
    padding: 18px 28px;
    border-top: 1px solid var(--border-light);
    background: var(--bg-secondary);
    display: flex;
    align-items: flex-end;
    gap: 14px;
    flex-shrink: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
  }
  .msg-input {
    flex: 1;
    padding: 12px 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-2xl);
    font-size: 14px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    resize: none;
    max-height: 100px;
    line-height: 1.5;
    transition: all var(--transition);
  }
  .msg-input:focus {
    border-color: var(--accent);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .msg-input::placeholder {
    color: var(--text-tertiary);
  }
  .msg-send-btn {
    width: 46px;
    height: 46px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, var(--accent), #d63851);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(233, 69, 96, 0.3);
  }
  .msg-send-btn:hover {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 16px rgba(233, 69, 96, 0.4);
  }
  .msg-send-btn:active {
    transform: scale(0.97);
  }
  .msg-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .msg-empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  .msg-list-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  @media (max-width: 768px) {
    .msg-panel-left {
      width: 100%;
      min-width: 100%;
    }
    .msg-panel-right {
      position: fixed;
      inset: 0;
      top: var(--nav-height);
      z-index: 50;
      display: none;
    }
    .msg-panel-right.mobile-open {
      display: flex;
    }
    .msg-thread-back {
      display: flex;
    }
    .messages-page.hide-left .msg-panel-left {
      display: none;
    }
    .messages-page.hide-left .msg-panel-right {
      display: flex;
    }
    .msg-bubble {
      max-width: 85%;
    }
  }
`;

export default function Messages() {
  const { user } = useAuth();
  const [convoList, setConvoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await conversationsApi.list();
      setConvoList(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const activeConvo = convoList.find((c) => c._id === activeId);

  const otherParticipant = (convo) => {
    if (!convo.participants || !user) return null;
    return convo.participants.find((p) => p._id !== user._id) || convo.participants[0];
  };

  const loadMessages = useCallback(async (convoId) => {
    setLoadingMessages(true);
    try {
      const data = await conversationsApi.getMessages(convoId, { page: 1, limit: 50 });
      setMessages(data.messages || []);
      conversationsApi.markRead(convoId).catch(() => {});
      setConvoList((prev) =>
        prev.map((c) => c._id === convoId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
    }
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (id) => {
    setActiveId(id);
    setMobileShowThread(true);
  };

  const handleBack = () => {
    setMobileShowThread(false);
    setTimeout(() => setActiveId(null), 300);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !activeId) return;

    setSending(true);
    setInputText('');

    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, avatarUrl: user.avatarUrl },
      text,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const msg = await conversationsApi.sendMessage(activeId, text);
      setMessages((prev) => prev.map((m) => m._id === optimisticMsg._id ? msg : m));
      setConvoList((prev) =>
        prev.map((c) =>
          c._id === activeId
            ? { ...c, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Send failed', err);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = convoList.filter((c) => {
    if (!searchQuery.trim()) return true;
    const other = otherParticipant(c);
    const q = searchQuery.toLowerCase();
    return (
      (other?.name || '').toLowerCase().includes(q) ||
      (c.listing?.title || '').toLowerCase().includes(q)
    );
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastDate = '';
    msgs.forEach((msg) => {
      const d = new Date(msg.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      if (d !== lastDate) {
        groups.push({ type: 'date', date: d, key: d });
        lastDate = d;
      }
      groups.push({ type: 'message', data: msg, key: msg._id });
    });
    return groups;
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="messages-page">
          <PageLoader />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`messages-page ${activeId && mobileShowThread ? 'hide-left' : ''}`}>
        <div className="msg-panel-left">
          <div className="msg-panel-header">
            <h2><MessageSquare size={22} /> Messages</h2>
            <div className="msg-search-wrap">
              <Search size={16} />
              <input
                className="msg-search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="msg-list">
            {filtered.length === 0 ? (
              <div className="msg-list-empty">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations"
                  description={searchQuery ? 'No results found.' : 'Start a conversation from a listing page.'}
                />
              </div>
            ) : (
              filtered.map((convo) => {
                const other = otherParticipant(convo);
                return (
                  <div
                    key={convo._id}
                    className={`msg-conversation ${activeId === convo._id ? 'active' : ''}`}
                    onClick={() => selectConversation(convo._id)}
                  >
                    <div className="msg-conversation-avatar">
                      {other?.avatarUrl ? (
                        <img src={other.avatarUrl} alt={other.name} />
                      ) : (
                        getInitials(other?.name)
                      )}
                    </div>
                    <div className="msg-conversation-body">
                      <div className="msg-conversation-top">
                        <span className="msg-conversation-name">
                          {other?.name || 'Unknown User'}
                        </span>
                        <span className="msg-conversation-time">
                          {timeAgo(convo.lastMessageAt)}
                        </span>
                      </div>
                      <div className="msg-conversation-preview">
                        {convo.listing?.title && (
                          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            {convo.listing.title}:{' '}
                          </span>
                        )}
                        Re: {convo.listing?.title || 'Conversation'}
                      </div>
                    </div>
                    {convo.unreadCount > 0 && (
                      <div className="msg-conversation-unread">
                        <Badge variant="accent" size="sm">{convo.unreadCount}</Badge>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`msg-panel-right ${mobileShowThread ? 'mobile-open' : ''}`}>
          {!activeId ? (
            <div className="msg-empty-state">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list to start messaging."
              />
            </div>
          ) : (
            <>
              <div className="msg-thread-header">
                <button className="msg-thread-back" onClick={handleBack}>
                  <ArrowLeft size={20} />
                </button>
                <div className="msg-thread-avatar">
                  {otherParticipant(activeConvo)?.avatarUrl ? (
                    <img src={otherParticipant(activeConvo).avatarUrl} alt="" />
                  ) : (
                    getInitials(otherParticipant(activeConvo)?.name)
                  )}
                </div>
                <div className="msg-thread-info">
                  <div className="msg-thread-name">
                    {otherParticipant(activeConvo)?.name || 'Unknown'}
                  </div>
                  {activeConvo?.listing && (
                    <div className="msg-thread-listing">
                      <Link to={`/listing/${activeConvo.listing._id}`}>
                        {activeConvo.listing.title}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="msg-messages" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <div className="spinner-container" style={{ width: 32, height: 32 }}>
                      <svg className="spinner-svg" viewBox="0 0 50 50" style={{ width: 32, height: 32 }}>
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="var(--accent)" strokeDasharray="80 40" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                    No messages yet. Say hello!
                  </div>
                ) : (
                  groupMessagesByDate(messages).map((item) => {
                    if (item.type === 'date') {
                      return (
                        <div key={item.key} className="msg-date-divider">
                          <span>{item.date}</span>
                        </div>
                      );
                    }
                    const msg = item.data;
                    const isSent = msg.sender?._id === user?._id;
                    return (
                      <div key={item.key} className={`msg-bubble-row ${isSent ? 'sent' : 'received'}`}>
                        <div className={`msg-bubble ${isSent ? 'sent' : 'received'}`}>
                          {msg.text}
                          <div className="msg-bubble-time">
                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit', hour12: true,
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="msg-input-bar">
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  placeholder="Type a message..."
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="msg-send-btn"
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
