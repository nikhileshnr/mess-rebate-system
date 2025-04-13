import express from 'express';
import { getCurrentPrices, updatePrices } from '../controllers/priceSettingsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current price
router.get('/current', getCurrentPrices);

// Update price (authenticated users only)
router.put('/update', authMiddleware, updatePrices);

export default router; 