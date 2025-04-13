import { pool, executeQuery } from "../config/db.js";

export const getManagerByUsername = async (username) => {
  try {
    const query = "SELECT * FROM mess_managers WHERE username = ?";
    const results = await executeQuery(query, [username]);
    return results[0]; // Return manager object
  } catch (error) {
    throw error;
  }
};
