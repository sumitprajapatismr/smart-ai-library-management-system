import React, { useEffect, useState } from 'react';
import { 
  Inbox, FileCheck2, ClipboardList, HelpCircle, 
  Search, Check, X, RefreshCw, Calendar, ArrowLeftRight, AlertTriangle 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const Transactions: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'checkouts' | 'reservations'>('requests');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lists
  const [borrowRecords, setBorrowRecords] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTransactions = async (targetPage = 1) => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        const res = await api.get('/borrows', {
          params: { page: targetPage, limit: 10, status: 'requested', search: searchQuery.trim() }
        });
        if (res.data.success) {
          setBorrowRecords(res.data.records);
          setTotalPages(res.data.pages || 1);
          setPage(res.data.currentPage || 1);
        }
      } else if (activeTab === 'checkouts') {
        const res = await api.get('/borrows', {
          params: { page: targetPage, limit: 10, status: 'borrowed', search: searchQuery.trim() }
        });
        if (res.data.success) {
          setBorrowRecords(res.data.records);
          setTotalPages(res.data.pages || 1);
          setPage(res.data.currentPage || 1);
        }
      } else if (activeTab === 'reservations') {
        const res = await api.get('/reservations', {
          params: { page: targetPage, limit: 10, status: 'pending' } // Filter by pending hold approvals
        });
        if (res.data.success) {
          setReservations(res.data.reservations);
          setTotalPages(res.data.pages || 1);
          setPage(res.data.currentPage || 1);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load transaction list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, [activeTab, searchQuery]);

  const handleApproveBorrow = async (recordId: string) => {
    try {
      const res = await api.put(`/borrows/approve/${recordId}`);
      if (res.data.success) {
        showToast('Borrow request approved. Book issued.', 'success');
        loadTransactions(page);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Approval failed';
      showToast(msg, 'error');
    }
  };

  const handleRejectBorrow = async (recordId: string) => {
    try {
      const res = await api.put(`/borrows/cancel/${recordId}`);
      if (res.data.success) {
        showToast('Borrow request rejected.', 'info');
        loadTransactions(page);
      }
    } catch (err: any) {
      showToast('Rejection failed', 'error');
    }
  };

  const handleCheckinReturn = async (recordId: string) => {
    try {
      const res = await api.put(`/borrows/return/${recordId}`);
      if (res.data.success) {
        const fine = res.data.fineAmount;
        if (fine > 0) {
          showToast(`Book returned successfully. Late fine of $${fine.toFixed(2)} charged.`, 'info');
        } else {
          showToast('Book returned and checked in successfully.', 'success');
        }
        loadTransactions(page);
      }
    } catch (err: any) {
      showToast('Checkin return failed', 'error');
    }
  };

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const res = await api.put(`/reservations/approve/${reservationId}`);
      if (res.data.success) {
        showToast('Reservation approved. Hold placed.', 'success');
        loadTransactions(page);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Hold approval failed';
      showToast(msg, 'error');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const res = await api.put(`/reservations/cancel/${reservationId}`);
      if (res.data.success) {
        showToast('Reservation hold cancelled.', 'info');
        loadTransactions(page);
      }
    } catch (err: any) {
      showToast('Hold cancellation failed', 'error');
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Issue / Return Desk</h2>
          <p className="text-xs text-slate-400 mt-1">Review pending checkouts, returns, and hold requests</p>
        </div>
        <button 
          onClick={() => loadTransactions(page)}
          className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-slate-205 dark:border-slate-850 pb-px overflow-x-auto select-none">
        <button
          onClick={() => { setActiveTab('requests'); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'requests'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-250'
          }`}
        >
          Borrow Requests
        </button>
        <button
          onClick={() => { setActiveTab('checkouts'); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'checkouts'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-250'
          }`}
        >
          Active Checkouts (Returns)
        </button>
        <button
          onClick={() => { setActiveTab('reservations'); setPage(1); }}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'reservations'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-250'
          }`}
        >
          Reservation Holds
        </button>
      </div>

      {/* Search Input Bar (only for loans/checkouts search) */}
      {activeTab !== 'reservations' && (
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or book title..."
            className="form-input pl-9 text-xs"
          />
        </div>
      )}

      {/* Grid Tables Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-400">Fetching records...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* ==================== BORROW REQUESTS TABLE ==================== */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {borrowRecords.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                  <Inbox className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Inbox is empty</h3>
                  <p className="text-xs mt-1">No pending borrow requests waiting for approval.</p>
                </div>
              ) : (
                borrowRecords.map((rec) => (
                  <div key={rec._id} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-205 dark:border-slate-850">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Student Profile</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rec.user?.name}</h4>
                      <p className="text-xs text-slate-500">{rec.user?.email}</p>
                      
                      <div className="pt-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Book Details</span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rec.book?.title}</p>
                        <p className="text-[10px] text-slate-400">Available: {rec.book?.copiesAvailable} / {rec.book?.copiesTotal}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:self-end">
                      <button
                        onClick={() => handleRejectBorrow(rec._id)}
                        className="btn-secondary text-xs px-4 py-2 hover:bg-rose-100 hover:text-rose-600 border border-rose-500/10 cursor-pointer active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveBorrow(rec._id)}
                        className="btn-primary text-xs px-4 py-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Issue Book
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== ACTIVE CHECKOUTS TABLE ==================== */}
          {activeTab === 'checkouts' && (
            <div className="space-y-4">
              {borrowRecords.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                  <FileCheck2 className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No active checkouts</h3>
                  <p className="text-xs mt-1">No books are currently checked out by readers.</p>
                </div>
              ) : (
                borrowRecords.map((rec) => (
                  <div key={rec._id} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-205 dark:border-slate-850">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rec.user?.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                          rec.status === 'overdue' ? 'bg-rose-500/15 text-rose-600' : 'bg-indigo-500/15 text-indigo-650'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{rec.book?.title}</p>
                      <div className="flex gap-4 text-[10px] text-slate-400 pt-1">
                        <span>Issued: {rec.borrowDate ? new Date(rec.borrowDate).toLocaleDateString() : 'N/A'}</span>
                        <span>Due: {new Date(rec.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:self-end">
                      {rec.fineAmount > 0 && (
                        <div className="text-xs font-bold text-rose-500 mr-2 flex items-center gap-1 select-none">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Est. Fine: ${rec.fineAmount.toFixed(2)}
                        </div>
                      )}
                      <button
                        onClick={() => handleCheckinReturn(rec._id)}
                        className="btn-primary text-xs px-4 py-2 cursor-pointer active:scale-95 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        Check-in Return
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== RESERVATIONS TABLE ==================== */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              {reservations.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                  <ClipboardList className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-705 text-sm">No reservations</h3>
                  <p className="text-xs mt-1">No reservation requests are currently pending approval.</p>
                </div>
              ) : (
                reservations.map((res) => (
                  <div key={res._id} className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-205 dark:border-slate-850">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Student Reservation</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{res.user?.name}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{res.book?.title}</p>
                      <p className="text-[10px] text-slate-400">Requested on: {new Date(res.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-2 md:self-end">
                      <button
                        onClick={() => handleCancelReservation(res._id)}
                        className="btn-secondary text-xs px-4 py-2 hover:bg-rose-100 hover:text-rose-600 border border-rose-500/10 cursor-pointer active:scale-95"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleApproveReservation(res._id)}
                        className="btn-primary text-xs px-4 py-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Hold
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => loadTransactions(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadTransactions(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 disabled:opacity-50 cursor-pointer"
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
