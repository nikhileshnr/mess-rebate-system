import { pool, executeQuery } from "../config/db.js";

// Function to check for overlapping rebates
export const checkOverlappingRebates = async (roll_no, start_date, end_date) => {
  try {
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
  } catch (error) {
    throw error;
  }
};

// Function to create a rebate entry
export const createRebate = async (roll_no, start_date, end_date, rebate_days, gate_pass_no) => {
  try {
    // Check for overlapping rebates first
    const hasOverlap = await checkOverlappingRebates(roll_no, start_date, end_date);
    if (hasOverlap) {
      throw new Error('OVERLAPPING_REBATE');
    }

    const query = "INSERT INTO rebates (roll_no, start_date, end_date, rebate_days, gate_pass_no) VALUES (?, ?, ?, ?, ?)";
    const result = await executeQuery(query, [roll_no, start_date, end_date, rebate_days, gate_pass_no]);
    return result;
  } catch (error) {
    throw error;
  }
};

// Function to fetch all rebate entries
export const fetchAllRebates = async () => {
  try {
    const query = `
      SELECT r.roll_no, s.name, s.branch, s.batch, 
             r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
      FROM rebates r
      JOIN students s ON r.roll_no = s.roll_no
      ORDER BY r.start_date DESC;
    `;
    return await executeQuery(query);
  } catch (error) {
    throw error;
  }
};

// Function to fetch rebates for a specific student
export const fetchStudentRebates = async (roll_no) => {
  try {
    const query = `
      SELECT r.roll_no, s.name, s.branch, s.batch, 
             r.start_date, r.end_date, r.rebate_days, r.gate_pass_no
      FROM rebates r
      JOIN students s ON r.roll_no = s.roll_no
      WHERE r.roll_no = ?
      ORDER BY r.start_date DESC;
    `;
    return await executeQuery(query, [roll_no]);
  } catch (error) {
    throw error;
  }
};
