import { useState, useRef, useEffect, useCallback } from 'react';
import { Course, COURSE_COLORS, generateId } from '../types';
import { useSchedule } from '../hooks/useSchedule';
import {
  chatWithAI,
  buildAgentPrompt,
  parseToolCalls,
  executeToolCall,
  parseFromImage,
  getAIConfig,
  saveAIConfig,
  MODEL_OPTIONS,
} from '../utils/aiParser';
import type { ApiType, ToolCall, ToolResult } from '../utils/aiParser';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isToolResult?: boolean;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODEL_LABELS: Record<string, string> = {
  deepseek_v4: 'DeepSeek V4 Pro',
  deepseek: 'DeepSeek V3',
  gpt4o: 'GPT-4o',
  openai: 'GPT-4o-mini',
  qwen: '通义千问',
};

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const { schedule, addCourse, updateCourse, deleteCourse, importCourses, clearAllCourses } = useSchedule();

  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState<ApiType>('deepseek_v4');
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 我是你的课表管家。

不只是聊天——我**能直接操作你的课表**：

📚 帮你加课删课
🔍 分析课表冲突
📊 总结一周安排
🧠 给你学习建议

告诉我你想做什么就行。比如：
"帮我看看这周课表有没有不合理的地方"
"周三下午太空了，帮我分析一下"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config = getAIConfig();
    if (config) {
      setApiKey(config.apiKey);
      setApiType((config.apiType as ApiType) || 'deepseek_v4');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 图片上传 ─────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const imgData = ev.target?.result as string;
      setImage(imgData);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: '🖼️ [上传课表图片]',
        timestamp: new Date(),
      }]);

      if (!apiKey.trim()) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '请先在⚙️设置中配置 API 密钥。',
          timestamp: new Date(),
        }]);
        return;
      }

      setIsLoading(true);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '🔍 正在识别课表图片...',
        timestamp: new Date(),
      }]);

      try {
        const courses = await parseFromImage(imgData, apiKey, apiType);
        if (courses.length > 0) {
          importCourses(courses);
          setMessages(prev => [...prev, {
            id: (Date.now() + 3).toString(),
            role: 'system',
            content: `✅ 识别并导入 ${courses.length} 门课程：\n${courses.map(c =>
              `• ${c.name} 周${'一二三四五六日'[c.dayOfWeek-1]} ${c.startSection}-${c.endSection}节${c.location ? ` ${c.location}` : ''}`
            ).join('\n')}`,
            timestamp: new Date(),
            isToolResult: true,
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 3).toString(),
            role: 'assistant',
            content: '抱歉，未能识别出课程。请确保图片清晰。',
            timestamp: new Date(),
          }]);
        }
      } catch (err: any) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: `❌ ${err.message}`,
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
        setImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── 发送消息（Agent 模式）─────────────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    const text = input;
    setInput('');
    setIsLoading(true);

    if (!apiKey.trim()) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '请先在⚙️设置中配置 API 密钥，我才能帮你操作课表。\n\n推荐用 **DeepSeek V4 Pro**，去 platform.deepseek.com 获取 Key。',
        timestamp: new Date(),
      }]);
      setIsLoading(false);
      return;
    }

    // 构建 Agent Prompt
    const agentPrompt = buildAgentPrompt(schedule.courses);

    // 构建对话历史（只保留最近的）
    const recentMsgs = messages
      .filter(m => m.role !== 'system' || m.isToolResult)
      .slice(-8)
      .map(m => ({ role: m.role === 'system' ? 'assistant' : m.role, content: m.content }));

    try {
      const response = await chatWithAI(
        [
          { role: 'system', content: agentPrompt },
          ...recentMsgs as any,
          { role: 'user', content: text },
        ],
        apiKey,
        apiType,
      );

      // 解析工具调用
      const toolCalls = parseToolCalls(response);

      if (toolCalls.length > 0) {
        // 先显示 AI 的文字回复
        const textOnly = response.replace(/```tool:[\s\S]*?```/g, '').trim();
        if (textOnly) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: textOnly,
            timestamp: new Date(),
          }]);
        }

        // 执行工具调用
        for (const call of toolCalls) {
          const result = executeToolCall(call, schedule.courses, {
            addCourse,
            updateCourse,
            deleteCourse,
            importCourses,
            clearAllCourses,
          });

          setMessages(prev => [...prev, {
            id: (Date.now() + Math.random()).toString(),
            role: 'system',
            content: result.success
              ? `✅ ${result.message}`
              : `❌ ${result.message}`,
            timestamp: new Date(),
            isToolResult: true,
          }]);
        }
      } else {
        // 无工具调用，直接显示回复
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${err.message || '出错了'}\n\n请检查 API 密钥和网络。`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full h-full sm:h-[90vh] sm:max-w-lg sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 头部 ──────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#2D3436' }}>课表管家</h2>
              <p className="text-xs" style={{ color: '#636E72' }}>
                {isLoading ? '处理中...' : apiKey ? MODEL_LABELS[apiType] || apiType : '未连接'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showSettings ? '#7c3aed' : '#636E72'} strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── 设置面板 ──────────────────────────────────── */}
        {showSettings && (
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 space-y-3 flex-shrink-0">
            <div>
              <label className="block text-xs text-purple-600 mb-1 font-medium">模型</label>
              <select
                value={apiType}
                onChange={(e) => setApiType(e.target.value as ApiType)}
                className="w-full p-2.5 text-sm border border-purple-200 rounded-lg bg-white"
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-purple-600 mb-1 font-medium">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入 API 密钥"
                className="w-full p-2.5 text-sm border border-purple-200 rounded-lg bg-white"
              />
            </div>
            <p className="text-xs text-purple-400">
              DeepSeek: platform.deepseek.com/api_keys &nbsp;|&nbsp; OpenAI: platform.openai.com
            </p>
            <button
              onClick={() => {
                saveAIConfig({ apiType, apiKey });
                setShowSettings(false);
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'system',
                  content: `✅ 已连接 ${MODEL_LABELS[apiType] || apiType}`,
                  timestamp: new Date(),
                  isToolResult: true,
                }]);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium rounded-lg"
            >
              保存配置
            </button>
          </div>
        )}

        {/* ── 消息列表 ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${msg.isToolResult ? 'justify-center' : ''}`}
            >
              {msg.isToolResult ? (
                <div className="px-4 py-2 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  {msg.content}
                </div>
              ) : (
                <>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-tr-sm'
                        : 'bg-gray-100 rounded-tl-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── 输入栏 ────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-border bg-white flex-shrink-0">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-border text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <div className="flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="告诉我你想做什么..."
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
