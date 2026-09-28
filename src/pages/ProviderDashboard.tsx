import React, { useState, useEffect } from 'react';
import { 
  providersApi, 
  workingHoursApi, 
  timeOffApi, 
  bookingsApi 
} from '../api/endpoints';
import { 
  Provider, 
  WorkingHour, 
  TimeOff, 
  Booking,
  BookingStatus 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  CalendarDays, 
  CalendarPlus,
  UserCheck, 
  AlertCircle,
  FileText,
  Palmtree,
  Settings,
  HelpCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { getGoogleCalendarUrl } from '../utils/googleCalendar';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type ProviderSection = 'appointments' | 'hours' | 'timeoff';

interface ProviderDashboardProps {
  section: ProviderSection;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ section }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const activeTab = section;

  // Appointments state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Working hours state
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [editingHours, setEditingHours] = useState<{ [day: number]: { start: string; end: string; is_day_off: boolean; id?: number } }>({});
  const [savingHours, setSavingHours] = useState(false);

  // Time off state
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loadingTimeOffs, setLoadingTimeOffs] = useState(false);
  const [newTimeOff, setNewTimeOff] = useState({
    start_datetime: '',
    end_datetime: '',
    reason: '',
  });

  useEffect(() => {
    fetchProviderProfile();
  }, [user]);

  const fetchProviderProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await providersApi.list();
      const list: Provider[] = Array.isArray(res) ? res : res.results || [];
      setAllProviders(list);

      // 1. Find provider linked to current user
      const matched = list.find((p) => {
        const linkedUserId = typeof p.user === 'object' && p.user !== null
          ? (p.user as { id?: number }).id
          : p.user;

        return Number(linkedUserId) === user?.id || p.user_detail?.id === user?.id;
      });

      if (matched) {
        setProvider(matched);
      } else if (user?.role === 'ADMIN') {
        // Admin can inspect providers if not specifically linked to one
        if (list.length > 0) {
          setProvider(list[0]);
        } else {
          setProvider(null);
        }
      } else {
        // Regular PROVIDER role with no profile linked yet
        setProvider(null);
      }
    } catch (err: any) {
      error(err.message || 'Could not load provider profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (provider) {
      if (activeTab === 'appointments') fetchBookings();
      if (activeTab === 'hours') fetchWorkingHours();
      if (activeTab === 'timeoff') fetchTimeOffs();
    }
  }, [provider, activeTab]);

  const fetchBookings = async () => {
    if (!provider) return;
    setLoadingBookings(true);
    try {
      const res = await bookingsApi.list({ provider: provider.id, provider_id: provider.id });
      const list = Array.isArray(res) ? res : res.results || [];
      list.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setBookings(list);
    } catch (err: any) {
      error(err.message || 'Failed to fetch appointments');
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchWorkingHours = async () => {
    if (!provider) return;
    setLoadingHours(true);
    try {
      const res = await workingHoursApi.list({ provider: provider.id });
      const list: WorkingHour[] = Array.isArray(res) ? res : res.results || [];
      setWorkingHours(list);

      // Prepopulate map
      const map: any = {};
      for (let i = 0; i < 7; i++) {
        const found = list.find((w) => w.day_of_week === i);
        if (found) {
          map[i] = {
            id: found.id,
            start: found.start_time.substring(0, 5),
            end: found.end_time.substring(0, 5),
            is_day_off: found.is_day_off,
          };
        } else {
          map[i] = {
            start: '09:00',
            end: '17:00',
            is_day_off: i >= 5, // Sat & Sun default day off
          };
        }
      }
      setEditingHours(map);
    } catch (err: any) {
      error(err.message || 'Failed to fetch working hours');
    } finally {
      setLoadingHours(false);
    }
  };

  const fetchTimeOffs = async () => {
    if (!provider) return;
    setLoadingTimeOffs(true);
    try {
      const res = await timeOffApi.list({ provider: provider.id });
      const list = Array.isArray(res) ? res : res.results || [];
      setTimeOffs(list);
    } catch (err: any) {
      error(err.message || 'Failed to fetch time off records');
    } finally {
      setLoadingTimeOffs(false);
    }
  };

  const isOwner = provider?.user === user?.id;

  const handleSaveWorkingHours = async () => {
    if (!provider) return;
    if (!isOwner) {
      error('You can only manage working hours for your own linked provider profile.');
      return;
    }

    setSavingHours(true);
    try {
      for (let day = 0; day < 7; day++) {
        const item = editingHours[day];
        if (item) {
          if (item.id) {
            await workingHoursApi.update(item.id, {
              start_time: `${item.start}:00`,
              end_time: `${item.end}:00`,
              is_day_off: item.is_day_off,
            });
          } else {
            await workingHoursApi.create({
              provider: provider.id,
              day_of_week: day,
              start_time: `${item.start}:00`,
              end_time: `${item.end}:00`,
              is_day_off: item.is_day_off,
            });
          }
        }
      }
      success('Working schedule updated successfully!');
      fetchWorkingHours();
    } catch (err: any) {
      error(err.message || 'Failed to save working hours');
    } finally {
      setSavingHours(false);
    }
  };

  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    if (!isOwner) {
      error('You can only manage time-offs for your own linked provider profile.');
      return;
    }

    if (!newTimeOff.start_datetime || !newTimeOff.end_datetime) {
      error('Please specify both start and end dates/times.');
      return;
    }

    try {
      await timeOffApi.create({
        provider: provider.id,
        start_datetime: new Date(newTimeOff.start_datetime).toISOString(),
        end_datetime: new Date(newTimeOff.end_datetime).toISOString(),
        reason: newTimeOff.reason,
      });
      success('Time-off block created successfully!');
      setNewTimeOff({ start_datetime: '', end_datetime: '', reason: '' });
      fetchTimeOffs();
    } catch (err: any) {
      error(err.message || 'Failed to schedule time off');
    }
  };

  const handleDeleteTimeOff = async (id: number) => {
    if (!isOwner) {
      error('You can only manage time-offs for your own linked provider profile.');
      return;
    }
    try {
      await timeOffApi.delete(id);
      success('Time off removed');
      fetchTimeOffs();
    } catch (err: any) {
      error(err.message || 'Failed to delete time off');
    }
  };

  const handleBookingAction = async (id: number, action: 'confirm' | 'complete' | 'cancel') => {
    try {
      if (action === 'confirm') await bookingsApi.confirm(id);
      if (action === 'complete') await bookingsApi.complete(id);
      if (action === 'cancel') await bookingsApi.cancel(id, 'Cancelled by provider');
      success(`Booking status updated!`);
      fetchBookings();
    } catch (err: any) {
      error(err.message || `Failed to update booking.`);
    }
  };

  // Loading state
  if (loadingProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading provider portal...</p>
      </div>
    );
  }

  // Unlinked regular provider view
  if (!provider && user?.role === 'PROVIDER') {
    const matchingByEmail = allProviders.find(
      (p) => p.email && user?.email && p.email.toLowerCase() === user.email.toLowerCase()
    );

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Specialist Profile Pending Linkage
          </h2>

          <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            Your user account is registered as a <strong>Service Provider</strong>, but it is not yet linked to a specialist profile in the system. The booking backend requires you to be linked to your provider profile before you can configure working hours, schedule time-offs, or manage customer appointments.
          </p>

          <div className="mt-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Your Account Credentials:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <div><span className="text-slate-400">User ID:</span> <strong>#{user?.id}</strong></div>
              <div><span className="text-slate-400">Email:</span> <strong>{user?.email}</strong></div>
              <div><span className="text-slate-400">Name:</span> <strong>{user?.first_name || ''} {user?.last_name || ''}</strong></div>
              <div><span className="text-slate-400">Role:</span> <strong>{user?.role}</strong></div>
            </div>
          </div>

          {matchingByEmail && (
            <div className="mt-6 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Matching Specialist Profile Found:</p>
                <p className="mt-0.5">
                  We found provider <strong>{matchingByEmail.name}</strong> ({matchingByEmail.email}, ID #{matchingByEmail.id}) matching your email. Please ask your administrator to link User #{user?.id} to this profile in the Admin Console.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">How to activate your portal:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>Contact your System Administrator or manager.</li>
              <li>Provide your User ID (<strong>#{user?.id}</strong>) or registered email (<strong>{user?.email}</strong>).</li>
              <li>The administrator links your account in <strong>Admin Console → Providers</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            Provider Management
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {section === 'appointments' ? 'Appointments' : section === 'hours' ? 'Working Hours' : 'Time Off'}
            {provider ? ` — ${provider.name}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {section === 'appointments'
              ? 'Review and manage your customer appointments.'
              : section === 'hours'
                ? 'Set the working hours customers can book.'
                : 'Block time away from your schedule.'}
          </p>

          {/* Admin Provider Switcher */}
          {user?.role === 'ADMIN' && allProviders.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Switch Provider:
                </label>
                <select
                  value={provider?.id || ''}
                  onChange={(e) => {
                    const found = allProviders.find((p) => p.id === parseInt(e.target.value, 10));
                    if (found) setProvider(found);
                  }}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {allProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.user === user.id ? ' (Your Profile)' : p.user ? ` (User #${p.user})` : ' (Unlinked)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Ownership Banner if not owner */}
      {!isOwner && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-4 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">
                {provider?.user ? `Viewing profile of User #${provider.user}` : 'Viewing Unlinked Provider Profile'}
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Backend permission rules allow modifying working hours and time-offs only for the provider profile linked to your user account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Customer Bookings
            </h2>
            <button
              onClick={fetchBookings}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Refresh list
            </button>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                No bookings scheduled with this specialist yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const startTime = new Date(booking.start_time);
                const endTime = new Date(booking.end_time);

                return (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {booking.service?.name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          booking.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : booking.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : booking.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-brand-600" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {format(startTime, 'EEEE, MMMM d, yyyy')} | {format(startTime, 'hh:mm a')} - {format(endTime, 'hh:mm a')}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Customer: {booking.customer?.email} ({booking.customer?.first_name || 'Guest'})</span>
                        </p>
                        {booking.customer_notes && (
                          <p className="flex items-start gap-1.5 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-600 dark:text-slate-400 italic">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>"{booking.customer_notes}"</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {booking.status === 'CONFIRMED' && (
                        <a
                          href={getGoogleCalendarUrl(booking, 'provider')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <CalendarPlus className="w-4 h-4" />
                          Add to Calendar
                        </a>
                      )}
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'confirm')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm
                        </button>
                      )}

                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Completed
                        </button>
                      )}

                      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleBookingAction(booking.id, 'cancel')}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: WORKING HOURS */}
      {activeTab === 'hours' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Weekly Working Hours
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Define the recurring weekly availability schedule when clients can book slots.
              </p>
            </div>

            <button
              onClick={handleSaveWorkingHours}
              disabled={loadingHours || savingHours || !isOwner}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition"
            >
              {savingHours ? 'Saving Schedule...' : 'Save Schedule'}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-4">
            {DAYS_OF_WEEK.map((dayName, idx) => {
              const current = editingHours[idx] || {
                start: '09:00',
                end: '17:00',
                is_day_off: false,
              };

              return (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="w-36 font-semibold text-sm text-slate-900 dark:text-white">
                    {dayName}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        disabled={!isOwner}
                        checked={current.is_day_off}
                        onChange={(e) => {
                          setEditingHours((prev) => ({
                            ...prev,
                            [idx]: { ...current, is_day_off: e.target.checked },
                          }));
                        }}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 disabled:opacity-50"
                      />
                      <span>Day Off</span>
                    </label>

                    {!current.is_day_off && (
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="time"
                          disabled={!isOwner}
                          value={current.start}
                          onChange={(e) => {
                            setEditingHours((prev) => ({
                              ...prev,
                              [idx]: { ...current, start: e.target.value },
                            }));
                          }}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          disabled={!isOwner}
                          value={current.end}
                          onChange={(e) => {
                            setEditingHours((prev) => ({
                              ...prev,
                              [idx]: { ...current, end: e.target.value },
                            }));
                          }}
                          className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TIME OFF */}
      {activeTab === 'timeoff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Time-off Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Schedule Time Off
            </h3>
            <form onSubmit={handleCreateTimeOff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  disabled={!isOwner}
                  value={newTimeOff.start_datetime}
                  onChange={(e) => setNewTimeOff({ ...newTimeOff, start_datetime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  disabled={!isOwner}
                  value={newTimeOff.end_datetime}
                  onChange={(e) => setNewTimeOff({ ...newTimeOff, end_datetime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  disabled={!isOwner}
                  placeholder="Vacation, Conference, Medical..."
                  value={newTimeOff.reason}
                  onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!isOwner}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Time Off
              </button>
            </form>
          </div>

          {/* Time-off List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Upcoming Time Off Records
            </h3>

            {loadingTimeOffs ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : timeOffs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Palmtree className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No scheduled time-offs or vacation blocks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeOffs.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.reason || 'Time Off / Unavailable'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(item.start_datetime), 'MMM d, yyyy hh:mm a')} —{' '}
                        {format(new Date(item.end_datetime), 'MMM d, yyyy hh:mm a')}
                      </p>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleDeleteTimeOff(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="Delete time-off block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
