import { useState, useEffect } from 'react';
import {
  cloudRegister,
  cloudLogin,
  saveCloudSession,
  loadCloudSession,
  clearCloudSession,
} from '../utils/cloudStore';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (userId: string, sessionToken: string, userName: string) => void;
}

export function LoginModal({ isOpen, onLogin }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // 自动检测是否已登录
  useEffect(() => {
    if (isOpen) {
      const session = loadCloudSession();
      if (session) {
        // 已登录，直接进入
        setStatusMsg('检测到已登录账号，自动进入...');
        setTimeout(() => {
          onLogin(session.userId, session.sessionToken, session.username);
        }, 500);
      }
    }
  }, [isOpen, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      setLoading(false);
      return;
    }

    if (username.trim().length < 2) {
      setError('账号至少 2 个字符');
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('密码至少 4 位');
      setLoading(false);
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('两次密码不一致');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        const result = await cloudRegister(username.trim(), password);
        saveCloudSession({
          userId: result.userId,
          sessionToken: result.sessionToken,
          username: username.trim(),
        });
        onLogin(result.userId, result.sessionToken, username.trim());
      } else {
        const result = await cloudLogin(username.trim(), password);
        saveCloudSession({
          userId: result.userId,
          sessionToken: result.sessionToken,
          username: result.username || username.trim(),
        });
        onLogin(result.userId, result.sessionToken, result.username || username.trim());
      }
    } catch (err: any) {
      const msg = err.message || '操作失败';
      if (msg.includes('already exists') || msg.includes('202')) {
        setError('该账号已被注册，请直接登录');
      } else if (msg.includes('username or password') || msg.includes('101')) {
        setError('账号或密码错误');
      } else if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
        setError('网络连接失败，请检查网络');
      } else {
        setError(msg.length > 50 ? '操作失败，请重试' : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setConfirmPassword('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ── 头部 ──────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-3xl">📅</span>
          </div>
          <h1 className="text-xl font-bold text-white">校园课表</h1>
          <p className="text-sm text-white/70 mt-1">
            {mode === 'login' ? '登录同步你的课表' : '注册账号开始使用'}
          </p>
        </div>

        {/* ── 表单 ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2D3436' }}>
              账号
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="设置你的账号名"
              autoComplete="username"
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{ color: '#2D3436' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#2D3436' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '至少 4 位' : '输入密码'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{ color: '#2D3436' }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#2D3436' }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再输一遍"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{ color: '#2D3436' }}
              />
            </div>
          )}

          {/* ── 错误提示 ────────────────────────────────── */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* ── 状态提示 ────────────────────────────────── */}
          {statusMsg && !error && (
            <div className="text-center text-sm" style={{ color: '#636E72' }}>
              {statusMsg}
            </div>
          )}

          {/* ── 按钮 ────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                {mode === 'login' ? '登录中...' : '注册中...'}
              </span>
            ) : mode === 'login' ? (
              '登录'
            ) : (
              '注册'
            )}
          </button>

          {/* ── 切换模式 ────────────────────────────────── */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm hover:underline"
              style={{ color: '#0984E3' }}
            >
              {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
