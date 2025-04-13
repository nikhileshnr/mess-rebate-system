import express from 'express';
import { getStatistics } from '../controllers/statisticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get statistics with filters
router.get('/', authMiddleware, getStatistics);

export default router; 