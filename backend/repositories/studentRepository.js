import { executeQuery } from "../config/db.js";

/**
 * Get all students
 */
const getAllStudents = async () => {
  const query = "SELECT * FROM students ORDER BY name";
  return await executeQuery(query);
};

/**
 * Get filtered students based on branch and batch
 */
const getFilteredStudents = async (filters = {}) => {
  const { branch, batch } = filters;
  
  let query = "SELECT * FROM students WHERE 1=1";
  const params = [];
  
  // Apply filters
  if (branch) {
    query += " AND branch = ?";
    params.push(branch);
  }
  
  if (batch) {
    query += " AND batch = ?";
    params.push(batch);
  }
  
  query += " ORDER BY name";
  
  return await executeQuery(query, params);
};

/**
 * Get student by roll number
 */
const getStudentByRollNo = async (roll_no) => {
  const query = "SELECT * FROM students WHERE roll_no = ?";
  const result = await executeQuery(query, [roll_no]);
  return result.length ? result[0] : null;
};

export {
  getAllStudents,
  getFilteredStudents,
  getStudentByRollNo
}; 