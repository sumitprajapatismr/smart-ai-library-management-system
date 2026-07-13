import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ShieldCheck, MapPin, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const StudyRoomsTab: React.FC = () => {
  const { showToast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [roomName, setRoomName] = useState('Study Room A');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState('10:00 AM - 12:00 PM');

  const slots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM'
  ];

  const rooms = [
    { name: 'Study Room A', capacity: '4 Seats', desc: 'Equipped with whiteboards and focus lighting' },
    { name: 'Study Room B', capacity: '6 Seats', desc: 'Dual-monitor setup for project collaboration' },
    { name: 'Study Room C', capacity: '10 Seats', desc: 'Equipped with presentation projector screen' }
  ];

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/premium/rooms/my-reservations');
      if (res.data.success) {
        setReservations(res.data.reservations);
      }
      
      const activeRes = await api.get('/premium/rooms/active');
      if (activeRes.data.success) {
        setActiveReservations(res.data.reservations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/premium/rooms/reserve', { roomName, date, slot });
      if (res.data.success) {
        showToast('Study Room booked successfully!', 'success');
        loadReservations();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to book study room';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Booking Form */}
      <div className="glass-card p-6 rounded-3xl space-y-6">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          Book Study Room Slot
        </h3>
        
        <form onSubmit={handleReserve} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1.5">Select Room</label>
            <select
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="form-input text-xs"
            >
              {rooms.map((r, idx) => (
                <option key={idx} value={r.name}>{r.name} ({r.capacity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="form-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Time Slot</label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="form-input text-xs"
            >
              {slots.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl cursor-pointer"
          >
            {actionLoading ? 'Booking...' : 'Book Room Slot'}
          </button>
        </form>
      </div>

      {/* Booking List & Live Occupancy */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Your Study Room Bookings
          </h3>

          <div className="space-y-3 max-h-[25rem] overflow-y-auto pr-1">
            {reservations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active room bookings recorded.</p>
            ) : (
              reservations.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-205/45 dark:border-slate-850 rounded-2xl"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      {item.roomName}
                    </h4>
                    <p className="text-[10px] text-slate-550 flex items-center gap-2">
                      <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                      <span>⏰ {item.slot}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Approved
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
