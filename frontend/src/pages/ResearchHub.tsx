import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Bookmark, BookmarkCheck, FileText, Download, Plus, X, Globe, Star } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export const ResearchHub: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [papers, setPapers] = useState<any[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');

  // Form states for new entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [docCategory, setDocCategory] = useState('IEEE');
  const [pdfUrl, setPdfUrl] = useState('');
  const [tags, setTags] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const categories = [
    'IEEE',
    'White Paper',
    'Case Study',
    'Project Report',
    'Technical Documentation',
    'Previous Year Question'
  ];

  const loadPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research', {
        params: {
          category: category || undefined,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setPapers(res.data.papers || []);
      }

      // Load user bookmarks
      const bookmarkRes = await api.get('/research/bookmarks');
      if (bookmarkRes.data.success) {
        setBookmarkedIds((bookmarkRes.data.papers || []).map((p: any) => p._id));
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load research ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPapers();
  };

  const handleBookmarkToggle = async (paperId: string) => {
    try {
      const res = await api.post(`/research/bookmark/${paperId}`);
      if (res.data.success) {
        if (bookmarkedIds.includes(paperId)) {
          setBookmarkedIds(prev => prev.filter(id => id !== paperId));
          showToast('Paper removed from bookmarks', 'info');
        } else {
          setBookmarkedIds(prev => [...prev, paperId]);
          showToast('Paper saved to bookmarks successfully!', 'success');
        }
      }
    } catch (err) {
      showToast('Could not modify bookmark state', 'error');
    }
  };

  const handleAddPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authors || !abstract || !pdfUrl) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/research', {
        title,
        authors: authors.split(',').map(a => a.trim()),
        abstract,
        category: docCategory,
        pdfUrl,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        semester: semester ? parseInt(semester) : undefined,
        department: department || undefined
      });
      if (res.data.success) {
        showToast('Research Paper catalog entry created!', 'success');
        setShowAddModal(false);
        // Clear forms
        setTitle('');
        setAuthors('');
        setAbstract('');
        setPdfUrl('');
        setTags('');
        setSemester('');
        setDepartment('');
        loadPapers();
      }
    } catch (err) {
      showToast('Failed to create research catalog entry', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const displayedPapers = activeTab === 'all'
    ? papers
    : papers.filter(p => bookmarkedIds.includes(p._id));

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Academic Research & Document Hub</h2>
          <p className="text-xs text-slate-450 mt-1">Access IEEE papers, technical documentations, case studies, and archives</p>
        </div>
        
        <div className="flex items-center gap-2">
          {(user?.role === 'admin' || user?.role === 'librarian') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/10"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-brand-500 text-brand-655'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          All Publications ({papers.length})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === 'bookmarks'
              ? 'border-brand-500 text-brand-655'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          My Bookmarks ({bookmarkedIds.length})
        </button>
      </div>

      {/* Filter and search row */}
      {activeTab === 'all' && (
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, authors, or keyword tags..."
              className="form-input text-xs pl-9"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-input text-xs cursor-pointer"
            >
              <option value="">All Document Categories</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-secondary py-2.5 px-5 text-xs font-bold rounded-xl cursor-pointer"
          >
            Find Documents
          </button>
        </form>
      )}

      {/* Research Papers Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-450">Loading archive records...</p>
        </div>
      ) : displayedPapers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded-3xl">
          <FileText className="w-12 h-12 mx-auto opacity-20 mb-3 animate-pulse" />
          <h4 className="font-bold text-sm text-slate-705">No Documents Found</h4>
          <p className="text-xs mt-1">Try broadening filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedPapers.map((paper) => {
            const isBookmarked = bookmarkedIds.includes(paper._id);
            return (
              <div
                key={paper._id}
                className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-750 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {paper.category}
                    </span>
                    
                    <button
                      onClick={() => handleBookmarkToggle(paper._id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 cursor-pointer"
                    >
                      {isBookmarked ? (
                        <Star className="w-4 h-4 text-amber-550 fill-amber-550 fill-amber-500" />
                      ) : (
                        <Star className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-905 dark:text-white leading-snug line-clamp-2">
                    {paper.title}
                  </h3>
                  
                  <p className="text-[10px] text-slate-500 font-semibold">
                    By {paper.authors.join(', ')}
                  </p>

                  <p className="text-xs text-slate-505 dark:text-slate-400 line-clamp-3 leading-relaxed pt-1">
                    {paper.abstract}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/80 pt-3">
                  {/* Semester details */}
                  <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">
                    {paper.department ? `${paper.department} | Sem ${paper.semester}` : 'General Archive'}
                  </span>

                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-655 hover:text-brand-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open PDF Document
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal for Admins */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <h3 className="font-extrabold text-sm text-slate-905 dark:text-white">Publish New Archive Document</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleAddPaper} className="p-6 space-y-4 max-h-[30rem] overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Document Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Survey of Transformer Networks"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Authors (comma-separated) *</label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="e.g. John Doe, Sarah Connor"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Category *</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="form-input text-xs cursor-pointer"
                  >
                    {categories.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Document PDF URL *</label>
                  <input
                    type="text"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/paper.pdf"
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Semester</label>
                  <input
                    type="number"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="4"
                    className="form-input text-xs"
                    min={1}
                    max={8}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="CSE"
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Keyword Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. AI, Deep Learning, Survey"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Publication Abstract *</label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Enter abstract summaries..."
                  className="form-input text-xs h-24 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl cursor-pointer"
              >
                {actionLoading ? 'Creating entry...' : 'Publish Document Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
