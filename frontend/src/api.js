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
      type: "UNKNOWN_ERROR",
    };
    return Promise.reject(errorResponse);
  }
);

// Generic request handler to reduce code duplication
const apiRequest = async (method, url, data = null, params = null) => {
  try {
    return await api({ method, url, data, params });
  } catch (error) {
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
  
  return apiRequest('get', `/api/statistics`, null, params);
};

// Price Settings APIs
export const fetchPriceSettings = () => apiRequest('get', "/api/price-settings/current");
export const updatePriceSettings = (prices) => apiRequest('put', "/api/price-settings/update", prices);
