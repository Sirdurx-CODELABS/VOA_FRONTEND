'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { messageService } from '@/services/doctorApi.service';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MessageSquare, Send, Search, Plus, ArrowLeft,
  Loader2, Check, CheckCheck, Clock,
} from 'lucide-react';

interface Conversation {
  contactId: string;
  contactName: string;
  contactRole: 'doctor' | 'patient' | 'admin' | 'hospital';
  lastMessage: string;
  lastTime: string;
  unread: number;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function groupConversations(messages: Message[], doctorId: string): Conversation[] {
  const map = new Map<string, Message[]>();
  for (const m of messages) {
    const contact = m.sender._id === doctorId ? m.recipient : m.sender;
    if (!map.has(contact._id)) map.set(contact._id, []);
    map.get(contact._id)!.push(m);
  }
  const convs: Conversation[] = [];
  for (const [contactId, msgs] of map) {
    const sorted = msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latest = sorted[0];
    const contact = latest.sender._id === doctorId ? latest.recipient : latest.sender;
    convs.push({
      contactId,
      contactName: contact.name,
      contactRole: contact.role,
      lastMessage: latest.content,
      lastTime: latest.createdAt,
      unread: msgs.filter(m => m.sender._id !== doctorId && !m.isRead).length,
    });
  }
  return convs.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
}

export default function DoctorMessagesPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !doctor) return;
    try {
      const res = await messageService.getConversations();
      const msgs = res.data.data || [];
      setConversations(groupConversations(msgs, doctor._id));
    } catch {
      toast.error('Failed to load conversations');
    }
    setLoading(false);
  }, [isAuthenticated, doctor]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (contactId: string) => {
    setLoadingMessages(true);
    try {
      const res = await messageService.getConversation(contactId);
      setMessages(res.data.data || []);
      const unreadIds = (res.data.data || [])
        .filter(m => m.sender._id === contactId && !m.isRead)
        .map(m => m._id);
      await Promise.all(unreadIds.map(id => messageService.markAsRead(id).catch(() => {})));
      setConversations(prev => prev.map(c =>
        c.contactId === contactId ? { ...c, unread: 0 } : c
      ));
    } catch {
      toast.error('Failed to load messages');
    }
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (activeContactId) fetchMessages(activeContactId);
  }, [activeContactId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find(c => c.contactId === activeContactId);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeContactId || !activeConversation) return;
    setSending(true);
    try {
      const res = await messageService.send({
        recipientId: activeContactId,
        recipientRole: activeConversation.contactRole,
        subject: '',
        content: text,
      });
      setMessages(prev => [...prev, res.data.data]);
      setConversations(prev => prev.map(c =>
        c.contactId === activeContactId
          ? { ...c, lastMessage: text, lastTime: res.data.data.createdAt }
          : c
      ));
      setInput('');
    } catch {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowNewMsg(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel — Conversations */}
        <div className="w-80 shrink-0 rounded-xl border border-default bg-card-bg flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No conversations</p>
              <p className="text-xs text-muted mb-4">Start a new conversation with a patient or doctor</p>
              <button
                onClick={() => setShowNewMsg(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                New Message
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-default">
              {conversations.map(c => (
                <button
                  key={c.contactId}
                  onClick={() => setActiveContactId(c.contactId)}
                  className={cn(
                    'w-full text-left p-3.5 transition-colors hover:bg-hover',
                    activeContactId === c.contactId && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      c.contactRole === 'doctor'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-green-500/10 text-green-600'
                    )}>
                      {c.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{c.contactName}</p>
                        <span className="text-[10px] text-muted shrink-0">{formatTime(c.lastTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted truncate">{c.lastMessage}</p>
                        {c.unread > 0 && (
                          <span className="shrink-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Chat */}
        <div className="flex-1 rounded-xl border border-default bg-card-bg flex flex-col overflow-hidden">
          {!activeContactId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">Select a conversation</p>
              <p className="text-sm text-muted">Choose a conversation from the left or start a new one</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-default shrink-0">
                <button
                  onClick={() => setActiveContactId(null)}
                  className="lg:hidden p-1 -ml-1 rounded-md hover:bg-hover transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted" />
                </button>
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  activeConversation?.contactRole === 'doctor'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-green-500/10 text-green-600'
                )}>
                  {activeConversation?.contactName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {activeConversation?.contactName}
                  </p>
                  <p className="text-[10px] text-muted capitalize">
                    {activeConversation?.contactRole}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-muted">No messages yet</p>
                    <p className="text-xs text-muted mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.sender._id === doctor?._id;
                    return (
                      <div key={m._id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5',
                          isMine
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-hover text-foreground rounded-bl-sm'
                        )}>
                          {m.subject && (
                            <p className="text-[10px] opacity-70 font-medium mb-1">{m.subject}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                          <div className={cn(
                            'flex items-center gap-1 mt-1',
                            isMine ? 'justify-end' : 'justify-start'
                          )}>
                            <span className="text-[10px] opacity-60">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              m.isRead
                                ? <CheckCheck className="w-3 h-3 text-blue-200" />
                                : <Check className="w-3 h-3 opacity-60" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-default p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-hover border border-default rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/40 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMsg && (
        <NewMessageModal
          onClose={() => setShowNewMsg(false)}
          onSelect={(contactId, contactName, contactRole) => {
            setShowNewMsg(false);
            const exists = conversations.find(c => c.contactId === contactId);
            if (!exists) {
              setConversations(prev => [{
                contactId,
                contactName,
                contactRole,
                lastMessage: '',
                lastTime: new Date().toISOString(),
                unread: 0,
              }, ...prev]);
            }
            setActiveContactId(contactId);
          }}
        />
      )}
    </div>
  );
}

function NewMessageModal({ onClose, onSelect }: {
  onClose: () => void;
  onSelect: (id: string, name: string, role: 'doctor' | 'patient' | 'admin' | 'hospital') => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ _id: string; name: string; role: 'doctor' | 'patient' | 'admin' | 'hospital' }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { searchService } = await import('@/services/doctorApi.service');
        const res = await searchService.global(query);
        const patients = (res.data.data?.patients || []).map(p => ({ _id: p._id, name: p.name, role: 'patient' as const }));
        const doctors = (res.data.data?.consultations || [])
          .filter((c: any) => c.doctor?._id)
          .map((c: any) => ({ _id: c.doctor._id, name: c.doctor.name, role: 'doctor' as const }));
        const seen = new Set<string>();
        setResults([...patients, ...doctors].filter(r => { if (seen.has(r._id)) return false; seen.add(r._id); return true; }));
      } catch { /* ignore */ }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-default bg-card-bg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-default">
          <h2 className="text-sm font-semibold text-foreground">New Message</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-hover transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search patients or doctors..."
              className="w-full bg-hover border border-default rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/40 transition-colors"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {searching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted" />
            </div>
          ) : results.length === 0 ? (
            query.length >= 2 && (
              <p className="text-xs text-muted text-center py-6">No results found</p>
            )
          ) : (
            results.map(r => (
              <button
                key={r._id}
                onClick={() => onSelect(r._id, r.name, r.role)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-colors"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  r.role === 'doctor' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                )}>
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                  <p className="text-[10px] text-muted capitalize">{r.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
