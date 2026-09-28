const API_BASE_URL = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

class ApiClient {
  private inFlightGetRequests = new Map<string, Promise<unknown>>();

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  public setTokens(access: string, refresh?: string) {
    localStorage.setItem('access_token', access);
    if (refresh) {
      localStorage.setItem('refresh_token', refresh);
    }
  }

  public clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      if (data.access) {
        this.setTokens(data.access, data.refresh);
        return data.access;
      }
      return null;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  public request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET') {
      return this.sendRequest<T>(endpoint, options);
    }

    const requestKey = this.getGetRequestKey(endpoint, options.params);
    const inFlightRequest = this.inFlightGetRequests.get(requestKey);
    if (inFlightRequest) {
      return inFlightRequest as Promise<T>;
    }

    const request = this.sendRequest<T>(endpoint, options);
    this.inFlightGetRequests.set(requestKey, request);
    request.then(
      () => this.inFlightGetRequests.delete(requestKey),
      () => this.inFlightGetRequests.delete(requestKey)
    );
    return request;
  }

  private getGetRequestKey(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): string {
    const normalizedParams = Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey));

    return `${endpoint}?${JSON.stringify(normalizedParams)}`;
  }

  private async sendRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          queryParams.append(key, String(val));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    let token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 Unauthorized, attempt refresh
    if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/token/refresh/')) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(', ') : data.non_field_errors;
        } else {
          // Format validation errors
          const errorList = Object.entries(data)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
          if (errorList) errorMessage = errorList;
        }
      }
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data as T;
  }

  // Convenience methods
  get<T = any>(endpoint: string, params?: Record<string, any>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
