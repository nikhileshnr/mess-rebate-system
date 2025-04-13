import mysql from 'mysql2/promise';
import config from './config.js';

// Create connection pool
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
});

// Test the connection
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

export { pool, testConnection, executeQuery };
