export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  timezone?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  buffer_time_minutes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Provider {
  id: number;
  user?: number | null;
  user_detail?: User | null;
  name: string;
  email: string;
  phone_number?: string;
  bio?: string;
  services: number[] | Service[];
  services_detail?: Service[];
  working_hours?: WorkingHour[];
  timezone: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WorkingHour {
  id: number;
  provider: number;
  provider_name?: string;
  day_of_week: number; // 0=Mon, 1=Tue, ..., 6=Sun
  day_of_week_display?: string;
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
  is_day_off: boolean;
}

export interface TimeOff {
  id: number;
  provider: number;
  provider_name?: string;
  start_datetime: string; // ISO datetime
  end_datetime: string;   // ISO datetime
  reason: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: number;
  customer: User;
  provider: Provider;
  service: Service;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  status_display: string;
  total_price: string;
  customer_notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableSlot {
  provider_id: number;
  provider_name: string;
  service_id: number;
  service_name: string;
  start_time: string; // in provider timezone
  end_time: string;
  start_time_utc: string;
  end_time_utc: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
