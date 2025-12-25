/**
 * SAP Business One Service Layer Configuration
 */

export const sapConfig = {
  // Base URL for SAP Service Layer
  baseUrl: Deno.env.get('SAP_SERVICE_LAYER_URL') || '',
  
  // Service account credentials
  companyDB: Deno.env.get('SAP_COMPANY_DB') || '',
  userName: Deno.env.get('SAP_USERNAME') || '',
  password: Deno.env.get('SAP_PASSWORD') || '',
  
  // Session management
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  
  // Request configuration
  timeout: 30000, // 30 seconds
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Validate SAP configuration
 */
export function validateSapConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!sapConfig.baseUrl) missing.push('SAP_SERVICE_LAYER_URL');
  if (!sapConfig.companyDB) missing.push('SAP_COMPANY_DB');
  if (!sapConfig.userName) missing.push('SAP_USERNAME');
  if (!sapConfig.password) missing.push('SAP_PASSWORD');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
