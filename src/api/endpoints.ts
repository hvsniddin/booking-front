import { api } from './client';
import {
  User,
  Service,
  Provider,
  WorkingHour,
  TimeOff,
  Booking,
  AvailableSlot,
  PaginatedResponse,
} from '../types';

export const authApi = {
  login: (data: { email?: string; password?: string }) =>
    api.post<{ access: string; refresh: string; user?: User }>('/api/auth/login/', data),
  
  register: (data: {
    email: string;
    password?: string;
    password_confirm?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    phone_number?: string;
    timezone?: string;
  }) => api.post<User>('/api/auth/register/', data),
  
  getProfile: () => api.get<User>('/api/auth/profile/'),
  
  updateProfile: (data: Partial<User>) => api.patch<User>('/api/auth/profile/', data),
};

export const servicesApi = {
  list: (params?: { is_active?: boolean; search?: string }) =>
    api.get<PaginatedResponse<Service> | Service[]>('/api/services/', params),
  
  get: (id: number) => api.get<Service>(`/api/services/${id}/`),
  
  create: (data: Partial<Service>) => api.post<Service>('/api/services/', data),
  
  update: (id: number, data: Partial<Service>) => api.patch<Service>(`/api/services/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/services/${id}/`),
};

export const providersApi = {
  list: (params?: { is_active?: boolean; service?: number; search?: string }) =>
    api.get<PaginatedResponse<Provider> | Provider[]>('/api/providers/', params),
  
  get: (id: number) => api.get<Provider>(`/api/providers/${id}/`),
  
  create: (data: Partial<Provider> & { service_ids?: number[] }) => {
    const payload: any = { ...data };
    if (payload.services && !payload.service_ids) {
      payload.service_ids = Array.isArray(payload.services)
        ? payload.services.map((s: any) => (typeof s === 'object' ? s.id : s))
        : [];
      delete payload.services;
    }
    return api.post<Provider>('/api/providers/', payload);
  },
  
  update: (id: number, data: Partial<Provider> & { service_ids?: number[] }) => {
    const payload: any = { ...data };
    if (payload.services && !payload.service_ids) {
      payload.service_ids = Array.isArray(payload.services)
        ? payload.services.map((s: any) => (typeof s === 'object' ? s.id : s))
        : [];
      delete payload.services;
    }
    return api.patch<Provider>(`/api/providers/${id}/`, payload);
  },
  
  delete: (id: number) => api.delete(`/api/providers/${id}/`),
};

export const availabilityApi = {
  getSlots: (params: { service_id: number; date: string; provider_id?: number }) =>
    api.get<AvailableSlot[]>('/api/availability/', params),
};

export const bookingsApi = {
  list: (params?: {
    status?: string;
    provider?: number;
    provider_id?: number;
    customer?: number;
    service?: number;
    date?: string;
    page?: number;
  }) => api.get<PaginatedResponse<Booking> | Booking[]>('/api/bookings/', params),
  
  get: (id: number) => api.get<Booking>(`/api/bookings/${id}/`),
  
  create: (data: {
    service_id: number;
    provider_id: number;
    start_time: string; // ISO string
    customer_notes?: string;
  }) => api.post<Booking>('/api/bookings/', data),
  
  cancel: (id: number, reason?: string) =>
    api.post<Booking>(`/api/bookings/${id}/cancel/`, { reason }),
  
  confirm: (id: number) => api.post<Booking>(`/api/bookings/${id}/confirm/`),
  
  complete: (id: number) => api.post<Booking>(`/api/bookings/${id}/complete/`),
};

export const workingHoursApi = {
  list: (params?: { provider?: number }) =>
    api.get<PaginatedResponse<WorkingHour> | WorkingHour[]>('/api/working-hours/', params),
  
  get: (id: number) => api.get<WorkingHour>(`/api/working-hours/${id}/`),
  
  create: (data: {
    provider: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_day_off?: boolean;
  }) => api.post<WorkingHour>('/api/working-hours/', data),
  
  update: (id: number, data: Partial<WorkingHour>) =>
    api.patch<WorkingHour>(`/api/working-hours/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/working-hours/${id}/`),
};

export const timeOffApi = {
  list: (params?: { provider?: number }) =>
    api.get<PaginatedResponse<TimeOff> | TimeOff[]>('/api/time-offs/', params),
  
  get: (id: number) => api.get<TimeOff>(`/api/time-offs/${id}/`),
  
  create: (data: {
    provider: number;
    start_datetime: string;
    end_datetime: string;
    reason: string;
  }) => api.post<TimeOff>('/api/time-offs/', data),
  
  update: (id: number, data: Partial<TimeOff>) =>
    api.patch<TimeOff>(`/api/time-offs/${id}/`, data),
  
  delete: (id: number) => api.delete(`/api/time-offs/${id}/`),
};
