import { pool, executeQuery } from "../config/db.js";

/**
 * Check for overlapping rebates for a student
 */
const checkOverlappingRebates = async (roll_no, start_date, end_date) => {
  const query = `
    SELECT COUNT(*) as count
    FROM rebates
    WHERE roll_no = ?
    AND (
      (start_date <= ? AND end_date >= ?) OR
      (start_date <= ? AND end_date >= ?) OR
      (start_date >= ? AND end_date <= ?)
    )
  `;
  const result = await executeQuery(query, [
    roll_no, end_date, start_date,
    end_date, start_date,
    start_date, end_date
  ]);
  return result[0].count > 0;
};

/**
 * Create a new rebate entry
 */
const createRebate = async (roll_no, start_date, end_date, rebate_days, gate_pass_no) => {
  let formattedStartDate;
  let formattedEndDate;
  
  // Handle start_date
  if (typeof start_date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      // Already in YYYY-MM-DD format, use it directly
      formattedStartDate = start_date;
    } else {
      // Convert from other string format to YYYY-MM-DD
      const startDateObj = new Date(start_date);
      formattedStartDate = startDateObj.toISOString().split('T')[0];
    }
  } else if (start_date instanceof Date) {
    formattedStartDate = start_date.toISOString().split('T')[0];
  } else {
    throw new Error('INVALID_START_DATE_FORMAT');
  }
  
  // Handle end_date
  if (typeof end_date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      // Already in YYYY-MM-DD format, use it directly
      formattedEndDate = end_date;
    } else {
      // Convert from other string format to YYYY-MM-DD
      const endDateObj = new Date(end_date);
      formattedEndDate = endDateObj.toISOString().split('T')[0];
    }
  } else if (end_date instanceof Date) {
    formattedEndDate = end_date.toISOString().split('T')[0];
  } else {
    throw new Error('INVALID_END_DATE_FORMAT');
  }
  
  // Calculate rebate_days if not provided or zero
  let calculatedRebateDays = rebate_days;
  if (!calculatedRebateDays || calculatedRebateDays <= 0) {
    try {
      // Parse dates directly for correct calculation
      const startParts = formattedStartDate.split('-').map(Number);
      const endParts = formattedEndDate.split('-').map(Number);
      
      // Simple direct calculation for same month
      if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
        // Same year, same month: just compute day difference
        calculatedRebateDays = endParts[2] - startParts[2];
      } else {
        // Different month: Use date objects but force integer math
        const startDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
        const endDate = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
        
        // Calculate days manually - NO +1
        const diffTimeMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTimeMs / (1000 * 60 * 60 * 24));
        calculatedRebateDays = diffDays; // Removed +1
      }
    } catch (error) {
      console.error('Error calculating rebate days:', error);
      calculatedRebateDays = 1; // Default to 1 day if calculation fails
    }
  }
  
  const query = "INSERT INTO rebates (roll_no, start_date, end_date, rebate_days, gate_pass_no) VALUES (?, ?, ?, ?, ?)";
  const result = await executeQuery(query, [roll_no, formattedStartDate, formattedEndDate, calculatedRebateDays, gate_pass_no]);
  return result;
};

/**
 * Fetch all rebate entries with student info
 */
const fetchAllRebates = async () => {
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    ORDER BY r.start_date DESC;
  `;
  return await executeQuery(query);
};

/**
 * Fetch filtered rebate entries with pagination
 */
const fetchFilteredRebates = async (filters = {}) => {
  const { year, branch, batch, page = 1, limit = 1000 } = filters;
  
  let query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE 1=1
  `;
  
  const params = [];
  
  // Apply filters
  if (year) {
    query += ` AND YEAR(r.start_date) = ?`;
    params.push(year);
  }
  
  if (branch) {
    query += ` AND s.branch = ?`;
    params.push(branch);
  }
  
  if (batch) {
    query += ` AND s.batch = ?`;
    params.push(batch);
  }
  
  // Add pagination if needed
  if (page && limit) {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Add pagination
    query += ` ORDER BY r.start_date DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
  } else {
    query += ` ORDER BY r.start_date DESC`;
  }
  
  return await executeQuery(query, params);
};

/**
 * Fetch all filtered rebate entries without pagination
 * Used for complete statistical calculations
 */
const fetchAllFilteredRebates = async (filters = {}) => {
  const { year, branch, batch } = filters;
  
  let query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE 1=1
  `;
  
  const params = [];
  
  // Apply filters
  if (year) {
    query += ` AND YEAR(r.start_date) = ?`;
    params.push(year);
  }
  
  if (branch) {
    query += ` AND s.branch = ?`;
    params.push(branch);
  }
  
  if (batch) {
    query += ` AND s.batch = ?`;
    params.push(batch);
  }
  
  query += ` ORDER BY r.start_date DESC`;
  
  return await executeQuery(query, params);
};

/**
 * Get overview statistics directly from the database
 */
const getOverviewStats = async (filters = {}) => {
  const { year, branch, batch } = filters;
  
  let query = `
    SELECT 
      COUNT(*) as totalRebates,
      SUM(r.rebate_days) as totalDays,
      COUNT(DISTINCT r.roll_no) as uniqueStudents
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE 1=1
  `;
  
  const params = [];
  
  // Apply filters
  if (year) {
    query += ` AND YEAR(r.start_date) = ?`;
    params.push(year);
  }
  
  if (branch) {
    query += ` AND s.branch = ?`;
    params.push(branch);
  }
  
  if (batch) {
    query += ` AND s.batch = ?`;
    params.push(batch);
  }
  
  const result = await executeQuery(query, params);
  
  // Calculate average days per student
  const stats = result[0];
  stats.averageDaysPerStudent = stats.uniqueStudents > 0 ? stats.totalDays / stats.uniqueStudents : 0;
  
  return stats;
};

/**
 * Fetch rebates for a specific student
 */
const fetchStudentRebates = async (roll_no) => {
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE r.roll_no = ?
    ORDER BY r.start_date DESC;
  `;
  return await executeQuery(query, [roll_no]);
};

/**
 * Get a rebate by composite key (roll_no and start_date)
 * The id is expected in the format: roll_no_YYYY-MM-DD
 */
const getRebateById = async (id) => {
  // Parse the composite key
  const [roll_no, date] = id.split('_');
  
  if (!roll_no || !date) {
    console.error(`Invalid rebate ID format: ${id}`);
    return null;
  }
  
  // Normalize date format to ensure consistency
  let formattedDate;
  try {
    // If date is already in YYYY-MM-DD format, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      formattedDate = date;
    } else {
      // Try to parse as a date and format
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid date in rebate ID: ${date}`);
        return null;
      }
      formattedDate = parsedDate.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error(`Error parsing date in rebate ID: ${date}`, error);
    return null;
  }
  
  // Use DATE() in MySQL to ensure exact date comparison
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date,
           DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date_str,
           r.end_date,
           DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date_str,
           r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE r.roll_no = ? 
    AND DATE(r.start_date) = ?
    LIMIT 1
  `;
  
  const results = await executeQuery(query, [roll_no, formattedDate]);
  
  if (results.length === 0) {
    console.log(`No rebate found with roll_no: ${roll_no} and start_date: ${formattedDate}`);
    
    // First fallback: Try using DATE_FORMAT instead of DATE
    const fallbackQuery = `
      SELECT r.roll_no, s.name, s.branch, s.batch, 
             r.start_date,
             DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date_str,
             r.end_date,
             DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date_str,
             r.rebate_days, r.gate_pass_no
      FROM rebates r
      JOIN students s ON r.roll_no = s.roll_no
      WHERE r.roll_no = ? 
      AND DATE_FORMAT(r.start_date, '%Y-%m-%d') = ?
      LIMIT 1
    `;
    
    const fallbackResults = await executeQuery(fallbackQuery, [roll_no, formattedDate]);
    
    if (fallbackResults.length === 0) {
      console.log(`No rebate found with fallback query either`);
      
      // Second fallback: Try with day+1 to handle potential timezone/off-by-one issue
      try {
        const dateParts = formattedDate.split('-').map(Number);
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        dateObj.setDate(dateObj.getDate() + 1); // Add one day
        const nextDayStr = dateObj.toISOString().split('T')[0];
        
        const adjustedResults = await executeQuery(query, [roll_no, nextDayStr]);
        
        if (adjustedResults.length > 0) {
          console.log(`Found rebate with adjusted date: ${nextDayStr}`);
          // Add the virtual id using the ORIGINAL date string format requested, 
          // not the adjusted one, to maintain consistency with the frontend's expectation
          return {
            ...adjustedResults[0],
            id: `${roll_no}_${formattedDate}`
          };
        }
        
        // If still not found, try one day before
        dateObj.setDate(dateObj.getDate() - 2); // Subtract two days (one to reset, one to go back)
        const prevDayStr = dateObj.toISOString().split('T')[0];
        
        const prevDayResults = await executeQuery(query, [roll_no, prevDayStr]);
        
        if (prevDayResults.length > 0) {
          console.log(`Found rebate with previous day date: ${prevDayStr}`);
          // Add the virtual id using the ORIGINAL date string format requested
          return {
            ...prevDayResults[0],
            id: `${roll_no}_${formattedDate}`
          };
        }
        
      } catch (error) {
        console.error(`Error trying date adjustment fallback:`, error);
      }
      
      return null;
    }
    
    console.log(`Found rebate with fallback DATE_FORMAT match: ${fallbackResults[0].start_date_str}`);
    
    // Add the virtual id back using the string representation for consistency
    return {
      ...fallbackResults[0],
      id: `${fallbackResults[0].roll_no}_${formattedDate}`  // Use the original requested date format
    };
  }
  
  console.log(`Found rebate with exact date match: ${results[0].start_date_str}`);
  
  // Add the virtual id back using the original requested date format for consistency
  return {
    ...results[0],
    id: `${roll_no}_${formattedDate}`
  };
};

/**
 * Update a rebate entry
 * The id is expected in the format: roll_no_YYYY-MM-DD
 */
const updateRebate = async (id, updateData) => {
  // Parse the composite key
  const [roll_no, date] = id.split('_');
  
  if (!roll_no || !date) {
    console.error(`Invalid rebate ID format: ${id}`);
    throw new Error('INVALID_ID_FORMAT');
  }
  
  // Find the rebate using DATE_FORMAT for exact string matching
  const findQuery = `
    SELECT * 
    FROM rebates 
    WHERE roll_no = ? 
    AND DATE_FORMAT(start_date, '%Y-%m-%d') = ?
  `;
  
  const results = await executeQuery(findQuery, [roll_no, date]);
  
  if (results.length === 0) {
    console.error(`No rebate found with roll_no: ${roll_no} and start_date: ${date}`);
    throw new Error('REBATE_NOT_FOUND');
  }
  
  const existingRebate = results[0];
  
  // Build update fields
  const fields = [];
  const values = [];
  let newStartDate = null;
  let newEndDate = null;
  
  // Handle start date update - only if explicitly provided
  if (updateData.start_date !== undefined) {
    // Ensure we have a YYYY-MM-DD format without time component
    let formattedStartDate = updateData.start_date;
    if (typeof formattedStartDate === 'string' && formattedStartDate.includes('T')) {
      formattedStartDate = formattedStartDate.split('T')[0];
    }
    
    fields.push('start_date = ?');
    values.push(formattedStartDate);
    newStartDate = formattedStartDate;
  } else {
    // Use existing date in calculations - format for consistency
    const startDateStr = new Date(existingRebate.start_date).toISOString().split('T')[0];
    newStartDate = startDateStr;
  }
  
  // Handle end date update - only if explicitly provided
  if (updateData.end_date !== undefined) {
    // Ensure we have a YYYY-MM-DD format without time component
    let formattedEndDate = updateData.end_date;
    if (typeof formattedEndDate === 'string' && formattedEndDate.includes('T')) {
      formattedEndDate = formattedEndDate.split('T')[0];
    }
    
    fields.push('end_date = ?');
    values.push(formattedEndDate);
    newEndDate = formattedEndDate;
  } else {
    // Format existing end date for calculations
    const endDateStr = new Date(existingRebate.end_date).toISOString().split('T')[0];
    newEndDate = endDateStr;
  }
  
  // Only recalculate rebate_days if at least one date changed
  if (updateData.start_date !== undefined || updateData.end_date !== undefined) {
    try {
      // Ensure we have clean date strings
      let startDateStr = newStartDate;
      let endDateStr = newEndDate;
      
      if (typeof startDateStr === 'string' && startDateStr.includes('T')) {
        startDateStr = startDateStr.split('T')[0];
      }
      
      if (typeof endDateStr === 'string' && endDateStr.includes('T')) {
        endDateStr = endDateStr.split('T')[0];
      }
      
      // Simple direct calculation for same month
      const startParts = startDateStr.split('-').map(Number);
      const endParts = endDateStr.split('-').map(Number);
      
      let diffDays;
      
      // Simple direct calculation for same month
      if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
        // Same year, same month: just compute day difference
        diffDays = endParts[2] - startParts[2];
      } else {
        // Different month: Use date objects but force integer math
        const startDate = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
        const endDate = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
        
        // Calculate days manually - NO +1
        const diffTimeMs = endDate.getTime() - startDate.getTime();
        const diffDays_calc = Math.floor(diffTimeMs / (1000 * 60 * 60 * 24));
        diffDays = diffDays_calc; // Removed +1
      }
      
      fields.push('rebate_days = ?');
      values.push(diffDays);
    } catch (error) {
      console.error('Error calculating rebate days:', error);
      throw new Error(`Failed to calculate rebate days: ${error.message}`);
    }
  }
  
  // If nothing to update, return existing rebate
  if (fields.length === 0) {
    return { id, ...existingRebate };
  }
  
  // Complete the query parameters
  values.push(roll_no);
  values.push(existingRebate.start_date);
  
  // Execute update
  const updateQuery = `
    UPDATE rebates
    SET ${fields.join(', ')}
    WHERE roll_no = ? AND start_date = ?
  `;
  
  try {
    await executeQuery(updateQuery, values);
    
    // Get the updated rebate
    const updatedResults = await executeQuery(findQuery, [roll_no, newStartDate]);
    
    if (updatedResults.length === 0) {
      const fallbackResults = await executeQuery(findQuery, [roll_no, date]);
      
      if (fallbackResults.length > 0) {
        return { id, ...fallbackResults[0] };
      }
      
      throw new Error('Could not retrieve updated rebate');
    }
    
    // Return with original ID for consistency with frontend
    return { id, ...updatedResults[0] };
  } catch (error) {
    console.error(`ERROR executing update query:`, error);
    throw error;
  }
};

/**
 * Fetch rebates by month and year
 */
const fetchRebatesByMonth = async (year, month) => {
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, 
           DATE_FORMAT(r.start_date, '%Y-%m-%d') AS start_date_str,
           r.end_date,
           DATE_FORMAT(r.end_date, '%Y-%m-%d') AS end_date_str,
           r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE YEAR(r.start_date) = ? AND MONTH(r.start_date) = ?
    ORDER BY r.start_date DESC
  `;
  
  const results = await executeQuery(query, [year, month]);
  
  // Create virtual ids based on roll_no and start_date
  // ALWAYS use the SQL-formatted date string to ensure consistency
  return results.map(rebate => {
    // Use ONLY the SQL date format which has the correct date
    const id = `${rebate.roll_no}_${rebate.start_date_str}`;
    
    // For debugging, check if there would be a difference with JS date formatting
    const jsDateStr = new Date(rebate.start_date).toISOString().split('T')[0];
    
    return {
      ...rebate,
      // Use SQL date string for id, but also include it as a separate property
      // for any frontend components that might need it
      id: id,
      sql_date_str: rebate.start_date_str
    };
  });
};

/**
 * For debugging: Find close matches to a rebate by ID
 * Searches with more flexible criteria to help diagnose issues
 */
const findCloseRebateMatches = async (id) => {
  // Parse the composite key
  const [roll_no, date] = id.split('_');
  
  if (!roll_no || !date) {
    console.error(`Invalid rebate ID format for debug search: ${id}`);
    return [];
  }
  
  // Get the year and month from the date string
  let year, month, day;
  try {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth() + 1;
      day = parsedDate.getDate();
    } else {
      // Try to parse YYYY-MM-DD format
      const parts = date.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        console.error(`Could not parse date: ${date} - invalid format`);
        return [];
      }
    }
  } catch (error) {
    console.error(`Error parsing date for debug: ${date}`, error);
    return [];
  }
  
  if (!year || !month) {
    console.error(`Could not extract year/month from date: ${date}`);
    return [];
  }
  
  // Search for rebates within the same month for this student
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, 
           DATE_FORMAT(r.start_date, '%Y-%m-%d') as start_date_str,
           r.end_date,
           DATE_FORMAT(r.end_date, '%Y-%m-%d') as end_date_str,
           r.rebate_days, r.gate_pass_no
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE r.roll_no = ? 
    AND YEAR(r.start_date) = ?
    AND MONTH(r.start_date) = ?
    ORDER BY r.start_date ASC
  `;
  
  try {
    const results = await executeQuery(query, [roll_no, year, month]);
    
    return results;
  } catch (error) {
    console.error('Error in findCloseRebateMatches:', error);
    return [];
  }
};

export {
  checkOverlappingRebates,
  createRebate,
  fetchAllRebates,
  fetchFilteredRebates,
  fetchAllFilteredRebates,
  getOverviewStats,
  fetchStudentRebates,
  getRebateById,
  updateRebate,
  fetchRebatesByMonth,
  findCloseRebateMatches
}; 