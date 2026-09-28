import React, { useState, useEffect } from 'react';
import { bookingsApi } from '../api/endpoints';
import { Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  CalendarCheck,
  CalendarPlus,
  FileText,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { getGoogleCalendarUrl } from '../utils/googleCalendar';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState<Booking | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.list();
      const list = Array.isArray(res) ? res : res.results || [];
      // Sort newest start_time first
      list.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setBookings(list);
    } catch (err: any) {
      error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!showCancelModal) return;
    setCancellingId(showCancelModal.id);
    try {
      await bookingsApi.cancel(showCancelModal.id, cancelReason);
      success('Booking cancelled successfully.');
      setShowCancelModal(null);
      setCancelReason('');
      fetchBookings();
    } catch (err: any) {
      error(err.message || 'Failed to cancel appointment. Note: cancellation policy requires at least 2 hours notice.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Confirmation
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View your upcoming sessions, past history, and manage cancellations.
          </p>
        </div>

        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <CalendarCheck className="w-4 h-4" />
          Book New Session
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No appointments booked yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Explore our professional services and schedule your first appointment in seconds.
          </p>
          <Link
            to="/book"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancelable = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
            const startTime = new Date(booking.start_time);
            const endTime = new Date(booking.end_time);

            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {booking.service?.name || 'Appointment'}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-600" />
                        <span>{format(startTime, 'EEEE, MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-brand-600" />
                        <span>
                          {format(startTime, 'hh:mm a')} - {format(endTime, 'hh:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-brand-600" />
                        <span>Specialist: {booking.provider?.name || 'Staff'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span>Price: ${parseFloat(booking.total_price || '0').toFixed(2)}</span>
                      </div>
                    </div>

                    {booking.customer_notes && (
                      <p className="text-xs text-slate-500 italic mt-2">
                        Notes: "{booking.customer_notes}"
                      </p>
                    )}

                    {booking.cancellation_reason && (
                      <p className="text-xs text-rose-500 font-medium mt-1">
                        Cancellation Reason: "{booking.cancellation_reason}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {booking.status === 'CONFIRMED' && (
                      <a
                        href={getGoogleCalendarUrl(booking, 'customer')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-950/80 dark:text-brand-300 rounded-xl transition flex items-center gap-1.5"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        Add to Calendar
                      </a>
                    )}
                    {isCancelable && (
                      <button
                        onClick={() => setShowCancelModal(booking)}
                        className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Cancel Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to cancel your appointment for{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {showCancelModal.service?.name}
              </span>{' '}
              on{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {format(new Date(showCancelModal.start_time), 'MMM d, yyyy at hh:mm a')}
              </span>
              ?
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please state why you need to cancel..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingId !== null}
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                {cancellingId !== null ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
