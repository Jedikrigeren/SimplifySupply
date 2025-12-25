import axios, { AxiosError, AxiosInstance } from 'npm:axios@^1.6.0';
import { sapConfig } from './config.ts';
import type { SAPErrorResponse, SAPLoginRequest, SAPLoginResponse } from './types.ts';

/**
 * SAP Service Layer Client
 * Handles authentication, session management, and HTTP requests to SAP
 */
export class SAPClient {
  private axiosInstance: AxiosInstance;
  private sessionId: string | null = null;
  private sessionExpiry: number | null = null;
  private sessionCookie: string | null = null; // Store the B1SESSION cookie
  private loginPromise: Promise<void> | null = null; // Prevent concurrent logins

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: sapConfig.baseUrl,
      timeout: sapConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add session cookie
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.sessionCookie) {
          config.headers.Cookie = this.sessionCookie;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Session expired, clear session
          this.clearSession();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Login to SAP Service Layer
   */
  async login(): Promise<void> {
    // If already logging in, wait for that login to complete
    if (this.loginPromise) {
      return this.loginPromise;
    }

    // Start login process
    this.loginPromise = (async () => {
      try {
        const loginData: SAPLoginRequest = {
          CompanyDB: sapConfig.companyDB,
          UserName: sapConfig.userName,
          Password: sapConfig.password,
        };

      const response = await this.axiosInstance.post<SAPLoginResponse>(
        '/Login',
        loginData
      );

      this.sessionId = response.data.SessionId;
      this.sessionExpiry = Date.now() + sapConfig.sessionTimeout;

      // Extract session cookie from response headers
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        // Extract B1SESSION cookie
        const cookieString = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
        const b1SessionMatch = cookieString.match(/B1SESSION=([^;]+)/);
        if (b1SessionMatch) {
          this.sessionCookie = `B1SESSION=${b1SessionMatch[1]}`;
        }
      }
      } catch (error) {
        console.error('SAP login failed:', error);
        throw this.handleError(error as AxiosError);
      } finally {
        this.loginPromise = null;
      }
    })();

    return this.loginPromise;
  }

  /**
   * Logout from SAP Service Layer
   */
  async logout(): Promise<void> {
    try {
      if (this.sessionId) {
        await this.axiosInstance.post('/Logout');
        this.clearSession();
      }
    } catch {
      this.clearSession();
    }
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    if (!this.sessionId || !this.sessionExpiry || !this.sessionCookie) {
      return false;
    }
    return Date.now() < this.sessionExpiry;
  }

  /**
   * Ensure valid session (login if needed)
   */
  async ensureSession(): Promise<void> {
    if (!this.isSessionValid()) {
      await this.login();
    }
  }

  /**
   * Clear session data
   */
  private clearSession(): void {
    this.sessionId = null;
    this.sessionExpiry = null;
    this.sessionCookie = null;
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    await this.ensureSession();
    
    try {
      const response = await this.axiosInstance.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    await this.ensureSession();
    
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Make authenticated PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    await this.ensureSession();
    
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    await this.ensureSession();
    
    try {
      const response = await this.axiosInstance.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generic: Fetch collection of entities (e.g., /Items, /Warehouses)
   * Returns array of entities with support for pagination
   */
  async fetchSAPData<T>(
    endpoint: string,
    params?: Record<string, any>,
    pageSize?: number
  ): Promise<{ value: T[]; nextLink?: string }> {
    await this.ensureSession();
    
    try {
      const headers: Record<string, string> = {};
      if (pageSize) {
        headers['Prefer'] = `odata.maxpagesize=${pageSize}`;
      }
      
      const response = await this.axiosInstance.get<{ value: T[]; 'odata.nextLink'?: string }>(
        endpoint,
        { params, headers }
      );
      
      return {
        value: response.data.value || [],
        nextLink: response.data['odata.nextLink'],
      };
    } catch (error) {
      // Handle rate limiting with retry
      if ((error as AxiosError).response?.status === 429) {
        console.warn('SAP rate limit hit. Retrying in 30 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 30000));
        return this.fetchSAPData<T>(endpoint, params, pageSize);
      }
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generic: Fetch ALL entities with automatic pagination
   * Handles $skip pagination to retrieve complete dataset
   * Use this when you want to cache all data on backend
   */
  async fetchAllSAPData<T>({
    endpoint,
    selectFields,
    filters,
    pageSize = 100,
  }: {
    endpoint: string;
    selectFields?: string[];
    filters?: string | string[];
    pageSize?: number;
  }): Promise<T[]> {
    const allResults: T[] = [];
    let skip = 0;

    try {
      while (true) {
        const filterString = Array.isArray(filters) ? filters.join(' and ') : filters || '';
        
        const params: Record<string, any> = {
          $skip: skip,
        };
        
        if (selectFields && selectFields.length > 0) {
          params.$select = selectFields.join(',');
        }
        
        if (filterString) {
          params.$filter = filterString;
        }

        const response = await this.fetchSAPData<T>(endpoint, params, pageSize);
        
        if (response.value.length > 0) {
          allResults.push(...response.value);
        }

        // If returned less than pageSize, it's the last page
        if (response.value.length < pageSize) {
          break;
        }

        // Move to next page
        skip += pageSize;
      }

      return allResults;
    } catch (error) {
      console.error(`Error fetching all data from ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic: Fetch single entity by primary key (e.g., /Items('ITEM001'))
   */
  async fetchSAPEntity<T>(endpoint: string, key: string | number): Promise<T> {
    await this.ensureSession();
    
    const url = typeof key === 'string' ? `${endpoint}('${key}')` : `${endpoint}(${key})`;
    
    try {
      const response = await this.axiosInstance.get<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generic: Create new entity (POST)
   */
  async createSAPEntity<T>(endpoint: string, data: any): Promise<T> {
    await this.ensureSession();
    
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generic: Update entity (PATCH)
   */
  async updateSAPEntity<T>(
    endpoint: string,
    key: string | number,
    data: any
  ): Promise<T> {
    await this.ensureSession();
    
    const url = typeof key === 'string' ? `${endpoint}('${key}')` : `${endpoint}(${key})`;
    
    try {
      const response = await this.axiosInstance.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Generic: Delete entity (DELETE)
   */
  async deleteSAPEntity(endpoint: string, key: string | number): Promise<void> {
    await this.ensureSession();
    
    const url = typeof key === 'string' ? `${endpoint}('${key}')` : `${endpoint}(${key})`;
    
    try {
      await this.axiosInstance.delete(url);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Fetch data from a custom SAP SQL query with automatic pagination
   * Custom queries use SQLQueries endpoint
   * 
   * @param queryId - The custom query ID (e.g., 'CQ10004')
   * @param queryParams - Query parameters (e.g., wareHouseCode: "'01'")
   * @param pageSize - Number of results per page
   * @returns Array of all results
   */
  async fetchCustomQuery<T>(
    queryId: string,
    queryParams: Record<string, string | number> = {},
    pageSize: number = 100
  ): Promise<T[]> {
    await this.ensureSession();

    const endpoint = `/SQLQueries('${queryId}')/List`;
    const allResults: T[] = [];
    let skip = 0;

    while (true) {
      try {
        const params = {
          ...queryParams,
          $skip: skip,
        };

        const response = await this.axiosInstance.get<{ value: T[] }>(endpoint, {
          params,
          headers: {
            Prefer: `odata.maxpagesize=${pageSize}`,
          },
        });

        if (response.data.value && response.data.value.length > 0) {
          allResults.push(...response.data.value);
        }

        // Check if we've reached the last page
        if (!response.data.value || response.data.value.length < pageSize) {
          break;
        }

        skip += pageSize;
      } catch (error) {
        throw this.handleError(error as AxiosError);
      }
    }

    return allResults;
  }

  /**
   * Handle axios errors and extract SAP error messages
   */
  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const sapError = error.response.data as SAPErrorResponse;
      if (sapError.error?.message?.value) {
        return new Error(`SAP Error: ${sapError.error.message.value}`);
      }
    }
    
    if (error.message) {
      return new Error(`SAP Request Failed: ${error.message}`);
    }
    
    return new Error('Unknown SAP error occurred');
  }
}

// Singleton instance
let sapClientInstance: SAPClient | null = null;

/**
 * Get SAP client singleton instance
 */
export function getSAPClient(): SAPClient {
  if (!sapClientInstance) {
    sapClientInstance = new SAPClient();
  }
  return sapClientInstance;
}
