import { pool, executeQuery } from "../config/db.js";

export const getStudentById = async (roll_no) => {
  try {
    const query = "SELECT * FROM students WHERE roll_no = ?";
    const results = await executeQuery(query, [roll_no]);
    return results[0];
  } catch (error) {
    throw error;
  }
};

export const getAllStudents = async () => {
  try {
    const query = "SELECT * FROM students ORDER BY roll_no";
    return await executeQuery(query);
  } catch (error) {
    throw error;
  }
};
