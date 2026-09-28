import { Booking } from '../types';

const formatGoogleCalendarDate = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

export const getGoogleCalendarUrl = (booking: Booking, viewer: 'customer' | 'provider') => {
  const customerName = [booking.customer?.first_name, booking.customer?.last_name]
    .filter(Boolean)
    .join(' ');
  const contactDetails = viewer === 'customer'
    ? [
        `Provider: ${booking.provider?.name || 'Staff'}`,
        booking.provider?.email ? `Email: ${booking.provider.email}` : '',
        booking.provider?.phone_number ? `Phone: ${booking.provider.phone_number}` : '',
      ]
    : [
        `Customer: ${customerName || booking.customer?.email || 'Guest'}`,
        booking.customer?.email ? `Email: ${booking.customer.email}` : '',
        booking.customer?.phone_number ? `Phone: ${booking.customer.phone_number}` : '',
      ];
  const details = [
    ...contactDetails,
    booking.customer_notes ? `Notes: ${booking.customer_notes}` : '',
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: booking.service?.name || 'Appointment',
    dates: `${formatGoogleCalendarDate(booking.start_time)}/${formatGoogleCalendarDate(booking.end_time)}`,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
