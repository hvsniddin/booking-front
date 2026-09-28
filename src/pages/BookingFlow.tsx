import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { servicesApi, providersApi, availabilityApi, bookingsApi } from '../api/endpoints';
import { Service, Provider, AvailableSlot } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  User, 
  Check, 
  ChevronRight, 
  Info, 
  CalendarCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export const BookingFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  // State
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingServices(true);
      const [servRes, provRes] = await Promise.all([
        servicesApi.list({ is_active: true }),
        providersApi.list({ is_active: true }),
      ]);

      const servList = Array.isArray(servRes) ? servRes : servRes.results || [];
      const provList = Array.isArray(provRes) ? provRes : provRes.results || [];

      setServices(servList);
      setProviders(provList);

      // Pre-select if from query param
      const paramServiceId = searchParams.get('service_id');
      const paramProviderId = searchParams.get('provider_id');

      if (paramServiceId) {
        const found = servList.find((s) => s.id === parseInt(paramServiceId, 10));
        if (found) setSelectedService(found);
      }

      if (paramProviderId) {
        const found = provList.find((p) => p.id === parseInt(paramProviderId, 10));
        if (found) setSelectedProvider(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  // Filter providers that offer selected service
  const availableProvidersForService = selectedService
    ? providers.filter((p) => {
        if (!p.services || p.services.length === 0) return true;
        return p.services.some((s: any) =>
          typeof s === 'object' ? s.id === selectedService.id : s === selectedService.id
        );
      })
    : providers;

  // Fetch slots whenever service, provider, or date changes
  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchSlots();
    }
  }, [selectedService, selectedProvider, selectedDate]);

  const fetchSlots = async () => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const result = await availabilityApi.getSlots({
        service_id: selectedService.id,
        date: selectedDate,
        provider_id: selectedProvider ? selectedProvider.id : undefined,
      });
      setSlots(result || []);
    } catch (err: any) {
      console.error('Failed to load slots', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      error('Please sign in or create an account to complete your booking.');
      navigate('/login');
      return;
    }

    if (!selectedService || !selectedSlot) {
      error('Please select a service and slot first.');
      return;
    }

    setSubmitting(true);
    try {
      await bookingsApi.create({
        service_id: selectedService.id,
        provider_id: selectedSlot.provider_id,
        start_time: selectedSlot.start_time_utc || selectedSlot.start_time,
        customer_notes: customerNotes,
      });
      success('Booking requested successfully! You can track it in My Bookings.');
      navigate('/my-bookings');
    } catch (err: any) {
      error(err.message || 'Could not complete booking. Please try another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Date buttons (next 7 days)
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
          Instant Reservation
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
          Book an Appointment
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Pick your service, specialist, and preferred time with live availability and concurrency protection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Step selection */}
        <div className="lg:col-span-2 space-y-8">
          {/* STEP 1: Select Service */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                1
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Choose a Service
              </h2>
            </div>

            {loadingServices ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        // Reset provider if not offering this service
                        if (
                          selectedProvider &&
                          selectedProvider.services &&
                          selectedProvider.services.length > 0 &&
                          !selectedProvider.services.some((s: any) =>
                            typeof s === 'object' ? s.id === service.id : s === service.id
                          )
                        ) {
                          setSelectedProvider(null);
                        }
                      }}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {service.name}
                        </span>
                        <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                          ${parseFloat(service.price).toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {service.duration_minutes} mins
                        </span>
                        {service.buffer_time_minutes > 0 && (
                          <span>+{service.buffer_time_minutes}m buffer</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* STEP 2: Select Provider (Optional / Any) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Select Specialist
                </h2>
                <p className="text-xs text-slate-500">Pick any available specialist or a specific one</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setSelectedProvider(null)}
                className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${
                  selectedProvider === null
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2 text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">Any Specialist</p>
                <p className="text-xs text-slate-500">Maximum slot availability</p>
              </div>

              {availableProvidersForService.map((provider) => {
                const isSelected = selectedProvider?.id === provider.id;
                return (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mx-auto mb-2 text-brand-700 dark:text-brand-300 font-bold text-sm">
                      {provider.name[0]}
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {provider.name}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-1">{provider.timezone}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* STEP 3: Date & Slots */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                3
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pick Date & Time Slot
              </h2>
            </div>

            {/* Quick date selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Select Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {quickDates.map((dateObj) => {
                  const dateStr = format(dateObj, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-center transition ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-medium uppercase opacity-80">
                        {format(dateObj, 'EEE')}
                      </p>
                      <p className="text-sm font-bold">{format(dateObj, 'MMM d')}</p>
                    </button>
                  );
                })}
              </div>

              {/* Or manual date picker */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Slot grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Available Time Slots
              </label>

              {!selectedService ? (
                <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
                  <Info className="w-5 h-5 shrink-0" />
                  Please select a service above first to generate real-time slots.
                </div>
              ) : loadingSlots ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
                    No available slots on this date
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please try another date or switch specialists.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                  {slots.map((slot, index) => {
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time &&
                      selectedSlot?.provider_id === slot.provider_id;
                    const startTimeFormatted = format(new Date(slot.start_time), 'hh:mm a');
                    const endTimeFormatted = format(new Date(slot.end_time), 'hh:mm a');

                    return (
                      <button
                        key={`${slot.provider_id}-${slot.start_time}-${index}`}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-brand-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                          <Clock className="w-3.5 h-3.5 text-brand-600" />
                          <span>{startTimeFormatted}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          with {slot.provider_name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Customer Notes / Special Requests (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Mention any preferences, special conditions, or instructions..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </section>
        </div>

        {/* Right Col: Booking Summary & Action */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Booking Summary
            </h3>

            <div className="py-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Service</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedService ? selectedService.name : 'Not selected yet'}
                </p>
                {selectedService && (
                  <p className="text-xs text-slate-500">
                    {selectedService.duration_minutes} minutes
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Specialist</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedSlot
                    ? selectedSlot.provider_name
                    : selectedProvider
                    ? selectedProvider.name
                    : 'Any Available Specialist'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Date & Time</p>
                {selectedSlot ? (
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {format(new Date(selectedSlot.start_time), 'EEEE, MMMM d, yyyy')} at{' '}
                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                      {format(new Date(selectedSlot.start_time), 'hh:mm a')}
                    </span>
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No slot selected</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Total Amount</span>
                <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                  {selectedService ? `$${parseFloat(selectedService.price).toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>

            {/* Submit / Auth prompt */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {!isAuthenticated ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                  >
                    Sign in to Complete Booking
                  </button>
                  <p className="text-xs text-center text-slate-500">
                    Or{' '}
                    <Link to="/register" className="text-brand-600 font-semibold underline">
                      create an account
                    </Link>{' '}
                    in 1 minute
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!selectedService || !selectedSlot || submitting}
                  onClick={handleConfirmBooking}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CalendarCheck className="w-5 h-5" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
