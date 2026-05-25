import { useState, useRef, useEffect } from 'react';
import { Course } from '../types';
import { useSchedule } from '../hooks/useSchedule';
import { parseCoursesFromOCRText, validateOCRResult } from '../utils/ocr';
import { parseFromImage, getAIConfig } from '../utils/aiParser';
import Tesseract from 'tesseract.js';

interface ScreenshotImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportTab = 'text' | 'image' | 'edu';
type RecognitionMethod = 'ocr' | 'ai-vision' | null;

export function ScreenshotImportModal({ isOpen, onClose }: ScreenshotImportModalProps) {
  const { importCourses } = useSchedule();

  // ── Tab 状态 ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ImportTab>('text');

  // ── 图片状态 ────────────────────────────────────────────
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 处理状态 ────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [lastMethod, setLastMethod] = useState<RecognitionMethod>(null);

  // ── 结果状态 ────────────────────────────────────────────
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [rawText, setRawText] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [manualText, setManualText] = useState('');

  // ── AI 配置状态 ─────────────────────────────────────────
  const [aiConfig, setAiConfig] = useState<{ apiType: string; apiKey: string } | null>(null);

  // 教务系统状态
  const [eduSystemUrl, setEduSystemUrl] = useState(
    () => localStorage.getItem('eduSystemUrl') || '',
  );
  const [eduUsername, setEduUsername] = useState(
    () => localStorage.getItem('eduUsername') || '',
  );
  const [eduPassword, setEduPassword] = useState('');
  const [rememberAccount, setRememberAccount] = useState(
    () => !!localStorage.getItem('eduUsername'),
  );

  // ── 加载 AI 配置 ────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const config = getAIConfig();
      setAiConfig(config);
    }
  }, [isOpen]);

  // ── 图片选择 ────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件（JPG/PNG）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setError('');
      setPreviewCourses([]);
      setRawText('');
      setLastMethod(null);
    };
    reader.readAsDataURL(file);
  };

  // ── Tesseract OCR 识别 ──────────────────────────────────
  const handleOCRRecognize = async () => {
    if (!image) return;

    setIsProcessing(true);
    setStatus('正在初始化 OCR 引擎...');
    setError('');
    setProgress(0);
    setLastMethod('ocr');

    try {
      const result = await Tesseract.recognize(image, 'chi_sim+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatus(`OCR 识别中... ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading language traineddata') {
            setStatus('正在加载中文语言包（首次使用需下载约 10MB）...');
          }
        },
      });

      const text = result.data.text;
      setRawText(text);
      setManualText(text);
      setStatus('正在解析课程信息...');

      const courses = parseCoursesFromOCRText(text);
      setPreviewCourses(courses);

      // 验证结果质量
      const validation = validateOCRResult(courses);
      if (!validation.valid) {
        setError(validation.message);
        setStatus('');
      } else {
        setStatus(validation.message);
      }
    } catch (err: any) {
      console.error('OCR 错误:', err);
      setError(`OCR 识别失败：${err.message || '请尝试使用 AI 视觉识别'}`);
      setStatus('');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // ── AI 视觉识别 ─────────────────────────────────────────
  const handleAIVisionRecognize = async () => {
    if (!image) return;
    if (!aiConfig?.apiKey) {
      setError('请先在设置中配置 AI API 密钥');
      return;
    }
    if (aiConfig.apiType === 'deepseek') {
      setError('DeepSeek 不支持图片识别。请在设置中切换为 OpenAI（GPT-4o）或通义千问（qwen-vl-max）');
      return;
    }

    setIsProcessing(true);
    setStatus('正在使用 AI 视觉识别课表...');
    setError('');
    setLastMethod('ai-vision');

    try {
      const courses = await parseFromImage(
        image,
        aiConfig.apiKey,
        aiConfig.apiType as 'openai' | 'qwen' | 'deepseek',
      );

      setPreviewCourses(courses);

      if (courses.length === 0) {
        setError('AI 未能识别到课程信息，请确认图片包含课表内容');
        setStatus('');
      } else {
        setStatus(`AI 识别成功：${courses.length} 门课程`);
      }
    } catch (err: any) {
      console.error('AI 视觉识别错误:', err);
      setError(`AI 识别失败：${err.message || '请检查 API 密钥和网络连接'}`);
      setStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 手动文本输入 ────────────────────────────────────────
  const handleManualInput = (text: string) => {
    setManualText(text);
    const courses = parseCoursesFromOCRText(text);
    setPreviewCourses(courses);
    const validation = validateOCRResult(courses);
    if (!validation.valid && text.trim()) {
      setError(validation.message);
    } else {
      setError('');
    }
    if (validation.valid) {
      setStatus(validation.message);
    }
  };

  // ── 导入操作 ────────────────────────────────────────────
  const handleImport = () => {
    if (previewCourses.length === 0) {
      setError('没有可导入的课程');
      return;
    }
    importCourses(previewCourses);
    onClose();
    resetState();
  };

  const resetState = () => {
    setImage(null);
    setPreviewCourses([]);
    setError('');
    setStatus('');
    setRawText('');
    setManualText('');
    setLastMethod(null);
  };

  // ── 拖拽处理 ────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setError('');
        setPreviewCourses([]);
        setRawText('');
        setLastMethod(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleOpenEduSystem = () => {
    if (!eduSystemUrl.trim()) {
      setError('请输入教务系统网址');
      return;
    }
    if (rememberAccount) {
      localStorage.setItem('eduSystemUrl', eduSystemUrl.trim());
      if (eduUsername) localStorage.setItem('eduUsername', eduUsername);
    } else {
      localStorage.removeItem('eduSystemUrl');
      localStorage.removeItem('eduUsername');
    }
    window.open(eduSystemUrl.trim(), '_blank');
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'text' as ImportTab, label: '文本粘贴', icon: '📝' },
    { id: 'image' as ImportTab, label: '图片导入', icon: '🖼️' },
    { id: 'edu' as ImportTab, label: '教务系统', icon: '🌐' },
  ];

  const canUseAIVision =
    aiConfig?.apiKey && aiConfig.apiType !== 'deepseek';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-screen sm:max-h-[90vh] h-full sm:h-auto flex flex-col mobile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 标题栏 ──────────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#2D3436' }}>
              导入课表
            </h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#636E72' }}>
              截图识别 / 文本粘贴 / AI 视觉识别
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Tab 栏 ─────────────────────────────────────── */}
        <div className="flex border-b border-border flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-accent' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" style={{ backgroundColor: '#0984E3' }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ═══════════════════════════════════════════════════
              文本粘贴 Tab
          ═══════════════════════════════════════════════════ */}
          {activeTab === 'text' && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">直接粘贴课程文字</span>
                </div>
                <p className="text-xs text-green-600 mb-2">
                  从教务系统或课表 App 复制课程信息粘贴即可。支持以下格式：
                </p>
                <p className="text-xs text-green-600/70 mb-3">
                  ① 教务系统格式：<code className="bg-green-100 px-1 rounded">课程名 (1-3节)1-16周/场地:望院D311/教师:XXX</code><br />
                  ② 纯文本：<code className="bg-green-100 px-1 rounded">高等数学 周一 1-2节 教学楼A101</code><br />
                  ③ 逗号分隔：<code className="bg-green-100 px-1 rounded">会计学原理,周一,3-4节,望院D311</code>
                </p>
                <textarea
                  value={manualText}
                  onChange={(e) => handleManualInput(e.target.value)}
                  placeholder="粘贴课程信息到这里..."
                  className="w-full h-36 p-3 text-sm border border-green-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50 bg-white"
                  style={{ color: '#2D3436' }}
                />
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════
              图片导入 Tab
          ═══════════════════════════════════════════════════ */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* ── AI 配置提示 ──────────────────────────────── */}
              {!canUseAIVision && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-0.5">
                      {aiConfig?.apiType === 'deepseek'
                        ? '当前使用 DeepSeek，不支持图片识别'
                        : '未配置 AI 视觉识别'}
                    </p>
                    <p>
                      {aiConfig?.apiType === 'deepseek'
                        ? '请在「AI助手」设置中切换为 OpenAI 或通义千问'
                        : '配置后可使用 AI 直接识别课表图片（推荐 GPT-4o 或 qwen-vl-max）'}
                    </p>
                  </div>
                </div>
              )}

              {/* ── 上传区域 / 预览 ──────────────────────────── */}
              <div>
                <span className="text-sm font-medium" style={{ color: '#2D3436' }}>
                  上传课表截图
                </span>
                <div className="mt-2">
                  {!image ? (
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0984E3" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: '#2D3436' }}>
                        点击上传或拖拽课表截图
                      </div>
                      <div className="text-xs" style={{ color: '#636E72' }}>
                        支持 JPG/PNG · 推荐清晰截图
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 图片预览 */}
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <img
                          src={image}
                          alt="课表截图"
                          className="w-full max-h-56 object-contain bg-gray-100"
                        />
                        <button
                          onClick={() => {
                            setImage(null);
                            setPreviewCourses([]);
                            setError('');
                            setStatus('');
                            setRawText('');
                            setLastMethod(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>

                      {/* 识别按钮组 */}
                      <div className="space-y-2">
                        {/* OCR 识别（本地） */}
                        <button
                          onClick={handleOCRRecognize}
                          disabled={isProcessing}
                          className="w-full py-3 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-700 font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessing && lastMethod === 'ocr' ? (
                            <>
                              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                              </svg>
                              {status || '识别中...'}
                              {progress > 0 && <span className="text-sm opacity-80">({progress}%)</span>}
                            </>
                          ) : (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              OCR 本地识别
                              <span className="text-xs opacity-60 ml-1">（免费，离线）</span>
                            </>
                          )}
                        </button>

                        {/* AI 视觉识别（云端） */}
                        {canUseAIVision && (
                          <button
                            onClick={handleAIVisionRecognize}
                            disabled={isProcessing}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isProcessing && lastMethod === 'ai-vision' ? (
                              <>
                                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                                </svg>
                                AI 识别中...
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                  <path d="M2 17l10 5 10-5" />
                                  <path d="M2 12l10 5 10-5" />
                                </svg>
                                AI 视觉识别
                                <span className="text-xs opacity-60 ml-1">
                                  （{aiConfig.apiType === 'openai' ? 'GPT-4o' : '通义千问'}，更精准）
                                </span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 结果标签 */}
                      {lastMethod && previewCourses.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                            lastMethod === 'ai-vision'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {lastMethod === 'ai-vision' ? '🤖 AI 识别' : '🔍 OCR 识别'}
                          </span>
                          <span style={{ color: '#636E72' }}>
                            {previewCourses.length} 门课程
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              教务系统 Tab
          ═══════════════════════════════════════════════════ */}
          {activeTab === 'edu' && (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">教务系统导入</h3>
                    <p className="text-xs text-blue-600/80 mt-1">
                      输入教务系统网址，登录后截图课表页面，然后切到「图片导入」标签上传截图
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#2D3436' }}>教务系统网址</label>
                <input
                  type="url"
                  value={eduSystemUrl}
                  onChange={(e) => setEduSystemUrl(e.target.value)}
                  placeholder="https://jwxt.example.edu.cn/"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                  style={{ color: '#2D3436' }}
                />
              </div>

              <button
                onClick={handleOpenEduSystem}
                className="w-full py-3 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                打开教务系统
              </button>

              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-amber-800 mb-2">操作步骤</h4>
                <ol className="text-xs text-amber-700 space-y-1">
                  <li>1. 点击「打开教务系统」在新窗口打开</li>
                  <li>2. 登录后导航到课表页面</li>
                  <li>3. 截图（推荐 Win+Shift+S 或 Ctrl+Shift+S）</li>
                  <li>4. 切到「图片导入」→ 上传截图 → AI 视觉识别</li>
                </ol>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════
              通用：错误 & 状态提示
          ═══════════════════════════════════════════════════ */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}

          {status && !error && (
            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {status}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              OCR 原始文本（调试用）
          ═══════════════════════════════════════════════════ */}
          {(activeTab === 'text' || activeTab === 'image') && rawText && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full px-4 py-2 bg-gray-50 border-b border-border flex items-center justify-between text-sm hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium" style={{ color: '#2D3436' }}>
                  OCR 识别原始文本 {showDebug ? '▾' : '▸'}
                </span>
                <span className="text-xs" style={{ color: '#B2BEC3' }}>调试</span>
              </button>
              {showDebug && (
                <div className="p-3 bg-gray-50 max-h-40 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: '#636E72' }}>
                    {rawText || '(无内容)'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              课程预览
          ═══════════════════════════════════════════════════ */}
          {(activeTab === 'text' || activeTab === 'image') && previewCourses.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-green-50 border-b border-border">
                <span className="text-sm font-medium text-green-700">
                  📋 预览（{previewCourses.length} 门课程）
                </span>
                {lastMethod && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    lastMethod === 'ai-vision' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {lastMethod === 'ai-vision' ? 'AI' : 'OCR'}
                  </span>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {previewCourses.slice(0, 15).map((course) => (
                  <div
                    key={course.id}
                    className="px-4 py-2.5 border-b border-border last:border-b-0 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#2D3436' }}>
                        {course.name}
                      </div>
                      <div className="text-xs mt-0.5 flex flex-wrap gap-x-3" style={{ color: '#636E72' }}>
                        <span>周/{['一','二','三','四','五','六','日'][course.dayOfWeek - 1]}</span>
                        <span>第{course.startSection}-{course.endSection}节</span>
                        {course.location && <span>📍 {course.location}</span>}
                        {course.teacher && <span>👤 {course.teacher}</span>}
                        {course.startWeek && <span>{course.startWeek}-{course.endWeek}周</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {previewCourses.length > 15 && (
                  <div className="px-4 py-2 text-xs text-center" style={{ color: '#636E72' }}>
                    ...还有 {previewCourses.length - 15} 门课程
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 底部按钮 ────────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-gray-50/50 flex justify-end gap-3 flex-shrink-0 safe-area-bottom">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
            style={{ color: '#636E72' }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={previewCourses.length === 0}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            导入{previewCourses.length > 0 ? ` ${previewCourses.length} 门课程` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
