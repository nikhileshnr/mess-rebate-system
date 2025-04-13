import { pool, executeQuery } from "../config/db.js";

export const getAllStudents = async () => {
  try {
    const query = "SELECT * FROM students ORDER BY name";
    return await executeQuery(query);
  } catch (error) {
    throw error;
  }
};
