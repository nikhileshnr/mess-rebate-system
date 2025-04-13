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
const createRebate = async (roll_no, start_date, end_date, rebate_days) => {
  const query = "INSERT INTO rebates (roll_no, start_date, end_date, rebate_days) VALUES (?, ?, ?, ?)";
  const result = await executeQuery(query, [roll_no, start_date, end_date, rebate_days]);
  return result;
};

/**
 * Fetch all rebate entries with student info
 */
const fetchAllRebates = async () => {
  const query = `
    SELECT r.roll_no, s.name, s.branch, s.batch, 
           r.start_date, r.end_date, r.rebate_days
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
           r.start_date, r.end_date, r.rebate_days
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
           r.start_date, r.end_date, r.rebate_days
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
           r.start_date, r.end_date, r.rebate_days
    FROM rebates r
    JOIN students s ON r.roll_no = s.roll_no
    WHERE r.roll_no = ?
    ORDER BY r.start_date DESC;
  `;
  return await executeQuery(query, [roll_no]);
};

export {
  checkOverlappingRebates,
  createRebate,
  fetchAllRebates,
  fetchFilteredRebates,
  fetchAllFilteredRebates,
  getOverviewStats,
  fetchStudentRebates
}; 