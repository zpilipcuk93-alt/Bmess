import type { Message } from '../types'

interface Props {
  message: Message
  isOwn: boolean
  showAvatar: boolean
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

function getAvatarColor(username: string) {
  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777']
  let hash = 0
  for (const c of username) hash = (hash + c.charCodeAt(0)) % colors.length
  return colors[hash]
}

export default function MessageItem({ message, isOwn, showAvatar }: Props) {
  const username = message.profiles?.username || 'Unknown'

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="avatar-slot">
          {showAvatar ? (
            <div
              className="avatar"
              style={{ background: getAvatarColor(username) }}
            >
              {getInitials(username)}
            </div>
          ) : (
            <div className="avatar-placeholder" />
          )}
        </div>
      )}
      <div className="message-content">
        {!isOwn && showAvatar && (
          <span className="message-username">@{username}</span>
        )}
        <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
          <span className="bubble-text">{message.text}</span>
          <span className="bubble-time">{formatTime(message.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
