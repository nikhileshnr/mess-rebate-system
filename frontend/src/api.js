// api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  withCredentials: true,
});

// Explicitly set headers for each request type
api.interceptors.request.use(config => {
  // Ensure content type is set properly for PUT and POST requests
  if (['post', 'put'].includes(config.method?.toLowerCase())) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json'
    };
  }
  return config;
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error || {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    };
    
    // Extract all properties from the error response
    const enhancedError = {
      message: errorResponse.message || "An unexpected error occurred",
      code: errorResponse.errorCode || errorResponse.code || "UNKNOWN_ERROR",
      field: errorResponse.field || null,
      rule: errorResponse.rule || null,
      resource: errorResponse.resource || null,
      // Include original status code
      status: error.response?.status || 500
    };
    
    console.error("API Error Response:", enhancedError);
    return Promise.reject(enhancedError);
  }
);

// Generic request handler to reduce code duplication
const apiRequest = async (method, url, data = null, params = null) => {
  try {
    // Add a timeout to prevent hanging requests
    let requestData = method.toLowerCase() === 'post' && data === null ? {} : data;
    
    // Enhanced debug logging for PUT and POST requests
    if ((method.toLowerCase() === 'put' || method.toLowerCase() === 'post') && requestData) {
      console.log(`DEBUG - ${method.toUpperCase()} Request to ${url}:`, JSON.stringify(requestData, null, 2));
      
      // Verify data structure is as expected
      if (url === "/api/rebate/update" && requestData.rebates) {
        console.log('DEBUG - Rebates payload validation:', {
          isArray: Array.isArray(requestData.rebates),
          length: requestData.rebates.length,
          firstItem: requestData.rebates[0],
          // Show the exact raw JSON to diagnose any serialization issues
          rawJSON: JSON.stringify(requestData),
          typeofRebates: typeof requestData.rebates
        });
      }
    }
    
    // For rebate updates only - try to work around serialization issues
    if (url === "/api/rebate/update") {
      // Create a fresh object with explicit array creation to avoid any reference/serialization issues
      requestData = {
        rebates: Array.isArray(requestData?.rebates) 
          ? [...requestData.rebates] 
          : [requestData.rebates]
      };
      
      console.log('DEBUG - Using cleaned request data:', JSON.stringify(requestData, null, 2));
    }
    
    const response = await api({ 
      method, 
      url, 
      data: requestData, 
      params, 
      timeout: 10000
    });
    
    // Handle the case where response might be null
    return response === null ? { success: true } : response;
  } catch (error) {
    // Check if error is a SyntaxError (likely from JSON parse failure)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.error("API JSON Parse Error:", error);
      throw {
        code: 'PARSE_ERROR',
        message: 'Failed to parse server response',
        originalError: error.message
      };
    }
    
    console.error("API Request Error:", error);
    throw error;
  }
};

// Auth APIs
export const login = (credentials) => apiRequest('post', "/api/login", credentials);
export const checkLoginStatus = () => apiRequest('get', "/api/checkLoginStatus");
export const logout = () => apiRequest('post', "/api/logout", {});

// Rebate APIs
export const applyRebate = (rebateData) => apiRequest('post', "/api/rebate/create", rebateData);
export const fetchAllRebates = () => apiRequest('get', '/api/rebate/rebates');
export const fetchStudentRebates = (rollNo) => apiRequest('get', `/api/rebate/rebates/${rollNo}`);
export const checkOverlappingRebates = (rollNo, startDate, endDate) => 
  apiRequest('get', `/api/rebate/check-overlap?roll_no=${rollNo}&start_date=${startDate}&end_date=${endDate}`);
export const fetchRebatesByMonth = (year, month) => 
  apiRequest('get', `/api/rebate/rebates?year=${year}&month=${month}`);
export const updateRebates = (rebates) => {
  if (!rebates || (Array.isArray(rebates) && rebates.length === 0)) {
    return Promise.resolve({ success: true, message: 'No rebates to update', updatedCount: 0 });
  }
  
  // Create a fresh array to avoid any reference issues
  const rebatesArray = [];
  
  // Add each rebate to the array individually
  if (Array.isArray(rebates)) {
    rebates.forEach(rebate => {
      if (rebate && typeof rebate === 'object') {
        rebatesArray.push({ ...rebate }); // Create a fresh copy of each object
      }
    });
  } else if (rebates && typeof rebates === 'object') {
    rebatesArray.push({ ...rebates }); // Single rebate case
  }
  
  // Additional safety check
  if (rebatesArray.length === 0) {
    return Promise.resolve({ success: true, message: 'No valid rebates to update', updatedCount: 0 });
  }
  
  // Create the request body with a fresh object
  const requestBody = { 
    rebates: rebatesArray 
  };
  
  // Debug - log the full request payload
  console.log('DEBUG - API updateRebates payload:', JSON.stringify(requestBody, null, 2));
  console.log('DEBUG - Rebates is array?', Array.isArray(requestBody.rebates));
  
  // Direct API call with rebuilt request body
  return apiRequest('put', "/api/rebate/update", requestBody);
};

// Student APIs
export const fetchStudentDetails = (rollNo) => apiRequest('get', `/api/students/${rollNo}`);
export const fetchAllStudents = () => apiRequest('get', "/api/students");

// Statistics APIs
export const fetchStatistics = (filters) => {
  const params = new URLSearchParams();
  if (filters.year) params.append('year', filters.year);
  if (filters.month) params.append('month', filters.month);
  if (filters.branch) params.append('branch', filters.branch);
  if (filters.batch) params.append('batch', filters.batch);
  if (filters.viewType) params.append('viewType', filters.viewType);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters._t) params.append('_t', filters._t); // Cache busting parameter
  
  return apiRequest('get', `/api/statistics`, null, params);
};

// Clear statistics cache
export const clearStatisticsCache = () => {
  try {
    return apiRequest('post', `/api/statistics/clear-cache`, {});
  } catch (error) {
    console.error('Failed to clear statistics cache:', error);
    throw error;
  }
};

// Combined operation to refresh statistics 
// This fetches fresh data even if clearing cache fails
export const refreshStatistics = async (filters) => {
  let cacheCleared = false;
  
  try {
    // First try to clear the cache
    const cacheResult = await clearStatisticsCache();
    console.log('Cache cleared successfully:', cacheResult);
    cacheCleared = true;
  } catch (error) {
    console.warn('Cache clear failed, continuing with data refresh:', error);
    // Continue even if cache clear fails
    cacheCleared = false;
  }
  
  try {
    // Add cache busting timestamp
    const refreshFilters = {
      ...filters,
      _t: new Date().getTime()
    };
    
    // Always fetch fresh data
    const result = await fetchStatistics(refreshFilters);
    
    // Return both the result and cache status
    return {
      ...result,
      _meta: {
        cacheCleared,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching statistics data:', error);
    throw error;
  }
};

// Price Settings APIs
export const fetchPriceSettings = () => apiRequest('get', "/api/price-settings/current");
export const updatePriceSettings = (prices) => apiRequest('put', "/api/price-settings/update", prices);
