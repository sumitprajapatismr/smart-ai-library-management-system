import React, { useEffect, useState } from 'react';
import { 
  History, Calendar, ShieldAlert, BadgeHelp, CheckCircle2, 
  Trash2, CreditCard, Sparkles, AlertTriangle, BookCheck 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const BorrowHistory: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'loans' | 'history' | 'reservations' | 'fines'>('loans');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [totalFines, setTotalFines] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'loans' || activeTab === 'history') {
        const res = await api.get('/borrows/my-history', {
          params: { limit: 20 },
        });
        if (res.data.success) {
          setRecords(res.data.records);
        }
      } else if (activeTab === 'reservations') {
        const res = await api.get('/reservations/my-reservations');
        if (res.data.success) {
          setReservations(res.data.reservations);
        }
      } else if (activeTab === 'fines') {
        const res = await api.get('/fines/my-fines');
        if (res.data.success) {
          setFines(res.data.fines);
          setTotalFines(res.data.totalUnpaidAmount);
        }
      }
    } catch (err) {
      console.error('Error loading history details:', err);
      showToast('Could not load transaction data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this book reservation?')) return;
    try {
      const res = await api.put(`/reservations/cancel/${reservationId}`);
      if (res.data.success) {
        showToast('Reservation cancelled successfully', 'success');
        loadData();
      }
    } catch (err) {
      showToast('Could not cancel reservation', 'error');
    }
  };

  const handlePayFine = async (fineId: string, amount: number) => {
    try {
      const res = await api.put(`/fines/pay/${fineId}`);
      if (res.data.success) {
        showToast(`Fine payment of $${amount.toFixed(2)} successful!`, 'success');
        
        // Premium reward feedback: trigger confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        loadData();
      }
    } catch (err) {
      showToast('Payment processing failed. Try again.', 'error');
    }
  };

  // Helper to dynamically calculate and return an AI due date reminder
  const getAiDueDateReminder = (record: any) => {
    const today = new Date();
    const due = new Date(record.dueDate);
    
    // Check if returned
    if (record.status === 'returned') return null;

    // Calculate time difference in days
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysLate = Math.abs(diffDays);
      return {
        type: 'danger',
        message: `AI Alert: This book is overdue by ${daysLate} days. Return it today to stop the $2.00/day fee from climbing further! Current late fee is $${(daysLate * 2).toFixed(2)}.`
      };
    } else if (diffDays === 0) {
      return {
        type: 'warning',
        message: `AI Reminder: This book is due TODAY. Drop it off at the desk by 5:00 PM to avoid starting late fees.`
      };
    } else if (diffDays <= 3) {
      return {
        type: 'warning',
        message: `AI Suggestion: You have ${diffDays} days left. Plan to drop this off soon or renew to avoid a late fee.`
      };
    } else {
      return {
        type: 'info',
        message: `AI Insight: You have ${diffDays} days remaining. Keep enjoying your reading! No immediate actions required.`
      };
    }
  };

  const activeLoans = records.filter(r => r.status === 'borrowed' || r.status === 'overdue' || r.status === 'requested');
  const pastLoans = records.filter(r => r.status === 'returned' || r.status === 'cancelled');

  return (
    <div className="space-y-6 page-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Transactions & Fines</h2>
        <p className="text-xs text-slate-400 mt-1">Review active loans, reservations, and clear outstanding balances</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-slate-205 dark:border-slate-850 pb-px overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'loans'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          Active Loans ({loading && activeTab !== 'loans' ? '...' : activeLoans.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'history'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          Return History
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'reservations'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          Holds & Reservations
        </button>
        <button
          onClick={() => setActiveTab('fines')}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'fines'
              ? 'border-brand-600 text-brand-650 dark:text-brand-400'
              : 'border-transparent text-slate-450 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          Fines & Fees {totalFines > 0 && <span className="text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.5 ml-1 animate-pulse">${totalFines.toFixed(2)}</span>}
        </button>
      </div>

      {/* Loading state panel */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-400">Syncing with ledger...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ==================== ACTIVE LOANS TAB ==================== */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              {activeLoans.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                  <BookCheck className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No active loans</h3>
                  <p className="text-xs max-w-xs mx-auto mt-2">
                    You do not have any books checked out right now. Head over to Search page to borrow one!
                  </p>
                </div>
              ) : (
                activeLoans.map((record) => {
                  const aiHint = getAiDueDateReminder(record);
                  return (
                    <div key={record._id} className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850/80 flex flex-col gap-4">
                      {/* Book metadata row */}
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-405 block mb-1">
                            {record.book?.categories?.map((c: any) => c.name).join(', ') || 'Genre'}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">{record.book?.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">by {record.book?.authors?.map((a: any) => a.name).join(', ') || 'Author'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            record.status === 'borrowed'
                              ? 'bg-indigo-500/10 text-indigo-650'
                              : record.status === 'requested'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-650'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>

                      {/* Dates row */}
                      <div className="flex gap-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850/80 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Checked Out: <strong className="text-slate-700 dark:text-slate-300">{record.borrowDate ? new Date(record.borrowDate).toLocaleDateString() : 'Pending'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-405" />
                          <span>Due Date: <strong className="text-slate-750 dark:text-slate-300">{new Date(record.dueDate).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      {/* AI suggestions container */}
                      {aiHint && (
                        <div className={`p-3 rounded-xl border text-[11px] leading-normal flex items-start gap-2 ${
                          aiHint.type === 'danger'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-405'
                            : aiHint.type === 'warning'
                            ? 'bg-amber-550/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-brand-500/5 border-brand-500/10 text-slate-550 dark:text-slate-405'
                        }`}>
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p>{aiHint.message}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ==================== RETURN HISTORY TAB ==================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {pastLoans.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-405 rounded-3xl">
                  <History className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No return records</h3>
                  <p className="text-xs mt-2">You haven't returned any books yet.</p>
                </div>
              ) : (
                pastLoans.map((record) => (
                  <div key={record._id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{record.book?.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">by {record.book?.authors?.map((a: any) => a.name).join(', ')}</p>
                      <div className="flex gap-4 text-[11px] text-slate-400 mt-2.5">
                        <span>Issued: {record.borrowDate ? new Date(record.borrowDate).toLocaleDateString() : 'N/A'}</span>
                        <span>Returned: {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${
                        record.status === 'returned' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-550'
                      }`}>
                        {record.status}
                      </span>
                      {record.fineAmount > 0 && (
                        <span className="text-xs font-bold text-rose-500">Fine Charged: ${record.fineAmount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== RESERVATIONS TAB ==================== */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              {reservations.length === 0 ? (
                <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                  <BadgeHelp className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <h3 className="font-bold text-slate-705 text-sm">No reservations</h3>
                  <p className="text-xs mt-2">You don't have any pending holds or reservations.</p>
                </div>
              ) : (
                reservations.map((res) => (
                  <div key={res._id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{res.book?.title}</h4>
                      <p className="text-xs text-slate-450 mt-0.5">by {res.book?.authors?.map((a: any) => a.name).join(', ') || 'Author'}</p>
                      <div className="flex gap-4 text-[11px] text-slate-400 mt-2">
                        <span>Reserved on: {new Date(res.createdAt).toLocaleDateString()}</span>
                        <span>Hold Expiry: {res.holdUntil ? new Date(res.holdUntil).toLocaleDateString() : 'Awaiting hold date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-600'
                          : res.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 animate-pulse'
                          : 'bg-slate-100 text-slate-450'
                      }`}>
                        {res.status}
                      </span>
                      {res.status !== 'cancelled' && res.status !== 'expired' && (
                        <button
                          onClick={() => handleCancelReservation(res._id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ==================== FINES TAB ==================== */}
          {activeTab === 'fines' && (
            <div className="space-y-6">
              {/* Balances card banner */}
              <div className="glass-card p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${totalFines > 0 ? 'bg-rose-500/15 text-rose-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Total Unpaid Balance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Please pay overdue balances to request new borrow slots</p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <span className={`text-3xl font-extrabold block ${totalFines > 0 ? 'text-rose-450' : 'text-emerald-400'}`}>
                    ${totalFines.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold">Outstanding Ledger</span>
                </div>
              </div>

              {/* Fines table */}
              <div className="space-y-4">
                {fines.length === 0 ? (
                  <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
                    <CheckCircle2 className="w-12 h-12 mx-auto opacity-20 mb-3 text-emerald-500" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Account balance is clear</h3>
                    <p className="text-xs mt-2">You don't have any outstanding late return fines!</p>
                  </div>
                ) : (
                  fines.map((fine) => (
                    <div key={fine._id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Late Return: {fine.borrowRecord?.book?.title || 'Book Title'}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Overdue fine charge generated on return</p>
                        <div className="flex gap-4 text-[10px] text-slate-400 mt-2">
                          <span>Charged: {new Date(fine.createdAt).toLocaleDateString()}</span>
                          <span>Status: <strong className={fine.status === 'paid' ? 'text-emerald-500' : 'text-rose-500'}>{fine.status}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-extrabold text-slate-800 dark:text-slate-200">${fine.amount.toFixed(2)}</span>
                        {fine.status === 'unpaid' && (
                          <button
                            onClick={() => handlePayFine(fine._id, fine.amount)}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Fine
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
