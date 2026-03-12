import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [tapsLeft, setTapsLeft] = useState(100)
  const [darkMode, setDarkMode] = useState(false)
  const [tapCooldown, setTapCooldown] = useState(false)
  const [currentTab, setCurrentTab] = useState('home')
  
  // Чат
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [users, setUsers] = useState([])
  const [chatWith, setChatWith] = useState('global')

  // Создание пользователей
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newRole, setNewRole] = useState('worker')

  const API_URL = 'https://baksa-bank-backend.onrender.com'

  useEffect(() => {
    if (user) {
      fetchTapStatus()
      fetchUsers()
      // Пример сообщений
      setChatMessages([
        { id: 1, sender: 'superadmin', text: 'Всем привет! 👋', time: '12:00' }
      ])
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users?admin=${user.username}`)
      const data = await res.json()
      setUsers(data.filter(u => u.username !== user.username))
    } catch (e) {
      console.log('Ошибка загрузки пользователей')
    }
  }

  const fetchTapStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tap/status?username=${user.username}`)
      const data = await res.json()
      setTapsLeft(data.taps_left)
    } catch (e) {
      console.log('Тапалка временно недоступна')
    }
  }

  const login = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
      } else {
        alert('Неверный логин или пароль')
      }
    } catch (error) {
      alert('Ошибка: сервер не отвечает')
    }
  }

  const transfer = async () => {
    if (!receiver || !amount) {
      alert('Введи кому и сколько')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/transfer?sender=${user.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_username: receiver,
          amount: Number(amount)
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ ${data.message}`)
        setUser({ ...user, balance: data.new_balance })
      } else {
        setMessage(`❌ Ошибка: ${data.detail}`)
      }
    } catch (e) {
      alert('Ошибка перевода')
    }
  }

  const handleTap = async () => {
    if (tapCooldown) return
    if (tapsLeft <= 0) {
      setMessage('❌ Лимит на сегодня')
      return
    }

    setTapCooldown(true)
    try {
      const res = await fetch(`${API_URL}/api/tap?username=${user.username}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...user, balance: data.balance })
        setTapsLeft(data.taps_left)
        setMessage(`🪙 +1 бакс! Осталось ${data.taps_left}`)
      }
    } catch (e) {
      console.log('Тап не сработал')
    }
    setTimeout(() => setTapCooldown(false), 500)
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const newMsg = {
      id: chatMessages.length + 1,
      sender: user.username,
      text: chatInput,
      time: new Date().toLocaleTimeString().slice(0,5)
    }
    setChatMessages([...chatMessages, newMsg])
    setChatInput('')
  }

  const createUser = async () => {
    if (!newUsername || !newPassword || !newFullName) {
      alert('Заполни все поля')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/users/create?admin=${user.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          full_name: newFullName,
          role: newRole
        })
      })
      const data = await res.json()
      alert(data.message)
      if (data.success) {
        setNewUsername('')
        setNewPassword('')
        setNewFullName('')
        setNewRole('worker')
      }
    } catch (e) {
      alert('Ошибка создания')
    }
  }

  const theme = {
    background: darkMode ? '#1a1a1a' : '#f0f2f5',
    card: darkMode ? '#2d2d2d' : 'white',
    text: darkMode ? '#fff' : '#000',
    input: {
      background: darkMode ? '#3d3d3d' : 'white',
      color: darkMode ? '#fff' : '#000',
      border: darkMode ? '#555' : '#ddd'
    }
  }

  if (!user) {
    return (
      <div style={{ ...styles.container, background: theme.card, color: theme.text }}>
        <h1 style={styles.logo}>🏦 Бакса Банк</h1>
        <input 
          style={{ ...styles.input, ...theme.input }}
          placeholder="Логин" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
        />
        <input 
          style={{ ...styles.input, ...theme.input }}
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button style={styles.button} onClick={login}>Войти</button>
      </div>
    )
  }

  return (
    <div style={{ ...styles.appContainer, background: theme.background }}>
      <div style={{ ...styles.card, background: theme.card, color: theme.text }}>
        {message && <div style={styles.message}>{message}</div>}
        
        <div style={styles.content}>
          {currentTab === 'home' && (
            <div>
              <h2>👋 {user.full_name}</h2>
              <div style={{ ...styles.balance, background: theme.background }}>
                <h3>💰 Баланс: {user.balance} баксов</h3>
              </div>
            </div>
          )}

          {currentTab === 'transfer' && (
            <div>
              <h2>💸 Перевод</h2>
              <input 
                style={{ ...styles.input, ...theme.input }}
                placeholder="Кому (логин)" 
                value={receiver} 
                onChange={e => setReceiver(e.target.value)} 
              />
              <input 
                style={{ ...styles.input, ...theme.input }}
                type="number" 
                placeholder="Сумма" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
              />
              <button style={styles.button} onClick={transfer}>Перевести</button>
            </div>
          )}

          {currentTab === 'tap' && (
            <div style={styles.tapContainer}>
              <h2>🪙 Тапалка</h2>
              <p>Осталось: {tapsLeft}/100</p>
              <button 
                onClick={handleTap} 
                style={{
                  ...styles.tapButton,
                  opacity: tapsLeft === 0 ? 0.5 : 1,
                  background: theme.card
                }}
                disabled={tapCooldown || tapsLeft === 0}
              >
                <span style={styles.tapButtonText}>💵</span>
              </button>
            </div>
          )}

          {currentTab === 'chat' && (
            <div style={styles.chatContainer}>
              <h2>💬 Чат</h2>
              <select 
                style={{ ...styles.input, ...theme.input }}
                value={chatWith}
                onChange={e => setChatWith(e.target.value)}
              >
                <option value="global">🌍 Общий</option>
                {users.map(u => (
                  <option key={u.id} value={u.username}>{u.full_name}</option>
                ))}
              </select>

              <div style={styles.messages}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{
                    ...styles.message,
                    alignSelf: msg.sender === user.username ? 'flex-end' : 'flex-start',
                    background: msg.sender === user.username ? '#0066ff' : '#e9ecef',
                    color: msg.sender === user.username ? 'white' : 'black'
                  }}>
                    <div>{msg.sender}: {msg.text}</div>
                    <div style={styles.messageTime}>{msg.time}</div>
                  </div>
                ))}
              </div>

              <div style={styles.chatInputContainer}>
                <input 
                  style={{ ...styles.chatInput, ...theme.input }}
                  placeholder="Сообщение"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <button style={styles.sendButton} onClick={sendMessage}>➡️</button>
              </div>
            </div>
          )}

          {currentTab === 'admin' && user.role === 'super_admin' && (
            <div>
              <h2>👑 Создать пользователя</h2>
              <input 
                style={{ ...styles.input, ...theme.input }}
                placeholder="Логин"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
              <input 
                style={{ ...styles.input, ...theme.input }}
                type="password"
                placeholder="Пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <input 
                style={{ ...styles.input, ...theme.input }}
                placeholder="Имя"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
              />
              <select 
                style={{ ...styles.input, ...theme.input }}
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <option value="worker">Рабочий</option>
                <option value="admin">Админ</option>
              </select>
              <button style={styles.button} onClick={createUser}>Создать</button>
            </div>
          )}

          {currentTab === 'settings' && (
            <div>
              <h2>⚙️ Настройки</h2>
              <div style={styles.settingItem}>
                <span>🌙 Тёмная тема</span>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  style={styles.toggleButton}
                >
                  {darkMode ? '✅ Вкл' : '⬜ Выкл'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...styles.bottomMenu, background: theme.background }}>
          {[
            { id: 'home', icon: '🏠', label: 'Главная' },
            { id: 'transfer', icon: '💸', label: 'Перевод' },
            { id: 'tap', icon: '🪙', label: 'Тапалка' },
            { id: 'chat', icon: '💬', label: 'Чат' },
            ...(user.role === 'super_admin' ? [{ id: 'admin', icon: '👑', label: 'Админ' }] : []),
            { id: 'settings', icon: '⚙️', label: 'Настройки' }
          ].map(item => (
            <button 
              key={item.id}
              style={{
                ...styles.menuItem,
                color: currentTab === item.id ? '#0066ff' : '#666'
              }}
              onClick={() => setCurrentTab(item.id)}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    fontFamily: 'Arial'
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  content: {
    padding: '20px',
    minHeight: '450px'
  },
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  logo: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxSizing: 'border-box',
    fontSize: '16px'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#0066ff',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '15px',
    fontWeight: 'bold'
  },
  balance: {
    padding: '20px',
    borderRadius: '15px',
    margin: '20px 0'
  },
  bottomMenu: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 5px',
    borderTop: '1px solid #eee'
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '10px'
  },
  menuIcon: {
    fontSize: '20px',
    marginBottom: '4px'
  },
  tapContainer: {
    textAlign: 'center',
    padding: '20px 0'
  },
  tapButton: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    border: 'none',
    cursor: 'pointer',
    margin: '20px auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  },
  tapButtonText: {
    animation: 'spin 4s linear infinite'
  },
  message: {
    background: '#0066ff',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    margin: '10px',
    textAlign: 'center'
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee'
  },
  toggleButton: {
    padding: '8px 16px',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer'
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '10px'
  },
  message: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '15px',
    position: 'relative'
  },
  messageTime: {
    fontSize: '9px',
    textAlign: 'right',
    marginTop: '3px',
    opacity: 0.7
  },
  chatInputContainer: {
    display: 'flex',
    gap: '8px'
  },
  chatInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    fontSize: '14px'
  },
  sendButton: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    background: '#0066ff',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer'
  }
}

const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

export default App