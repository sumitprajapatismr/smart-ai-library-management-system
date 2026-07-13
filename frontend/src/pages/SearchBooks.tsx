import React, { useEffect, useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowRight, CornerDownRight, X, Library, Mic } from 'lucide-react';
import { BookCard, BookType } from '../components/BookCard';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const SearchBooks: React.FC = () => {
  const { user, fetchProfile } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Semantic search states
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Standard Filter states
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating, title, createdAt
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const fetchFiltersData = async () => {
    try {
      const catRes = await api.get('/categories');
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }
      const autRes = await api.get('/authors');
      if (autRes.data.success) {
        setAuthors(autRes.data.authors);
      }
    } catch (err) {
      console.error('Error fetching categories/authors:', err);
    }
  };

  const executeSearch = async (targetPage = 1) => {
    setLoading(true);
    try {
      if (isAiMode && searchQuery.trim()) {
        // AI Semantic Search
        const res = await api.post('/ai/search', { query: searchQuery.trim() });
        if (res.data.success) {
          setBooks(res.data.books || []);
          setTotalBooks(res.data.count || 0);
          setTotalPages(1); // AI search caps at top 20
          setPage(1);
          setAiAnalysis(res.data.queryAnalysis || null);
          showToast(`Found ${res.data.books.length} books using Smart semantic search`, 'success');
        }
      } else {
        // Standard Search with filters
        setAiAnalysis(null);
        const params: any = {
          page: targetPage,
          limit: 8,
          search: searchQuery.trim(),
          category: selectedCategory,
          author: selectedAuthor,
          sort: sortBy,
        };

        // Clean empty parameters
        Object.keys(params).forEach(key => {
          if (params[key] === '') delete params[key];
        });

        const res = await api.get('/books', { params });
        if (res.data.success) {
          setBooks(res.data.books || []);
          setTotalPages(res.data.pages || 1);
          setPage(res.data.currentPage || 1);
          setTotalBooks(res.data.total || 0);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('Search execution failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
    executeSearch(1);
  }, [selectedCategory, selectedAuthor, sortBy, isAiMode]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Listening... Speak a book title or topic.', 'info');
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      showToast('Voice recognition error. Please try again.', 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      showToast(`Searching for: "${transcript}"`, 'success');
      setTimeout(() => {
        executeSearchWithQuery(transcript);
      }, 300);
    };

    recognition.start();
  };

  const executeSearchWithQuery = async (query: string) => {
    setLoading(true);
    try {
      if (isAiMode && query.trim()) {
        const res = await api.post('/ai/search', { query: query.trim() });
        if (res.data.success) {
          setBooks(res.data.books || []);
          setTotalBooks(res.data.count || 0);
          setTotalPages(1);
          setPage(1);
          setAiAnalysis(res.data.queryAnalysis || null);
        }
      } else {
        const res = await api.get('/books', { params: { search: query.trim(), limit: 8 } });
        if (res.data.success) {
          setBooks(res.data.books || []);
          setTotalPages(res.data.pages || 1);
          setPage(res.data.currentPage || 1);
          setTotalBooks(res.data.total || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setIsAiMode(false);
    setAiAnalysis(null);
    executeSearch(1);
  };

  const handleToggleWishlist = async (bookId: string) => {
    try {
      const res = await api.post(`/auth/wishlist/${bookId}`);
      if (res.data.success) {
        await fetchProfile(); // Update local profile state
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Failed to toggle wishlist', 'error');
    }
  };

  const handleBorrowRequest = async (book: BookType) => {
    try {
      const endpoint = book.copiesAvailable > 0 
        ? `/borrows/request/${book._id}` 
        : `/reservations/reserve/${book._id}`;
      const res = await api.post(endpoint);
      if (res.data.success) {
        showToast(res.data.message || 'Operation successful', 'success');
        executeSearch(page); // Reload list
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Request failed';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Search Book Catalog</h2>
        <p className="text-xs text-slate-400 mt-1">Look up books using keywords or natural language</p>
      </div>

      {/* Main Search Panel */}
      <div className="glass-card p-5 rounded-3xl space-y-4">
        {/* Toggle Mode Tab */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl w-fit">
          <button
            onClick={() => setIsAiMode(false)}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              !isAiMode
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Standard Search
          </button>
          <button
            onClick={() => setIsAiMode(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              isAiMode
                ? 'bg-gradient-to-tr from-brand-650 to-brand-500 text-white shadow-sm'
                : 'text-brand-650 hover:text-brand-700 dark:text-brand-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Semantic Search
          </button>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {isAiMode ? <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> : <Search className="w-5 h-5" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAiMode
                  ? 'e.g. Find me introduction to software engineering books or something about science fiction...'
                  : 'Search by title, author, description, or ISBN...'
              }
              className={`form-input pl-11 pr-20 py-3 ${
                isAiMode 
                  ? 'border-brand-300 focus:ring-brand-500 focus:border-brand-500' 
                  : ''
              }`}
            />
            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={startVoiceSearch}
              className={`absolute inset-y-0 right-8 pr-3 flex items-center text-slate-400 hover:text-brand-600 transition-colors ${
                isListening ? 'text-brand-600 animate-pulse' : ''
              }`}
              title="Voice Search"
            >
              <Mic className={`w-4 h-4 ${isListening ? 'fill-brand-600' : ''}`} />
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-2 pr-3 flex items-center text-slate-450 hover:text-slate-705"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button type="submit" className="btn-primary px-6 rounded-xl font-bold shadow-md">
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isAiMode && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary p-3 rounded-xl border border-slate-200 dark:border-slate-800 ${
                showFilters ? 'bg-slate-200 dark:bg-slate-800 text-slate-900' : ''
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* AI Intent analysis summary box */}
        {aiAnalysis && (
          <div className="p-4 bg-brand-500/5 border border-brand-550/15 rounded-2xl text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Gemini Query Analysis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                <span>Keywords: <strong className="text-slate-700 dark:text-slate-200">[{aiAnalysis.keywords?.join(', ') || 'none'}]</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                <span>Mapped Category: <strong className="text-slate-700 dark:text-slate-200">{aiAnalysis.category || 'none'}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                <span>Extracted Author: <strong className="text-slate-700 dark:text-slate-200">{aiAnalysis.author || 'none'}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Dropdown Filters Panel (Standard Search only) */}
        {!isAiMode && showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-850 page-fade-in">
            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5">
                Author
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="form-input"
              >
                <option value="">All Authors</option>
                {authors.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input"
              >
                <option value="rating">Top Rated</option>
                <option value="title">Alphabetical (Title)</option>
                <option value="createdAt">Newly Added</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Search Output Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-405">Querying library index...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1 select-none">
            <span>FOUND {totalBooks} BOOKS IN CATALOG</span>
            {!isAiMode && <span>PAGE {page} OF {totalPages}</span>}
          </div>

          {books.length === 0 ? (
            <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
              <Library className="w-12 h-12 mx-auto opacity-20 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No books found</h3>
              <p className="text-xs max-w-xs mx-auto mt-2 leading-relaxed">
                We couldn't find any books matching your query. Try adjusting your spelling or using AI Semantic Search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {books.map((b) => (
                <BookCard
                  key={b._id}
                  book={b}
                  onWishlistToggle={handleToggleWishlist}
                  isWishlisted={user?.wishlist?.includes(b._id)}
                  onBorrowRequest={handleBorrowRequest}
                />
              ))}
            </div>
          )}

          {/* Standard Pagination Controls */}
          {!isAiMode && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                onClick={() => executeSearch(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl border border-slate-205 dark:border-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              
              <span className="text-xs font-bold text-slate-500">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => executeSearch(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl border border-slate-205 dark:border-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
