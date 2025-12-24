import axios, { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// API Configuration
// Use the machine's IP address instead of localhost for physical devices
// For WSL, this will be the WSL IP that can be accessed from your phone
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Get the Expo server IP (same network as your phone)
    const expoUrl = Constants.expoConfig?.hostUri;
    if (expoUrl) {
      const ip = expoUrl.split(':')[0];
      return `http://${ip}:3000/api`;
    }
    // Fallback to localhost (for emulators)
    return 'http://localhost:3000/api';
  }
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure retry logic for network errors
axiosRetry(apiClient, {
  retries: 3, // Number of retry attempts
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    // Don't retry on 4xx client errors (bad request, unauthorized, etc.)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status ? error.response.status >= 500 : false);
  },
  onRetry: (retryCount, error, requestConfig) => {
    if (__DEV__) {
      console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);
    }
  },
});

// Token management functions
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is not 401 or request already retried, reject
    // Suppress console warnings for expected client errors (4xx)
    if (error.response?.status !== 401 || originalRequest._retry) {
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        // Client errors (400-499) - these are expected, don't log full stack
        if (__DEV__ && error.response.status !== 429) {
          console.warn(`API Error ${error.response.status}:`, error.response.data);
        }
      }
      return Promise.reject(error);
    }

    // Check if error is due to token being revoked (logout)
    if (error.response?.data && 
        typeof error.response.data === 'object' && 
        'message' in error.response.data &&
        (error.response.data as any).message?.includes('revoked')) {
      // Token was revoked, clear tokens and reject
      await tokenStorage.clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Save new tokens
      await tokenStorage.setTokens(accessToken, newRefreshToken);

      // Update the failed request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, clear tokens
      processQueue(refreshError as Error, null);
      await tokenStorage.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
