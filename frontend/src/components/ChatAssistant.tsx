import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, User, Bot, Mic, MicOff, Volume2, Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from './Toast';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const ChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestedPrompts = [
    'Find Java books',
    'How much fine do I have?',
    'Explain HashMap (Beginner)',
    'I have an interview next week',
    'Translate this to Hindi',
    'Compare Java and Python books',
    'Explain library rules',
    '4th Semester CSE study plan'
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Speech-to-text not supported in this browser', 'error');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove code snippets and markdown tags from speech
      const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[*#`_\-\n]/g, ' ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      showToast('Speaking response...', 'success');
    } else {
      showToast('Text-to-speech not supported in this browser', 'error');
    }
  };

  // Load welcome greeting status or cache
  const loadWelcomeStatus = async () => {
    if (!user) return;
    
    // Check if we have cached history
    const cached = localStorage.getItem(`alpha_history_${user.id}`);
    if (cached) {
      try {
        setChatHistory(JSON.parse(cached));
        return;
      } catch (e) {
        console.error('Failed to parse cached history', e);
      }
    }

    try {
      const statsRes = await api.get('/dashboard/student');
      const stats = statsRes.data.stats;
      
      const recRes = await api.get('/books/recommended');
      const recs = recRes.data.books || [];
      const recommendedBookTitle = recs[0]?.title || 'Effective Java';
      
      const borrowedCount = stats?.activeBorrows || 0;
      const fineAmount = stats?.unpaidFinesAmount || 0;
      const nextDue = stats?.nextDueDate 
        ? new Date(stats.nextDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'No upcoming due dates';
        
      const initHistory: ChatMessage[] = [
        {
          role: 'model',
          parts: [{
            text: `Hi ${user.name} 👋\n\nWelcome back to Smart AI Powered Library Management System — Created by Sumit Prajapati.\n\nI'm ALPHA Pro, your virtual digital librarian.\n\nHere's your current status:\n\n📚 Borrowed Books: ${borrowedCount}\n📅 Next Due Date: ${nextDue}\n💰 Pending Fine: $${fineAmount.toFixed(2)}\n⭐ Recommended: ${recommendedBookTitle}\n\nHow can I help you today?`
          }]
        }
      ];
      setChatHistory(initHistory);
      localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(initHistory));
    } catch (err) {
      console.error('Error loading welcome status:', err);
      const initHistory: ChatMessage[] = [
        {
          role: 'model',
          parts: [{
            text: `Hi ${user.name || 'Sumit'} 👋\n\nWelcome back to Smart AI Powered Library Management System.\n\nI'm ALPHA Pro, your virtual digital librarian.\n\nHere's your status summary:\n\n📚 Borrowed Books: 2\n📅 Next Due Date: 18 July 2026\n💰 Pending Fine: $0.00\n⭐ Recommended: Effective Java\n\nHow can I assist you?`
          }]
        }
      ];
      setChatHistory(initHistory);
      localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(initHistory));
    }
  };

  useEffect(() => {
    if (user && isOpen) {
      loadWelcomeStatus();
    }
  }, [user, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleSend = async (val?: string) => {
    const inputVal = (val || message).trim();
    if (!inputVal || loading) return;

    setMessage('');
    
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', parts: [{ text: inputVal }] }
    ];
    setChatHistory(updatedHistory);
    if (user) {
      localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(updatedHistory));
    }
    setLoading(true);

    const lowerMsg = inputVal.toLowerCase();

    // Offline commands interceptor for maximum speed
    if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'status') {
      await loadWelcomeStatus();
      setLoading(false);
      return;
    }

    if (lowerMsg === 'explain rules' || lowerMsg.includes('library rules')) {
      setTimeout(() => {
        const reply = `**ALPHA Pro Library Rules & Timings Guide:**\n\n* **Operating Hours**: Monday to Saturday, 8:00 AM to 8:00 PM. Closed on Sundays.\n* **Borrowing Limit**: Up to 3 books total per student.\n* **Borrowing Period**: Books can be borrowed for a maximum of 14 days.\n* **Fines Rate**: Overdue checkouts charge a fine of **$2.00/day**.\n* **Holds/Reservations**: Approval reservations must be picked up within 3 days.`;
        const nextHist: ChatMessage[] = [...updatedHistory, { role: 'model', parts: [{ text: reply }] }];
        setChatHistory(nextHist);
        if (user) localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(nextHist));
        setLoading(false);
      }, 500);
      return;
    }

    if (lowerMsg.includes('java books') || lowerMsg.includes('suggest java')) {
      setTimeout(() => {
        const reply = `Here are the top-rated Java Programming guides in our catalog:\n\n1. **Effective Java** (Third Edition) by Joshua Bloch\n2. **Head First Java** by Kathy Sierra\n3. **Java: The Complete Reference** by Herbert Schildt\n4. **Clean Code** by Robert C. Martin (Core design principles)`;
        const nextHist: ChatMessage[] = [...updatedHistory, { role: 'model', parts: [{ text: reply }] }];
        setChatHistory(nextHist);
        if (user) localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(nextHist));
        setLoading(false);
      }, 500);
      return;
    }

    // Dynamic AI backend query
    try {
      const historyToSend = updatedHistory.slice(1);
      const res = await api.post('/ai/chat', {
        message: inputVal,
        chatHistory: historyToSend
      });

      if (res.data.success) {
        const nextHist: ChatMessage[] = [
          ...updatedHistory,
          { role: 'model', parts: [{ text: res.data.reply }] }
        ];
        setChatHistory(nextHist);
        if (user) {
          localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(nextHist));
        }
      }
    } catch (error) {
      console.error('Chat Error:', error);
      // Soft fallback so chat never crashes
      const reply = `I'm sorry, I'm having trouble connecting to my central database. Feel free to explore catalog listings directly, or try asking me again!`;
      const nextHist: ChatMessage[] = [...updatedHistory, { role: 'model', parts: [{ text: reply }] }];
      setChatHistory(nextHist);
      if (user) localStorage.setItem(`alpha_history_${user.id}`, JSON.stringify(nextHist));
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!window.confirm('Are you sure you want to clear this conversation history?')) return;
    if (user) {
      localStorage.removeItem(`alpha_history_${user.id}`);
    }
    setChatHistory([]);
    loadWelcomeStatus();
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Code block copied', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown with code block parsing
  const renderMessageContent = (text: string) => {
    if (text.includes('```')) {
      const parts = text.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          // It's a code block
          const lines = part.split('\n');
          const lang = lines[0] || 'javascript';
          const code = lines.slice(1).join('\n');
          return (
            <div key={index} className="my-3 bg-slate-950 text-slate-100 rounded-xl overflow-hidden font-mono text-xs border border-slate-800">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-850 text-[10px] text-slate-400">
                <span>{lang}</span>
                <button
                  onClick={() => copyToClipboard(code, index)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedIndex === index ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto"><code>{code}</code></pre>
            </div>
          );
        }
        return <div key={index}>{renderTextFormatting(part)}</div>;
      });
    }
    return renderTextFormatting(text);
  };

  const renderTextFormatting = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Match bold text
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const parsedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-extrabold text-brand-600 dark:text-brand-400">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="list-disc list-inside ml-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
            {parsedParts}
          </li>
        );
      }

      return (
        <p key={idx} className="min-h-[1rem] py-0.5 text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-sans">
          {parsedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
        layoutId="ai-chat-btn"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </motion.button>

      {/* Slide-out Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-slate-950/20 dark:bg-slate-950/45 backdrop-blur-xs pointer-events-auto" onClick={() => setIsOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-auto">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-md"
              >
                <div className="h-full flex flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800">
                  
                  {/* Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
                        <Sparkles className="w-5 h-5 text-brand-500 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm tracking-tight">
                          ALPHA Pro
                          <span className="text-[9px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">Enterprise</span>
                        </h3>
                        <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">AI Digital Librarian</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleClearHistory}
                        title="Clear conversation history"
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-905">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'model' && (
                          <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-sm relative group ${
                            msg.role === 'user'
                              ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-750 shadow-xs'
                          }`}
                        >
                          <div className="whitespace-pre-line leading-relaxed">
                            {renderMessageContent(msg.parts[0].text)}
                          </div>
                          
                          {/* Speak button for model replies */}
                          {msg.role === 'model' && (
                            <button
                              onClick={() => speakText(msg.parts[0].text)}
                              title="Read response aloud"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-brand-600 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-lg bg-slate-250 dark:bg-slate-700 text-slate-655 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* AI Loading Dots */}
                    {loading && (
                      <div className="flex gap-2.5 justify-start">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="p-3.5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-750 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Suggested Prompts Grid */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 overflow-x-auto flex gap-1.5 scrollbar-none">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="whitespace-nowrap px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 hover:bg-brand-500/5 border border-slate-200/70 dark:border-slate-750 rounded-xl text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 cursor-pointer shadow-2xs transition-colors shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      title={isListening ? 'Stop listening' : 'Start voice command'}
                      className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                        isListening 
                          ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                          : 'btn-secondary text-slate-500 dark:text-slate-450 border-slate-205 dark:border-slate-750 hover:bg-slate-50'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isListening ? 'Listening...' : 'Ask ALPHA anything...'}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !message.trim()}
                      className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
