import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, Heart, BookOpen, AlertCircle, ShoppingBag, 
  Trash2, ChevronLeft, ArrowLeftRight, Clock, Award, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';
import { BookType } from '../components/BookCard';

export const BookDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuth();
  const { showToast } = useToast();

  const [book, setBook] = useState<BookType | any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPdfReader, setShowPdfReader] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const existingReview = reviews.find((r) => r.user?._id === user?.id || r.user === user?.id);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(5);
      setComment('');
    }
  }, [reviews, user]);

  const loadBookDetails = async () => {
    try {
      const bookRes = await api.get(`/books/${id}`);
      if (bookRes.data.success) {
        setBook(bookRes.data.book);
      }

      const reviewsRes = await api.get(`/reviews/${id}`);
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.reviews);
      }
    } catch (err: any) {
      console.error('Failed to load book:', err);
      showToast('Book not found', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookDetails();
  }, [id]);

  useEffect(() => {
    if (user?.wishlist && book) {
      setIsWishlisted(user.wishlist.includes(book._id));
    }
  }, [user, book]);

  const handleToggleWishlist = async () => {
    if (!book) return;
    try {
      const res = await api.post(`/auth/wishlist/${book._id}`);
      if (res.data.success) {
        setIsWishlisted(res.data.wishlist.includes(book._id));
        await fetchProfile(); // Sync profile state
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      showToast('Failed to update wishlist', 'error');
    }
  };

  const handleBorrowRequest = async () => {
    if (!book) return;
    setBorrowLoading(true);
    try {
      const res = await api.post(`/borrows/request/${book._id}`);
      if (res.data.success) {
        showToast(res.data.message || 'Borrow request submitted successfully', 'success');
        loadBookDetails(); // Refresh book details (available count might update or request status changes)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit borrow request';
      showToast(msg, 'error');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReserveRequest = async () => {
    if (!book) return;
    setBorrowLoading(true);
    try {
      const res = await api.post(`/reservations/reserve/${book._id}`);
      if (res.data.success) {
        showToast(res.data.message || 'Book reserved successfully', 'success');
        loadBookDetails();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reserve book';
      showToast(msg, 'error');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!comment.trim()) {
      showToast('Review comment is required', 'error');
      return;
    }

    setReviewLoading(true);
    try {
      const res = await api.post(`/reviews/${book._id}`, {
        rating,
        comment: comment.trim(),
      });
      if (res.data.success) {
        showToast(existingReview ? 'Review updated successfully' : 'Review added successfully', 'success');
        loadBookDetails(); // Reload reviews and recalculate average rating
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not submit review';
      showToast(msg, 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete review permanently?')) return;
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res.data.success) {
        showToast('Review deleted', 'success');
        loadBookDetails();
      }
    } catch (err) {
      showToast('Could not delete review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-405">Fetching book details...</p>
      </div>
    );
  }

  if (!book) return null;

  const isAvailable = book.copiesAvailable > 0;
  const coverUrl = book.coverImage
    ? book.coverImage.startsWith('http')
      ? book.coverImage
      : `http://localhost:5000${book.coverImage}`
    : null;

  return (
    <div className="space-y-8 page-fade-in max-w-6xl mx-auto">
      {/* Back link */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to list
        </button>
      </div>

      {/* Book Primary Display Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover panel */}
        <div className="flex flex-col items-center gap-4">
          <div className="aspect-[3/4] max-w-[260px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="p-6 text-center select-none">
                <span className="block text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
                  {book.categories[0]?.name || 'Book'}
                </span>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-4">{book.title}</h4>
              </div>
            )}
          </div>

          {/* Quick toggle wishlist */}
          {user?.role === 'student' && (
            <button
              onClick={handleToggleWishlist}
              className={`w-full py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                isWishlisted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
          )}

          {/* AI Summary Button */}
          <button
            onClick={() => setShowAiModal(true)}
            className="w-full mt-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
            <span>AI Summary & Insights</span>
          </button>
        </div>

        {/* Text information panel */}
        <div className="md:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Category tag */}
            <div className="flex flex-wrap gap-1.5">
              {book.categories.map((c: any) => (
                <span
                  key={c._id}
                  className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                >
                  {c.name}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {book.title}
            </h2>

            {/* Authors */}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              by <span className="font-semibold text-slate-800 dark:text-slate-200">{book.authors.map((a: any) => a.name).join(', ')}</span>
            </p>

            {/* Ratings Summary */}
            <div className="flex items-center gap-1.5 py-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(book.rating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-205">{book.rating ? book.rating.toFixed(1) : '0.0'}</span>
              <span className="text-xs text-slate-400">({book.reviewCount || 0} customer reviews)</span>
            </div>

            {/* Inventory Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 pb-3 border-t border-b border-slate-100 dark:border-slate-850">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">ISBN</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{book.isbn}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Copies Available</span>
                <p className={`text-xs font-bold mt-0.5 ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {book.copiesAvailable} / {book.totalCopies}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Borrow Limits</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">14 Days Loan</p>
              </div>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h4 className="font-bold text-xs uppercase text-slate-450 mb-1.5 tracking-wider">Description</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {book.description || 'No description available for this book catalog.'}
              </p>
            </div>

            {/* Book Health and Smart Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Condition</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{book.condition || 'New'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Difficulty</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{book.difficulty || 'Easy'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Est. Read Time</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{(book.estimatedReadingTimeMinutes || 120)} Mins</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Popularity Score</span>
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">{book.popularityScore || 0}</p>
              </div>
            </div>

            {/* Prerequisites */}
            {book.requiredKnowledge && book.requiredKnowledge.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block mb-1">Prerequisites</span>
                <div className="flex flex-wrap gap-1.5">
                  {book.requiredKnowledge.map((k: string, idx: number) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action section */}
          {user?.role === 'student' && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-850 flex flex-wrap gap-3">
              {isAvailable ? (
                <button
                  onClick={handleBorrowRequest}
                  disabled={borrowLoading}
                  className="btn-primary px-6 py-3 shadow-md cursor-pointer flex-1 sm:flex-initial"
                >
                  {borrowLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Request to Borrow</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleReserveRequest}
                  disabled={borrowLoading}
                  className="btn-secondary px-6 py-3 bg-brand-50 border border-brand-200 text-brand-700 dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400 hover:bg-brand-100 flex-1 sm:flex-initial cursor-pointer"
                >
                  {borrowLoading ? (
                    <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Reserve Book (Hold)</span>
                    </>
                  )}
                </button>
              )}

              {(book.isEbook || book.pdfUrl) && (
                <button
                  onClick={() => setShowPdfReader(true)}
                  className="btn-secondary px-5 py-3 flex items-center gap-1.5 cursor-pointer border border-brand-500/20 text-brand-600 hover:bg-brand-500/10"
                >
                  <BookOpen className="w-4 h-4" />
                  Read E-Book
                </button>
              )}

              {(book.isAudiobook || book.audioUrl) && (
                <button
                  onClick={() => setShowAudioPlayer(true)}
                  className="btn-secondary px-5 py-3 flex items-center gap-1.5 cursor-pointer border border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10"
                >
                  <Clock className="w-4 h-4" />
                  Listen Audio
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review / Comment split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Write Review Panel (Student Only) */}
        {user?.role === 'student' && (
          <div className="glass-card p-6 rounded-3xl h-fit">
            <h3 className="font-bold text-base text-slate-909 dark:text-white mb-4">
              {existingReview ? 'Update Your Review' : 'Add Your Review'}
            </h3>
            <form onSubmit={handleAddReview} className="space-y-4">
              {/* Star selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-400 cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Review Comment
                </label>
                <textarea
                  placeholder="Share your thoughts on this book..."
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="form-input resize-none py-3"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full btn-primary"
              >
                {reviewLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className={`glass-card p-6 rounded-3xl flex flex-col ${user?.role === 'student' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Student Reviews</h3>
          <div className="space-y-4 flex-1">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto opacity-20 mb-2" />
                <p className="text-xs">No reviews submitted yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rev.user?.name || 'Student Reader'}</h4>
                      <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-350'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Delete button (Visible to Admin or author of review) */}
                      {(user?.role === 'admin' || user?.id === rev.user?._id || user?.id === rev.user) && (
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-normal">{rev.reviewText}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Summary Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              onClick={() => setShowAiModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="glass-card p-6 rounded-3xl max-w-lg w-full relative z-10 bg-white/95 dark:bg-slate-900/95 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight">ALPHA Core AI Insights</h3>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Book Summary</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{book.summary || 'Summary is currently being generated by ALPHA...'}"
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2">Key Takeaways</h4>
                  {book.keyPoints && book.keyPoints.length > 0 ? (
                    <ul className="space-y-2">
                      {book.keyPoints.map((pt: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-350 flex gap-2">
                          <span className="w-5 h-5 shrink-0 rounded-full bg-brand-500/10 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="mt-0.5 leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">Key insights are unavailable for this catalog record.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen E-Book Reader Modal */}
      {showPdfReader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowPdfReader(false)} />
          <div className="glass-card w-full max-w-5xl h-[85vh] p-6 rounded-3xl shadow-2xl z-10 flex flex-col bg-white dark:bg-slate-900 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600 animate-pulse" />
                E-Book Reader: {book.title}
              </h3>
              <button onClick={() => setShowPdfReader(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full mt-4 overflow-hidden rounded-2xl border border-slate-205 dark:border-slate-800">
              <iframe
                src={book.pdfUrl ? (book.pdfUrl.startsWith('http') ? book.pdfUrl : `http://localhost:5000${book.pdfUrl}`) : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                className="w-full h-full"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Audiobook Player Footer Drawer */}
      {showAudioPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-6 backdrop-blur-md transition-all duration-300">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0">
                <img 
                  src={book.coverImage ? (book.coverImage.startsWith('http') ? book.coverImage : `http://localhost:5000${book.coverImage}`) : ''} 
                  alt={book.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{book.title}</h4>
                <p className="text-xs text-slate-450">Playing Audiobook</p>
              </div>
            </div>
            <div className="w-full sm:max-w-md">
              <audio
                src={book.audioUrl ? (book.audioUrl.startsWith('http') ? book.audioUrl : `http://localhost:5000${book.audioUrl}`) : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
                controls
                autoPlay
                className="w-full"
              />
            </div>
            <button onClick={() => setShowAudioPlayer(false)} className="btn-secondary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
              Close Player
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
