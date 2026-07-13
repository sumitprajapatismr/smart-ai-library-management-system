import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Bookmark, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export interface BookType {
  _id: string;
  title: string;
  description: string;
  isbn: string;
  authors: { _id: string; name: string }[];
  categories: { _id: string; name: string }[];
  copiesTotal: number;
  copiesAvailable: number;
  rating?: number;
  reviewCount?: number;
  coverImage?: string;
  summary?: string;
  keyPoints?: string[];
}

interface BookCardProps {
  book: BookType;
  onWishlistToggle?: (bookId: string) => void;
  isWishlisted?: boolean;
  onBorrowRequest?: (book: BookType) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onWishlistToggle,
  isWishlisted = false,
  onBorrowRequest,
}) => {
  const { user } = useAuth();
  const isAvailable = book.copiesAvailable > 0;

  // Build complete URL for cover image
  const coverUrl = book.coverImage
    ? book.coverImage.startsWith('http')
      ? book.coverImage
      : `http://localhost:5000${book.coverImage}`
    : null;

  return (
    <div className="glass-card flex flex-col rounded-2xl overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      {/* Book Cover Container */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="p-6 text-center select-none">
            <span className="block text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
              {book.categories[0]?.name || 'Book'}
            </span>
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-3">
              {book.title}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-550 mt-2">
              {book.authors.map((a) => a.name).join(', ')}
            </p>
          </div>
        )}

        {/* Availability Badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            isAvailable
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455'
          }`}
        >
          {isAvailable ? `Available` : `Out of Stock`}
        </span>

        {/* Quick Wishlist toggle (Student only) */}
        {user?.role === 'student' && onWishlistToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWishlistToggle(book._id);
            }}
            className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-850 rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-all ${
                isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Book Metadata */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category tag */}
        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-655 dark:text-brand-400 mb-1.5 block">
          {book.categories.map((c) => c.name).join(' & ')}
        </span>

        {/* Title */}
        <Link
          to={`/books/${book._id}`}
          className="font-bold text-slate-850 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 line-clamp-1 text-base transition-colors"
        >
          {book.title}
        </Link>

        {/* Authors */}
        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
          by {book.authors.map((a) => a.name).join(', ')}
        </p>

        {/* Rating and review counts */}
        <div className="flex items-center gap-1 mt-2 mb-3">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
            {book.rating ? book.rating.toFixed(1) : '0.0'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            ({book.reviewCount || 0} reviews)
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Button */}
        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <Link
            to={`/books/${book._id}`}
            className="text-xs font-semibold text-slate-500 dark:text-slate-450 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group/lnk"
          >
            Details
            <ArrowRight className="w-3 h-3 group-hover/lnk:translate-x-0.5 transition-transform" />
          </Link>

          {user?.role === 'student' && onBorrowRequest && (
            <button
              onClick={() => onBorrowRequest(book)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
                isAvailable
                  ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-300 hover:bg-brand-600 hover:text-white'
              }`}
            >
              {isAvailable ? 'Borrow' : 'Reserve'}
            </button>
          )}

          {user?.role && user.role !== 'student' && (
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 flex items-center gap-1 select-none">
              <Shield className="w-3 h-3" />
              Staff
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
