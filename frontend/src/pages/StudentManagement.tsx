import React, { useEffect, useState } from 'react';
import { Users, Search, Edit2, Trash2, ShieldCheck, Mail, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export const StudentManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Role edit states
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'librarian' | 'student'>('student');
  const [roleLoading, setRoleLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = async (targetPage = 1) => {
    // If not Admin, backend returns 403. Let's handle it
    if (currentUser?.role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/auth/users', {
        params: {
          page: targetPage,
          limit: 10,
          search: searchQuery.trim(),
          role: roleFilter,
        }
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pages || 1);
        setPage(res.data.currentPage || 1);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to fetch user accounts directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [searchQuery, roleFilter]);

  const handleOpenRoleModal = (user: any) => {
    setEditingUser(user);
    setSelectedRole(user.role);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setRoleLoading(true);
    try {
      const res = await api.put(`/auth/users/${editingUser._id}/role`, { role: selectedRole });
      if (res.data.success) {
        showToast(`User role updated to ${selectedRole} successfully`, 'success');
        setEditingUser(null);
        loadUsers(page);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update user role';
      showToast(msg, 'error');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showToast('You cannot delete your own admin account!', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user card permanently? This action cannot be undone.')) return;
    
    try {
      const res = await api.delete(`/auth/users/${userId}`);
      if (res.data.success) {
        showToast('User card deleted successfully', 'success');
        loadUsers(page);
      }
    } catch (err) {
      showToast('Could not delete user account', 'error');
    }
  };

  // If Librarian, show warning notice since backend block exists
  if (currentUser?.role !== 'admin') {
    return (
      <div className="glass-card p-8 rounded-3xl text-center max-w-md mx-auto page-fade-in mt-12">
        <Users className="w-12 h-12 mx-auto text-slate-400 opacity-30 mb-3" />
        <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">User Directory Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Access to student registrations, accounts, and librarians role adjustments is restricted to System Administrators. Please contact an admin for user account overrides.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System User Directory</h2>
        <p className="text-xs text-slate-400 mt-1">Review registered students, edit librarian permissions, and manage roles</p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or email..."
            className="form-input pl-9 text-xs"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-input text-xs w-full sm:w-44"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="librarian">Librarians</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-400">Syncing user directory...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
              <Users className="w-12 h-12 mx-auto opacity-20 mb-3" />
              <h3 className="font-bold text-slate-705 text-sm">No users found</h3>
              <p className="text-xs mt-1">No user profiles match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-slate-900 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-205 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Joined On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {users.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">{item.name}</td>
                      <td className="p-4 text-slate-650 dark:text-slate-300 font-mono">{item.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          item.role === 'admin' 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                            : item.role === 'librarian'
                            ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.isVerified ? (
                          <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 animate-pulse" />
                            Pending Verification
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenRoleModal(item)}
                            className="p-2 rounded-xl text-slate-450 hover:text-brand-600 hover:bg-brand-500/10 cursor-pointer"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item._id)}
                            disabled={item._id === currentUser.id}
                            className="p-2 rounded-xl text-slate-450 hover:text-rose-650 hover:bg-rose-550/10 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => loadUsers(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-205 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadUsers(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-205 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== UPDATE USER ROLE MODAL ==================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/65 backdrop-blur-xs" onClick={() => setEditingUser(null)} />
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10 page-slide-up">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">Update User Role</h3>
            <p className="text-xs text-slate-400 mb-4 truncate">Account: {editingUser.email}</p>
            
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="form-input text-xs"
                >
                  <option value="student">Student Card (Read-Only operations)</option>
                  <option value="librarian">Librarian (Book mgmt, issues/returns)</option>
                  <option value="admin">System Administrator (Full access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary py-2 px-3.5 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleLoading}
                  className="btn-primary py-2 px-3.5 text-xs rounded-xl shadow-md"
                >
                  {roleLoading ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
