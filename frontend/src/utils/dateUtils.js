// Caching object for formatted dates to avoid repeated formatting
const dateFormatCache = new Map();

// Format date from ISO to dd-mm-yyyy with caching
export const formatDate = (dateString) => {
  if (!dateString) return "";
  
  // Return from cache if available
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString);
  }
  
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Store in cache
  dateFormatCache.set(dateString, formatted);
  return formatted;
};

// Calculate rebate days between two dates
export const calculateRebateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  // Ensure we're working with Date objects
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // Use time difference for calculation to improve performance
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Add 1 to include both start and end dates
  return daysDiff + 1;
};
  