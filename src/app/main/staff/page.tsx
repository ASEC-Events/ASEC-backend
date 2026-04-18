'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Briefcase, Edit, Trash2, Users, X } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { useToast } from '../../components/Toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  salary: number;
  hireDate: string;
}

const departments = ['Events', 'Catering', 'Security', 'Marketing', 'Maintenance', 'Admin', 'Technical', 'HR'];
const roles = ['Event Manager', 'Senior Chef', 'Security Lead', 'Marketing Manager', 'Maintenance Staff', 'Receptionist', 'Audio/Visual Tech', 'HR Coordinator', 'Cleaner', 'Waiter', 'Bartender', 'Other'];

export default function StaffPage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const { showToast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<Staff | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal, handleClickOutside]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active',
    salary: '',
    hireDate: '',
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        salary: Number(formData.salary),
      };

      if (editingStaff) {
        await fetch(`/api/staff?id=${editingStaff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Staff updated successfully", "success");
      } else {
        await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Staff added successfully", "success");
      }

      setShowModal(false);
      setEditingStaff(null);
      setFormData({ name: '', email: '', phone: '', role: '', department: '', status: 'active', salary: '', hireDate: '' });
      fetchStaff();
    } catch (error) {
      showToast("Failed to save staff", "error");
    }
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      status: member.status,
      salary: String(member.salary),
      hireDate: member.hireDate,
    });
    setShowModal(true);
  };

  const handleDelete = (member: Staff) => {
    setDeleteStaff(member);
  };

  const confirmDelete = async () => {
    if (!deleteStaff) return;
    try {
      await fetch(`/api/staff?id=${deleteStaff.id}`, { method: 'DELETE' });
      showToast("Staff deleted successfully", "success");
      fetchStaff();
    } catch (error) {
      showToast("Failed to delete staff", "error");
    } finally {
      setDeleteStaff(null);
    }
  };

  const activeStaff = staff.filter(m => m.status === 'active').length;

  const filteredStaff = staff.filter((member) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Staff</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Manage your team members</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className={isDark ? 'text-slate-400' : 'text-sm text-slate-600'}>Total Staff</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{staff.length}</p>
            </div>
          </div>
        </div>

        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className={isDark ? 'text-slate-400' : 'text-sm text-slate-600'}>Active Staff</p>
              <p className="text-2xl font-bold text-green-600">{activeStaff}</p>
            </div>
          </div>
        </div>

        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className={isDark ? 'text-slate-400' : 'text-sm text-slate-600'}>Inactive Staff</p>
              <p className="text-2xl font-bold text-red-600">{staff.length - activeStaff}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Name</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Contact</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Department</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Hire Date</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <tr key={member.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="py-4 px-4">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{member.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>{member.email}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{member.phone}</p>
                    </td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{member.role}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        {member.department}
                      </span>
                    </td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{member.hireDate}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' 
                          ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700')
                          : (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(member)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                          <Edit className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                        </button>
                        <button onClick={() => handleDelete(member)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>No staff found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col`}>
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {editingStaff ? "Edit Staff" : "Add New Staff"}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Salary (₦/month)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="input w-full xs:max-w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStaff(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingStaff ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-md`}>
            <div className="p-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'} mb-2`}>
                Delete Staff
              </h2>
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                Are you sure you want to delete{" "}
                <span className="font-medium">{deleteStaff.name}</span>? This
                action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteStaff(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}