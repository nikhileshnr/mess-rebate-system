// api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
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
    const requestData = method.toLowerCase() === 'post' && data === null ? {} : data;
    const response = await api({ method, url, data: requestData, params, timeout: 10000 });
    
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
