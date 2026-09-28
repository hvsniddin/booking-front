import React, { useState, useEffect } from 'react';
import { servicesApi, providersApi, bookingsApi } from '../api/endpoints';
import { Service, Provider, Booking } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  Search,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export type AdminSection = 'services' | 'providers' | 'bookings';

interface AdminPanelProps {
  section: AdminSection;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ section }) => {
  const { success, error } = useToast();
  const activeTab = section;

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  // Providers State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<Provider> | null>(null);

  // Bookings State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (activeTab === 'services') fetchServices();
    if (activeTab === 'providers') {
      fetchProviders();
      fetchServices();
    }
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const res = await servicesApi.list();
      setServices(Array.isArray(res) ? res : res.results || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch services');
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await providersApi.list();
      setProviders(Array.isArray(res) ? res : res.results || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await bookingsApi.list();
      const list = Array.isArray(res) ? res : res.results || [];
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBookings(list);
    } catch (err: any) {
      error(err.message || 'Failed to fetch bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Service Save (Create / Update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name || !editingService?.price || !editingService?.duration_minutes) {
      error('Please fill in all required service fields.');
      return;
    }

    try {
      if (editingService.id) {
        await servicesApi.update(editingService.id, editingService);
        success('Service updated successfully!');
      } else {
        await servicesApi.create(editingService);
        success('Service created successfully!');
      }
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      error(err.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await servicesApi.delete(id);
      success('Service deleted.');
      fetchServices();
    } catch (err: any) {
      error(err.message || 'Failed to delete service');
    }
  };

  // Provider Save (Create / Update)
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider?.name || !editingProvider?.email) {
      error('Provider name and email are required.');
      return;
    }

    try {
      const serviceIds = (editingProvider.services || []).map((s: any) =>
        typeof s === 'object' ? s.id : s
      );

      const payload = {
        name: editingProvider.name,
        email: editingProvider.email,
        phone_number: editingProvider.phone_number || '',
        bio: editingProvider.bio || '',
        timezone: editingProvider.timezone || 'UTC',
        is_active: editingProvider.is_active ?? true,
        user: editingProvider.user ? Number(editingProvider.user) : null,
        service_ids: serviceIds,
      };

      if (editingProvider.id) {
        await providersApi.update(editingProvider.id, payload);
        success('Provider updated successfully!');
      } else {
        await providersApi.create(payload);
        success('Provider created successfully!');
      }
      setEditingProvider(null);
      fetchProviders();
    } catch (err: any) {
      error(err.message || 'Failed to save provider');
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    try {
      await providersApi.delete(id);
      success('Provider deleted.');
      fetchProviders();
    } catch (err: any) {
      error(err.message || 'Failed to delete provider');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
            System Administration
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {section === 'services' ? 'Services' : section === 'providers' ? 'Providers' : 'Bookings'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {section === 'services'
              ? 'Create and manage the services available for booking.'
              : section === 'providers'
                ? 'Manage providers and their assigned services.'
                : 'Review and monitor all customer bookings.'}
          </p>
        </div>
      </div>

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Services</h2>
            <button
              onClick={() =>
                setEditingService({
                  name: '',
                  description: '',
                  duration_minutes: 30,
                  price: '50.00',
                  buffer_time_minutes: 10,
                  is_active: true,
                })
              }
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add New Service
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Duration</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Buffer</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-slate-500 line-clamp-1 max-w-xs">{s.description}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {s.duration_minutes} mins
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-600">
                        ${parseFloat(s.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        +{s.buffer_time_minutes} mins
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            s.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingService(s)}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROVIDERS TAB */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Providers</h2>
            <button
              onClick={() =>
                setEditingProvider({
                  name: '',
                  email: '',
                  phone_number: '',
                  bio: '',
                  timezone: 'UTC',
                  is_active: true,
                  services: [],
                })
              }
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add New Provider
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Linked User</th>
                    <th className="px-6 py-3.5">Timezone</th>
                    <th className="px-6 py-3.5">Assigned Services</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-slate-500 line-clamp-1 max-w-xs">{p.bio}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <p>{p.email}</p>
                        <p className="text-[11px] text-slate-400">{p.phone_number}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {p.user_detail ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              User #{p.user}
                            </span>
                            <p className="text-[11px] text-brand-600 dark:text-brand-400">
                              {p.user_detail.email}
                            </p>
                          </div>
                        ) : p.user ? (
                          <span className="font-semibold text-slate-900 dark:text-white">
                            User #{p.user}
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded text-[11px] font-medium">
                            Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">
                        {p.timezone}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {p.services ? p.services.length : 0} services
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            p.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProvider(p)}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(p.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Global Booking Log</h2>
            <button
              onClick={fetchBookings}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Service & Customer</th>
                    <th className="px-6 py-3.5">Provider</th>
                    <th className="px-6 py-3.5">Date & Slot</th>
                    <th className="px-6 py-3.5">Total Price</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-mono text-slate-400">#{b.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{b.service?.name}</p>
                        <p className="text-slate-500">{b.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {b.provider?.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {format(new Date(b.start_time), 'MMM d, yyyy')}
                        </p>
                        <p>{format(new Date(b.start_time), 'hh:mm a')}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-brand-600">
                        ${parseFloat(b.total_price || '0').toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : b.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : b.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE EDIT/CREATE MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingService.id ? 'Edit Service' : 'Create New Service'}
            </h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="Deep Tissue Massage"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Detailed explanation of what the client receives..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Duration (mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={editingService.duration_minutes || 30}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        duration_minutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={editingService.price || ''}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Buffer (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={editingService.buffer_time_minutes ?? 10}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        buffer_time_minutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="srv_active"
                  checked={editingService.is_active ?? true}
                  onChange={(e) =>
                    setEditingService({ ...editingService, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="srv_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Service is active and open for bookings
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVIDER EDIT/CREATE MODAL */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingProvider.id ? 'Edit Provider' : 'Create New Provider'}
            </h3>
            <form onSubmit={handleSaveProvider} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingProvider.name || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  placeholder="Dr. Jane Smith"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingProvider.email || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingProvider.phone_number || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, phone_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Bio / Specialties
                </label>
                <textarea
                  rows={2}
                  value={editingProvider.bio || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, bio: e.target.value })}
                  placeholder="Specialist credentials and introduction..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Linked User Account ID (Optional)
                </label>
                <input
                  type="number"
                  value={editingProvider.user ?? ''}
                  onChange={(e) =>
                    setEditingProvider({
                      ...editingProvider,
                      user: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Links this specialist profile to a registered user account so they can manage their own working hours, time-offs, and appointments.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Assigned Services
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                  {services.map((srv) => {
                    const currentServiceIds: number[] = (editingProvider.services || []).map((s: any) =>
                      typeof s === 'object' ? s.id : s
                    );
                    const isChecked = currentServiceIds.includes(srv.id);
                    return (
                      <label key={srv.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingProvider({ ...editingProvider, services: [...currentServiceIds, srv.id] });
                            } else {
                              setEditingProvider({
                                ...editingProvider,
                                services: currentServiceIds.filter((id) => id !== srv.id),
                              });
                            }
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="truncate">{srv.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prov_active"
                  checked={editingProvider.is_active ?? true}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="prov_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Provider is active and ready to accept bookings
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
