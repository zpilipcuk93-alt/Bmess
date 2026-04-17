import { useState, useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Message, Profile } from '../types'
import MessageItem from './MessageItem'

interface Props {
  session: Session
}

export default function ChatPage({ session }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      setProfile(data)
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(id, username, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data || [])
      setLoading(false)
    }

    fetchProfile()
    fetchMessages()

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .maybeSingle()
          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    setText('')
    await supabase.from('messages').insert({
      user_id: session.user.id,
      text: trimmed,
    })
  }

  const handleSignOut = () => supabase.auth.signOut()

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar-group">
            <div className="header-avatar">
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="12" fill="#2563eb" />
                <path d="M10 14h20M10 20h14M10 26h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="chat-title">Общий чат</h1>
              <span className="chat-online">онлайн</span>
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          {profile && <span className="current-user">@{profile.username}</span>}
          <button className="signout-btn" onClick={handleSignOut} title="Выйти">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="chat-messages">
        {loading ? (
          <div className="messages-loading"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Сообщений пока нет. Начните разговор!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === session.user.id}
                showAvatar={i === 0 || messages[i - 1]?.user_id !== msg.user_id}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="chat-input-area">
        <form onSubmit={sendMessage} className="chat-form">
          <input
            className="chat-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Написать сообщение..."
            autoComplete="off"
          />
          <button type="submit" className="send-btn" disabled={!text.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  )
}
