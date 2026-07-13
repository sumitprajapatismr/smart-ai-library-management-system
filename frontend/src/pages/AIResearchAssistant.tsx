import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, FileText, Upload, Trash2, Search, Sparkles, Copy, 
  Download, RefreshCw, HelpCircle, FileDown, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import jsPDF from 'jspdf';

interface ResearchDoc {
  _id: string;
  title: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  references?: Array<{ documentTitle: string; pageNumber: number }>;
}

export const AIResearchAssistant: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<ResearchDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  
  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [queryText, setQueryText] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load documents list
  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await api.get('/research-assistant/documents');
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      showToast('Could not load uploaded document directory.', 'error');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Set a friendly initial system introduction
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `# Answer\n\nWelcome to your **AI Research Assistant (RAG Engine)**! \n\nI can retrieve precise facts directly from your custom uploaded PDF manuals, notes, and research materials, then formulate detailed answers with page-level citations.\n\nTo begin:\n1. Upload one or more PDF documents in the left sidebar panel.\n2. Ask any research question in the chat box below.\n\n---------------------\n\n# Key Points\n• **Direct Retrieval**: I search through actual documents, not just generic training data.\n• **Strict References**: I cite specific files and page ranges for every claim.\n\n---------------------\n\n# Example\n"Explain the core components of a Binary Search Tree (BST)"\n\n---------------------\n\n# References\nAI Research Engine Introduction v1.0`,
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll chat window to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle file drop/drag selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are supported for semantic indexing.', 'error');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('File exceeds maximum size limit (15MB).', 'error');
        return;
      }
      setUploadFile(file);
    }
  };

  // Upload PDF Document
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', uploadFile);

    // Mock progress animation for premium UI feel
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(85, prev + 15));
    }, 400);

    try {
      const res = await api.post('/research-assistant/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data.success) {
        showToast('PDF Document indexed and embedded successfully!', 'success');
        setUploadFile(null);
        fetchDocuments();
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      showToast(err.response?.data?.message || 'Failed to index research document.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 600);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document and clear its vector index?')) return;
    try {
      const res = await api.delete(`/research-assistant/documents/${docId}`);
      if (res.data.success) {
        showToast('Document cleared successfully.', 'success');
        fetchDocuments();
      }
    } catch (err) {
      showToast('Could not delete document index.', 'error');
    }
  };

  // Submit Chat Question
  const handleAskQuestion = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = presetQuery || queryText;
    if (!activeQuery.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: activeQuery,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setQueryText('');
    setQueryLoading(true);

    try {
      const res = await api.post('/research-assistant/ask', { question: activeQuery });
      if (res.data.success) {
        const assistantMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: res.data.answer,
          timestamp: new Date(),
          references: res.data.references
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'RAG Search query failed.', 'error');
    } finally {
      setQueryLoading(false);
    }
  };

  // Copy answer to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied content to clipboard!', 'success');
  };

  // Compile PDF document download
  const handleDownloadPDF = (answerText: string, question: string) => {
    try {
      const doc = new jsPDF();
      
      // Page styling
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("AI RESEARCH ASSISTANT REPORT", 14, 13);
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Created by Sumit Prajapati`, 125, 13);
      
      // Query section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text("Research Inquiry Query:", 14, 30);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitQuestion = doc.splitTextToSize(question, 180);
      doc.text(splitQuestion, 14, 35);
      
      const questionHeight = splitQuestion.length * 5;
      let currentY = 40 + questionHeight;
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY, 196, currentY);
      currentY += 10;
      
      // Clean answer layout
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("Explanation & Analysis:", 14, currentY);
      currentY += 6;
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      
      // Clean markdown tags for PDF rendering
      const cleanText = answerText
        .replace(/# Answer/g, '')
        .replace(/---------------------/g, '\n==================================\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1');
        
      const splitText = doc.splitTextToSize(cleanText, 180);
      
      for (let i = 0; i < splitText.length; i++) {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitText[i], 14, currentY);
        currentY += 5;
      }
      
      doc.save(`Research_Report_${question.substring(0, 15).replace(/\s+/g, '_')}.pdf`);
      showToast('Research Report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not compile PDF report.', 'error');
    }
  };

  // Helper to parse simple markdown to clean HTML tags layout
  const parseMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/# (.*?)\n/g, '<h3 class="text-base font-extrabold text-brand-600 dark:text-brand-400 mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-850">$1</h3>')
      .replace(/## (.*?)\n/g, '<h4 class="text-sm font-extrabold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• (.*?)\n/g, '<li class="list-disc list-inside ml-2 text-xs text-slate-650 dark:text-slate-450 py-0.5">$1</li>')
      .replace(/- (.*?)\n/g, '<li class="list-disc list-inside ml-2 text-xs text-slate-650 dark:text-slate-450 py-0.5">$1</li>')
      .replace(/---------------------/g, '<hr class="my-6 border-slate-200/60 dark:border-slate-850" />')
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<hr') || trimmed.startsWith('<ul')) {
          return line;
        }
        return `<p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed py-1">${line}</p>`;
      })
      .join('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 page-fade-in pb-12">
      {/* Title Header */}
      <div className="lg:col-span-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Brain className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          AI Research Assistant
        </h2>
        <p className="text-xs text-slate-405 mt-1">
          Perform vector-based semantic retrieval across custom uploaded PDFs and library materials.
        </p>
      </div>

      {/* Left Sidebar Document Manager */}
      <div className="lg:col-span-1 space-y-6">
        {/* PDF Document Upload */}
        <div className="glass-card p-5 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-brand-600" />
            Upload PDF Material
          </h3>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500/70 dark:hover:border-brand-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf"
            />
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {uploadFile ? uploadFile.name : 'Choose or Drag PDF'}
            </p>
            <span className="text-[9px] text-slate-405 mt-1 block">Maximum file size 15MB</span>
          </div>

          {uploadFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full btn-primary py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Indexing ({uploadProgress}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build Vector Index</span>
                </>
              )}
            </button>
          )}

          {uploading && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-brand-500 h-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Uploaded Documents List */}
        <div className="glass-card p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-brand-605" />
              Document Directory
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500">
              {documents.length}
            </span>
          </div>

          {docsLoading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-6 h-6 mx-auto opacity-30 mb-2" />
              <p className="text-[10px] leading-snug">No files indexed yet. Upload a PDF above to construct vector indexes.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[16rem] overflow-y-auto pr-1.5 scrollbar-thin">
              {documents.map(doc => (
                <div 
                  key={doc._id} 
                  className="p-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={doc.title}>
                      {doc.title}
                    </h5>
                    <span className="text-[9px] text-slate-450 block font-semibold mt-0.5">
                      {doc.pageCount} pages • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-550/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Delete document index"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Chat Panel */}
      <div className="lg:col-span-3 flex flex-col h-[32rem] lg:h-[36rem]">
        <div className="glass-card flex-1 flex flex-col rounded-3xl overflow-hidden">
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
                RAG Context Dialogue Stream
              </h3>
              <p className="text-[10px] text-slate-405 mt-0.5">Vector retrieval dynamically queries uploaded PDFs.</p>
            </div>
            {messages.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear chat transcripts?')) {
                    setMessages([messages[0]]);
                  }
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Dialogues Messages Window */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`max-w-[85%] space-y-2 p-4 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-205/30 rounded-tl-none text-slate-900 dark:text-slate-200'
                }`}>
                  {msg.sender === 'user' ? (
                    <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div 
                      className="text-xs space-y-1 font-sans"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                    />
                  )}
                  
                  {/* Action buttons under assistant replies */}
                  {msg.sender === 'assistant' && msg.id !== 'welcome' && (
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800 mt-3 text-[10px] font-bold text-slate-450">
                      <button
                        onClick={() => handleCopyToClipboard(msg.text)}
                        className="flex items-center gap-1 hover:text-slate-655 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          const userMsg = messages.find((m, idx) => {
                            const currentIdx = messages.findIndex(x => x.id === msg.id);
                            return idx === currentIdx - 1;
                          });
                          handleDownloadPDF(msg.text, userMsg?.text || 'Research Query');
                        }}
                        className="flex items-center gap-1 hover:text-slate-655 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {queryLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-205/30 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Queries Suggestion */}
          {messages.length <= 1 && (
            <div className="px-6 py-2 bg-slate-50/20 dark:bg-slate-900/10 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-slate-400">Presets:</span>
              {[
                'Explain Binary Search Tree',
                'Analyze target time complexity of algorithms',
                'What is the structure of document references?'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(undefined, preset)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-500/10 hover:text-brand-600 dark:bg-slate-900 dark:hover:bg-brand-550/10 text-slate-550 border border-slate-200/50 dark:border-slate-800/80 cursor-pointer transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Input Dialog Box Form */}
          <form 
            onSubmit={(e) => handleAskQuestion(e)} 
            className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/20 flex gap-2"
          >
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask a question about your uploaded research documents..."
              className="flex-1 form-input text-xs font-semibold py-3 px-4 focus:ring-2 focus:ring-brand-500"
              disabled={queryLoading}
              required
            />
            <button
              type="submit"
              disabled={queryLoading || !queryText.trim()}
              className="btn-primary py-3 px-5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Ask AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
