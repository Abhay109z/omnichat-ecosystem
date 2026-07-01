
// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_URL || '${API_BASE_URL}';

const configSlice = createSlice({
  name: 'config',
  initialState: { botName: 'OmniBot', status: 'idle', message: '' },
  reducers: {
    setBotName: (state, action) => { state.botName = action.payload; },
    saveStart: (state) => { state.status = 'saving'; },
    saveSuccess: (state, action) => { state.status = 'saved'; state.message = action.payload; },
    saveFailure: (state, action) => { state.status = 'failed'; state.message = action.payload; }
  }
});
const { setBotName, saveStart, saveSuccess, saveFailure } = configSlice.actions;
const rtkStore = configureStore({ reducer: { config: configSlice.reducer } });

const saveBotConfiguration = (botName, token) => async (dispatch) => {
  dispatch(saveStart());
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ botName })
    });
    const data = await response.json();
    if (response.ok) dispatch(saveSuccess(data.message));
    else dispatch(saveFailure('Database write operation rejected.'));
  } catch (error) {
    dispatch(saveFailure('Gateway connection lost.'));
  }
};

const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const BotIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SunIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ArrowBackIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const useAuthStore = create((set) => ({
  token: localStorage.getItem('omnichatToken'),
  username: localStorage.getItem('omnichatUsername'),
  userId: localStorage.getItem('omnichatUserId'),
  isAdmin: localStorage.getItem('omnichatIsAdmin') === 'true',
  setAuth: (token, username, userId, isAdmin) => {
    localStorage.setItem('omnichatToken', token);
    localStorage.setItem('omnichatUsername', username);
    localStorage.setItem('omnichatUserId', userId);
    localStorage.setItem('omnichatIsAdmin', String(isAdmin)); // Use String() instead of toString() for safety
    set({ token, username, userId, isAdmin });
  },
  logout: () => {
    localStorage.removeItem('omnichatToken');
    localStorage.removeItem('omnichatUsername');
    localStorage.removeItem('omnichatUserId');
    localStorage.removeItem('omnichatIsAdmin');
    set({ token: null, username: null, userId: null, isAdmin: false });
  }
}));

const useThemeStore = create((set, get) => ({
  isDark: localStorage.getItem('omnichatTheme') !== 'light', // Default to dark
  toggleTheme: () => {
    const newTheme = !get().isDark;
    localStorage.setItem('omnichatTheme', newTheme ? 'dark' : 'light');
    set({ isDark: newTheme });
  }
}));

const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, { ...msg, id: crypto.randomUUID() }] })),
  setMessages: (msgs) => set({ messages: msgs.map(m => ({ ...m, id: crypto.randomUUID() })) }),
  updateLastMessage: (text) => set((state) => {
    const updatedMessages = [...state.messages];
    if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].sender === "bot") {
      updatedMessages[updatedMessages.length - 1].text += text;
    }
    return { messages: updatedMessages };
  }),
  setStreaming: (val) => set({ isStreaming: val }),
  clearMessages: () => set({ messages: [] })
}));

const TypingIndicator = ({ isDark = true }) => (
  <div className="flex items-end gap-2 max-w-[75%] mr-auto">
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
      <BotIcon className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
    </div>
    <div className={`p-3 rounded-xl rounded-tl-none ${isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  </div>
);

const suggestedPrompts = [
  "What is quantum computing?",
  "Tell me a joke",
  "Explain AI in simple terms",
  "Write a poem"
];

const renderTextWithCode = (text) => {
  const parts = [];
  const regex = /```([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const codeContent = match[1].trim();
    const firstLine = codeContent.split('\n')[0];
    let language = '';
    let code = codeContent;
    if (['javascript', 'js', 'python', 'java', 'go', 'rust', 'cpp', 'c'].includes(firstLine.toLowerCase())) {
      language = firstLine;
      code = codeContent.slice(firstLine.length).trim();
    }
    parts.push(
      <div key={match.index} className="mt-2 mb-2 bg-neutral-900 border border-neutral-700 rounded-lg p-3 overflow-x-auto">
        {language && <div className="text-xs text-neutral-500 mb-2">{language}</div>}
        <pre className="text-sm text-emerald-400 whitespace-pre-wrap">{code}</pre>
      </div>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isLogin 
        ? `${API_BASE_URL}/api/v1/auth/login` 
        : `${API_BASE_URL}/api/v1/auth/register`;
      const res = await fetch(url, {
        mode: 'cors', // Ensure CORS is enabled
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      const adminFlag = data.isAdmin === true;
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setAuth(data.token, data.username, data.userId, adminFlag);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    console.log("Using API URL:", API_BASE_URL);
    try {
      const url = `${API_BASE_URL}/api/v1/auth/guest`;
      console.log("Calling:", url);
      const res = await fetch(url, { method: 'POST' });
      console.log("Response status:", res.status);
      const text = await res.text();
      console.log("Response text:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON: ${text}`);
      }
      setAuth(data.token, data.username, data.userId, data.isAdmin || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600/20 rounded-full mb-4">
            <BotIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">OmniChat</h1>
          <p className="text-neutral-400">Your smart AI assistant</p>
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition disabled:opacity-50"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              isLogin ? 'Login' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-neutral-700" />
          <span className="px-4 text-sm text-neutral-500">or</span>
          <div className="flex-1 h-px bg-neutral-700" />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          Continue as Guest
        </button>

        <p className="text-center mt-6 text-neutral-400 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

function AdminDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [userChat, setUserChat] = useState([]);
  const { token } = useAuthStore();

  // Demo data for showcase
  const demoAnalytics = {
    totalUsers: 42,
    activeUsers: 18,
    totalMessages: 1250,
    messagesToday: 67,
    totalConversations: 38
  };

  const demoUsers = [
    { _id: 'demo1', username: 'johndoe', isGuest: false, isAdmin: false },
    { _id: 'demo2', username: 'Guest_12345', isGuest: true, isAdmin: false },
    { _id: 'demo3', username: 'sarahsmith', isGuest: false, isAdmin: false },
    { _id: 'demo4', username: 'techwizard', isGuest: false, isAdmin: false }
  ];

  const demoChat = [
    { _id: 'msg1', sender: 'user', text: 'Hello, can you help me with React hooks?', timestamp: Date.now() - 3600000 },
    { _id: 'msg2', sender: 'bot', text: 'Of course! React hooks are functions that let you use state and other React features without writing a class component. What specific hook would you like to know about?', timestamp: Date.now() - 3540000 },
    { _id: 'msg3', sender: 'user', text: 'How does useEffect work?', timestamp: Date.now() - 3480000 },
    { _id: 'msg4', sender: 'bot', text: 'useEffect is a hook that lets you perform side effects in your components. It takes two arguments: a function where you perform the side effect, and a dependency array that controls when the effect runs.', timestamp: Date.now() - 3420000 }
  ];

  const fetchData = async () => {
    if (token) {
      await fetchAnalytics();
      await fetchUsers();
    } else {
      // Fallback to demo data if not logged in
      setAnalytics(demoAnalytics);
      setUsers(demoUsers);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('${API_BASE_URL}/api/v1/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAnalytics(await res.json());
      else setAnalytics(demoAnalytics);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setAnalytics(demoAnalytics);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('${API_BASE_URL}/api/v1/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
      else setUsers(demoUsers);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers(demoUsers);
    }
  };

  const fetchUserChat = async (user) => {
    if (user._id.startsWith('demo')) {
      setUserChat(demoChat);
      setSelectedUser(user._id);
      setSelectedUserData(user);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/chat/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const chat = await res.json();
        setUserChat(chat);
        setSelectedUser(user._id);
        setSelectedUserData(user);
      } else {
        setUserChat(demoChat);
        setSelectedUser(user._id);
        setSelectedUserData(user);
      }
    } catch (err) {
      console.error('Failed to fetch user chat', err);
      setUserChat(demoChat);
      setSelectedUser(user._id);
      setSelectedUserData(user);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user and their chat history?')) return;
    if (userId.startsWith('demo')) {
      alert('Demo users cannot be deleted!');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('User deleted successfully');
        fetchData();
        if (selectedUser === userId) setSelectedUser(null);
      }
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const deleteChatHistory = async (userId) => {
    if (!confirm('Are you sure you want to delete this user\'s chat history?')) return;
    if (userId.startsWith('demo')) {
      alert('Demo chat history cannot be deleted!');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/chat/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Chat history deleted successfully');
        setUserChat([]);
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to delete chat history', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4 md:p-8">
      {!token && (
        <div className="mb-6 bg-blue-900/30 border border-blue-600 rounded-xl p-4 flex items-center gap-3">
          <span className="text-blue-400 text-2xl">ℹ️</span>
          <div>
            <h3 className="text-lg font-bold text-blue-300">Demo Mode Active</h3>
            <p className="text-sm text-blue-200">Showing sample data. Log in as admin for real data.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg bg-emerald-600 border border-emerald-600 hover:bg-emerald-500 text-white transition">
              <ArrowBackIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('analytics'); setSelectedUser(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'}`}
            >
              <ChartIcon className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => { setActiveTab('users'); setSelectedUser(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'}`}
            >
              <UsersIcon className="w-4 h-4 inline mr-2" />
              Users
            </button>
          </div>
        </div>

      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 overflow-y-auto">
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-300 font-medium">Total Users</h3>
                <UsersIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-4xl font-bold text-white">{analytics.totalUsers}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-300 font-medium">Active Today</h3>
                <ChartIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-white">{analytics.activeUsers}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-purple-300 font-medium">Total Messages</h3>
                <SparklesIcon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-4xl font-bold text-white">{analytics.totalMessages}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-orange-300 font-medium">Messages Today</h3>
                <ClockIcon className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-4xl font-bold text-white">{analytics.messagesToday}</div>
            </div>
            <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 border border-pink-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-pink-300 font-medium">Total Conversations</h3>
                <BotIcon className="w-8 h-8 text-pink-400" />
              </div>
              <div className="text-4xl font-bold text-white">{analytics.totalConversations}</div>
            </div>
          </div>
        )}
        {activeTab === 'users' && !selectedUser && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-neutral-800">
                    <th className="pb-3 font-medium">Username</th>
                    <th className="pb-3 font-medium">Guest</th>
                    <th className="pb-3 font-medium">Admin</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-b border-neutral-800">
                      <td className="py-4 text-white">{user.username}</td>
                      <td className="py-4 text-neutral-400">{user.isGuest ? 'Yes' : 'No'}</td>
                      <td className="py-4 text-neutral-400">{user.isAdmin ? 'Yes' : 'No'}</td>
                      <td className="py-4 flex gap-2">
                        <button onClick={() => fetchUserChat(user)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm">
                          View Chat
                        </button>
                        {!user.isAdmin && (
                          <button onClick={() => deleteUser(user._id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm">
                            Delete User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedUser && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-300">
                  <ArrowBackIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-white">Chat with {selectedUserData?.username}</h2>
              </div>
              <button onClick={() => deleteChatHistory(selectedUser)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium">
                <TrashIcon className="w-4 h-4 inline mr-2" />
                Delete Chat History
              </button>
            </div>
            {userChat.length > 0 ? (
              userChat.map(msg => (
                <div key={msg._id} className={`mb-4 flex items-end gap-2 max-w-[75%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-emerald-600' : 'bg-neutral-800'}`}>
                    {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <BotIcon className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className={`p-3 rounded-xl border ${msg.sender === 'user' ? 'bg-emerald-600 border-emerald-500 text-white rounded-tr-none' : 'bg-neutral-800 border-neutral-700 text-neutral-200 rounded-tl-none'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase font-mono tracking-widest opacity-60">
                        {msg.sender === 'user' ? selectedUserData?.username : 'Bot'}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-neutral-400 text-center py-10">No chat history found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatbotWorkspace() {
  const dispatch = useDispatch();
  const { botName, status, message } = useSelector((state) => state.config);
  const { token, username, logout, isAdmin } = useAuthStore();
  const { messages, isStreaming, addMessage, updateLastMessage, setStreaming, setMessages, clearMessages } = useChatStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [localName, setLocalName] = useState(botName);
  const [inputMessage, setInputMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [view, setView] = useState('chat');
  const [selectedImage, setSelectedImage] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('${API_BASE_URL}/api/v1/chat/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setMessages(data);
          else {
            setMessages([{
              id: crypto.randomUUID(),
              sender: 'bot',
              text: `Hello ${username}! Welcome to OmniChat! How can I assist you today?`,
              timestamp: new Date().toISOString()
            }]);
          }
        }
      } catch (err) {
        console.error('Failed to load history', err);
        setMessages([{
          id: crypto.randomUUID(),
          sender: 'bot',
          text: `Hello ${username}! Welcome to OmniChat! How can I assist you today?`,
          timestamp: new Date().toISOString()
        }]);
      }
    };
    fetchHistory();
  }, [token, username, setMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    dispatch(setBotName(localName));
    dispatch(saveBotConfiguration(localName, token));
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend = inputMessage) => {
    if ((!textToSend.trim() && !selectedImage) || isStreaming || !token) return;
    setInputMessage('');
    addMessage({ sender: 'user', text: textToSend, image: selectedImage, timestamp: new Date().toISOString() });
    setSelectedImage(null);
    addMessage({ sender: 'bot', text: '', timestamp: new Date().toISOString() });
    setStreaming(true);
    try {
      const response = await fetch('${API_BASE_URL}/api/v1/chatbot/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) throw new Error('Response not ok');
      if (!response.body) {
        updateLastMessage('Error: Failed to get response stream');
        setStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const rawText = decoder.decode(value, { stream: true });
        updateLastMessage(rawText);
      }
    } catch (err) {
      console.error(err);
      updateLastMessage('\n\n❌ Connection error. Please try again later.');
    } finally {
      setStreaming(false);
    }
  };

  const handleExportChat = () => {
    const content = messages.map(m => `${m.sender.toUpperCase()} (${formatTime(m.timestamp)}):\n${m.text}\n\n`).join('');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnichat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('chat')} />;
  }

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden relative transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-neutral-800'}`}>
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 p-5 flex flex-col gap-4 transform transition-all duration-300 md:relative md:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${isDark ? 'bg-neutral-900 border-r border-neutral-800' : 'bg-white border-r border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-600">OmniChat</h2>
              <p className={`text-xs font-mono ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Logged in as {username}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={`p-2 px-2 rounded md:hidden ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-800'}`}>✕</button>
        </div>

        <hr className={isDark ? 'border-neutral-800' : 'border-slate-200'} />

        <form onSubmit={handleConfigSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Bot Name</label>
            <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-slate-300 text-neutral-800'}`} />
          </div>
          <button type="submit" className="w-full rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 text-sm transition cursor-pointer shadow-sm">Update Bot</button>
        </form>

        {status !== 'idle' && (
          <div className={`p-3 rounded text-xs font-mono border ${status === 'saved' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-600 border border-slate-200')}`}>
            [{status.toUpperCase()}] {message || 'State processed.'}
          </div>
        )}

        <div className="mt-auto space-y-2">
          <button onClick={clearMessages} className={`w-full flex items-center justify-center gap-2 text-sm py-2 rounded transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-slate-600 hover:text-slate-800'}`}>
            <TrashIcon className="w-4 h-4" /> Clear Chat History
          </button>
          <button onClick={handleExportChat} className={`w-full flex items-center justify-center gap-2 text-sm py-2 rounded transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-slate-600 hover:text-slate-800'}`}>
            <DownloadIcon className="w-4 h-4" /> Export Chat
          </button>
        </div>
      </aside>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />}

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className={`border-b px-5 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 transition-colors duration-300 ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-slate-200 bg-white/70'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className={`p-2 py-1 rounded text-xs md:hidden cursor-pointer ${isDark ? 'bg-neutral-800 border border-neutral-700 text-neutral-300' : 'bg-slate-100 border border-slate-300 text-slate-700'}`}>☰</button>
            <h1 className="text-base font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chatting with <span className="text-emerald-600 font-mono">{botName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => setView('admin')} className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer font-bold shadow-lg">
              <ChartIcon className="w-5 h-5" /> Admin Dashboard
            </button>
            <button onClick={logout} className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer font-bold shadow-lg">
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === 'user' ? 'bg-emerald-600' : (isDark ? 'bg-neutral-800' : 'bg-slate-100')}`}>
                {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <BotIcon className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className={`flex flex-col rounded-xl px-4 py-3 border ${msg.sender === 'user' ? 'bg-emerald-600 border-emerald-500 text-white rounded-tr-none' : (isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-200 rounded-tl-none' : 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-sm')}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase font-mono tracking-widest opacity-60">
                    {msg.sender === 'user' ? username : botName}
                  </span>
                  {msg.timestamp && (
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      <ClockIcon className="w-3 h-3" /> {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
                {msg.image && (
                  <img src={msg.image} alt="Chat image" className={`mb-2 rounded-lg max-w-xs ${isDark ? 'border border-neutral-700' : 'border border-slate-200'}`} />
                )}
                {msg.text && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{renderTextWithCode(msg.text)}</p>
                )}
                <button onClick={() => handleCopyMessage(msg.text, msg.id)} className={`self-end text-xs flex items-center gap-1 transition-colors cursor-pointer ${isDark ? 'text-neutral-500 hover:text-neutral-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  <CopyIcon className="w-3 h-3" /> {copiedId === msg.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
          
          {isStreaming && <TypingIndicator isDark={isDark} />}

          {messages.length <= 1 && !isStreaming && (
            <div className="mt-2">
              <p className={`text-xs mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                <SparklesIcon className="w-3 h-3" /> Quick prompts to get started:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handleSendMessage(prompt)} className={`text-sm px-4 py-2 rounded-full border transition-all cursor-pointer ${isDark ? 'border-neutral-700 bg-neutral-800 hover:border-emerald-500 hover:text-emerald-400' : 'border-slate-300 bg-white hover:border-emerald-500 hover:text-emerald-600'}`}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {selectedImage && (
          <div className="px-4 pt-4">
            <div className="relative max-w-xs">
              <img src={selectedImage} alt="Selected" className={`rounded-xl border ${isDark ? 'border-neutral-700' : 'border-slate-300'}`} />
              <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                ✕
              </button>
            </div>
          </div>
        )}
        <footer className={`p-4 border-t backdrop-blur-md transition-colors duration-300 ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white/70 border-slate-200'}`}>
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-4xl mx-auto flex gap-3 items-center">
            <input 
              type="file" 
              accept="image/*" 
              id="image-upload" 
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setSelectedImage(ev.target.result);
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
            />
            <label htmlFor="image-upload" className={`p-3 rounded-xl border cursor-pointer transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500' : 'bg-white border-slate-300 text-slate-600 hover:text-emerald-600 hover:border-emerald-500'}`}>
              <ImageIcon className="w-5 h-5" />
            </label>
            <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} disabled={isStreaming} className={`flex-1 rounded-xl border px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-500'}`} placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'} />
            <button type="submit" disabled={isStreaming || (!inputMessage.trim() && !selectedImage)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 font-semibold text-sm uppercase tracking-wider font-mono rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md">
              <SparklesIcon className="w-4 h-4" /> Send
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const { token } = useAuthStore();
  return (
    <Provider store={rtkStore}>
      {token ? <ChatbotWorkspace /> : <LoginPage />}
    </Provider>
  );
}
