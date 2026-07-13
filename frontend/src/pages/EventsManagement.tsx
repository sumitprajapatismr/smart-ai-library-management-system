import React, { useEffect, useState } from 'react';
import { Calendar, Users, MapPin, Clock, Award, ShieldCheck, Plus, X, Award as CertIcon } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

export const EventsManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states for new event
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [tags, setTags] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      if (res.data.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load events list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const res = await api.post(`/events/register/${eventId}`);
      if (res.data.success) {
        showToast('Registered for library event successfully!', 'success');
        loadEvents();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not register for event';
      showToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadCertificate = async (eventId: string, eventTitle: string, eventSpeaker: string, eventDate: string) => {
    setActionLoading(eventId);
    try {
      const res = await api.get(`/events/certificate/${eventId}`);
      if (res.data.success) {
        const certId = res.data.certificateId;
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Background color
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, 297, 210, 'F');

        // Gold border lines
        doc.setDrawColor(245, 158, 11); // Amber-500
        doc.setLineWidth(1.5);
        doc.rect(10, 10, 277, 190);
        doc.setDrawColor(37, 99, 235); // Blue-600
        doc.setLineWidth(0.5);
        doc.rect(13, 13, 271, 184);

        // Header Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text('CERTIFICATE OF ACCOMPLISHMENT', 148, 45, { align: 'center' });

        // Subtext
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('This is proudly awarded to', 148, 65, { align: 'center' });

        // Student name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.text(user?.name.toUpperCase() || 'STUDENT NAME', 148, 80, { align: 'center' });

        // Body Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(`for successfully attending and completing the library workshop`, 148, 98, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`"${eventTitle.toUpperCase()}"`, 148, 110, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`conducted by ${eventSpeaker} on ${new Date(eventDate).toLocaleDateString()}`, 148, 120, { align: 'center' });

        // Signature Lines
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.line(50, 165, 110, 165);
        doc.line(187, 165, 247, 165);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Sumit Prajapati', 80, 172, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('Lead Systems Architect', 80, 178, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('ALPHA Core AI', 217, 172, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('Verification Director', 217, 178, { align: 'center' });

        // Verification ID
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Verification Hash ID: ${certId}`, 148, 195, { align: 'center' });

        doc.save(`ALPHA_Event_Certificate_${eventId}.pdf`);
        showToast('Certificate generated & downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not compile certificate PDF', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !speaker || !date || !location) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setFormLoading(true);
    try {
      const res = await api.post('/events', {
        title,
        description,
        speaker,
        date,
        location,
        capacity: capacity ? parseInt(capacity) : undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      if (res.data.success) {
        showToast('Library event created successfully!', 'success');
        setShowAddModal(false);
        // Reset forms
        setTitle('');
        setDescription('');
        setSpeaker('');
        setDate('');
        setLocation('');
        setCapacity('50');
        setTags('');
        loadEvents();
      }
    } catch (err) {
      showToast('Failed to create event', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-455">Loading events schedule...</p>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
  const completedEvents = events.filter(e => new Date(e.date) < new Date());

  return (
    <div className="space-y-6 page-fade-in">
      
      {/* Header banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Events Management & Timelines</h2>
          <p className="text-xs text-slate-450 mt-1">Register for library workshops, hackathons, and book fairs</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'librarian') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Upcoming Events Column */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-655" />
          Upcoming Activities
        </h3>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
            <Calendar className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <h4 className="font-bold text-sm text-slate-705">No Upcoming Activities</h4>
            <p className="text-xs mt-1">Check back later for scheduled coding workshops or book fairs!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map((item) => {
              const isRegistered = item.attendees.includes(user?.id);
              const capacityFull = item.capacity && item.attendees.length >= item.capacity;
              return (
                <div
                  key={item._id}
                  className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-800 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {item.location}
                      </span>
                      <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.attendees.length} / {item.capacity || 'Unlimited'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">Hosted by {item.speaker}</p>
                    <p className="text-xs text-slate-505 dark:text-slate-400 leading-normal">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3">
                    <span className="text-[10px] font-bold text-slate-400">
                      📅 {new Date(item.date).toLocaleDateString()}
                    </span>

                    {isRegistered ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(item._id)}
                        disabled={actionLoading === item._id || capacityFull}
                        className="btn-primary py-1.5 px-4 text-[10px] font-bold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === item._id ? 'Joining...' : capacityFull ? 'Full' : 'Register Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Events Column */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Completed Activities & Certificates
        </h3>

        {completedEvents.length === 0 ? (
          <p className="text-xs text-slate-450 py-4">No completed workshops on file.</p>
        ) : (
          <div className="space-y-3">
            {completedEvents.map((item) => {
              const isRegistered = item.attendees.includes(user?.id);
              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-205 dark:border-slate-850 rounded-2xl"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-805 dark:text-white">{item.title}</h4>
                    <p className="text-[10px] text-slate-405 mt-1">Conducted by {item.speaker} on {new Date(item.date).toLocaleDateString()}</p>
                  </div>

                  {isRegistered ? (
                    <button
                      onClick={() => handleDownloadCertificate(item._id, item.title, item.speaker, item.date)}
                      disabled={actionLoading === item._id}
                      className="btn-secondary py-1.5 px-3.5 text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-550" />
                      Get Certificate
                    </button>
                  ) : (
                    <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Did Not Attend
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850">
              <h3 className="font-extrabold text-sm text-slate-905 dark:text-white">Schedule New Workshop Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4 max-h-[30rem] overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Workshop Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Masterclass in Docker Containers"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Host Speaker *</label>
                <input
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="e.g. Dr. Jane Foster"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Event Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Location/Room *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Seminar Hall A"
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Seats Capacity Limit</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Topic Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Docker, Devops"
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1.5">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide event details..."
                  className="form-input text-xs h-24 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full btn-primary py-2.5 text-xs font-bold rounded-xl cursor-pointer"
              >
                {formLoading ? 'Scheduling...' : 'Publish Event Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
