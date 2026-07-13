import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings as SettingsIcon, User, ShieldCheck, Mail, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../services/api';

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Admin System Settings Form
  const {
    register: registerSystem,
    handleSubmit: handleSystemSubmit,
  } = useForm({
    defaultValues: {
      loanDuration: 14,
      fineRate: 2.00,
      holdDuration: 3,
    },
  });

  const onProfileSubmit = async (data: any) => {
    setProfileLoading(true);
    try {
      const res = await updateProfile(data);
      if (res.success) {
        showToast('Profile updated successfully', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const onSystemSubmit = async (data: any) => {
    setSystemLoading(true);
    try {
      // Simulate admin system parameters update
      setTimeout(() => {
        showToast('System configuration settings saved successfully!', 'success');
        setSystemLoading(false);
      }, 1000);
    } catch (err) {
      showToast('Could not save system settings', 'error');
      setSystemLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure profile details and system parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar Panel */}
        <div className="md:col-span-1 space-y-4">
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">Settings Sections</h3>
            <div className="space-y-2">
              <span className="flex items-center gap-2 px-3 py-2 bg-brand-500/10 text-brand-650 dark:text-brand-400 font-semibold rounded-xl text-xs">
                <User className="w-4 h-4" />
                Profile Settings
              </span>
              {user?.role === 'admin' && (
                <span className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs cursor-pointer">
                  <SettingsIcon className="w-4 h-4" />
                  Library Policies
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form Containers */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile settings card */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="font-bold text-base text-slate-909 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Update Profile Details
            </h3>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  {...registerProfile('name', { required: 'Name is required' })}
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  {...registerProfile('email', { required: 'Email is required' })}
                  className="form-input text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary py-2 px-4 text-xs rounded-xl shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* System Settings card (Admin only) */}
          {user?.role === 'admin' && (
            <div className="glass-card p-6 rounded-3xl">
              <h3 className="font-bold text-base text-slate-909 dark:text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-indigo-550" />
                Library Policy Settings
              </h3>

              <form onSubmit={handleSystemSubmit(onSystemSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Borrow Duration */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Loan Period (Days)
                    </label>
                    <input
                      type="number"
                      {...registerSystem('loanDuration')}
                      className="form-input text-xs"
                    />
                  </div>

                  {/* Fine rate */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Overdue Fee ($ / day)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...registerSystem('fineRate')}
                      className="form-input text-xs"
                    />
                  </div>

                  {/* Hold Duration */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Hold Expiry (Days)
                    </label>
                    <input
                      type="number"
                      {...registerSystem('holdDuration')}
                      className="form-input text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={systemLoading}
                    className="btn-primary py-2 px-4 text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Policies
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
