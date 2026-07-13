import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Mail, Calendar, Heart, Award, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { BookCard } from '../components/BookCard';
import api from '../services/api';

export const Profile: React.FC = () => {
  const { user, fetchProfile } = useAuth();
  const { showToast } = useToast();
  
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileWishlist = async () => {
    if (user?.role !== 'student') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        setWishlist(res.data.user.wishlist || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileWishlist();
  }, [user]);

  const handleToggleWishlist = async (bookId: string) => {
    try {
      const res = await api.post(`/auth/wishlist/${bookId}`);
      if (res.data.success) {
        showToast('Book removed from wishlist', 'info');
        loadProfileWishlist();
        fetchProfile(); // Sync global AuthContext wishlist
      }
    } catch (err) {
      showToast('Could not update wishlist', 'error');
    }
  };

  return (
    <div className="space-y-6 page-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Card</h2>
        <p className="text-xs text-slate-405 mt-1">Review account profile details and your catalog wishlist</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card info */}
        <div className="md:col-span-1 glass-card p-6 rounded-3xl h-fit flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-650 dark:text-brand-400 flex items-center justify-center font-black text-xl capitalize shadow-sm border border-brand-500/10 mb-4 select-none">
            {user?.name?.charAt(0)}
          </div>
          
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base capitalize">{user?.name}</h3>
          
          <span className="text-[10px] uppercase font-extrabold text-slate-400 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            {user?.role} Account
          </span>

          <div className="w-full space-y-3.5 border-t border-slate-100 dark:border-slate-850/80 mt-6 pt-5 text-left text-xs">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Verified status: <strong className={user?.isVerified ? 'text-emerald-500' : 'text-amber-500'}>{user?.isVerified ? 'Active card' : 'Pending'}</strong></span>
            </div>
          </div>
        </div>

        {/* Wishlist panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              My Saved Wishlist
            </h3>

            {user?.role !== 'student' ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Wishlists are currently only supported for Student accounts.
              </p>
            ) : loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Library className="w-10 h-10 mx-auto opacity-10" />
                <p className="text-xs">Your wishlist is empty. Save books to display them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    isWishlisted={true}
                    onWishlistToggle={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
