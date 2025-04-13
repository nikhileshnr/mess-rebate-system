import express from 'express';
import { getStatistics, clearStatisticsCache } from '../controllers/statisticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateQuery } from "../validators/requestValidator.js";
import { statisticsSchemas } from "../validators/schemas.js";

const router = express.Router();

// Get statistics with filters and pagination
router.get(
  '/', 
  authMiddleware, 
  validateQuery(statisticsSchemas.query),
  getStatistics
);

// Clear statistics cache (admin only)
router.post(
  '/clear-cache',
  authMiddleware,
  clearStatisticsCache
);

export default router; 