import { getPrices, setPrices } from '../config/priceConfig.js';
import { createValidationError, createDatabaseError } from '../utils/errorHandler.js';

// Get current prices
export const getCurrentPrices = async (req, res, next) => {
  try {
    const prices = getPrices();
    res.json(prices);
  } catch (error) {
    next(createDatabaseError('Error fetching prices'));
  }
};

// Update prices
export const updatePrices = async (req, res, next) => {
  try {
    const { price_per_day, gala_dinner_cost } = req.body;
    
    if (price_per_day === undefined && gala_dinner_cost === undefined) {
      return next(createValidationError('At least one price must be provided'));
    }

    if (price_per_day !== undefined && price_per_day < 0) {
      return next(createValidationError('Price per day cannot be negative'));
    }

    if (gala_dinner_cost !== undefined && gala_dinner_cost < 0) {
      return next(createValidationError('Gala dinner cost cannot be negative'));
    }

    const newPrices = setPrices({ price_per_day, gala_dinner_cost });
    res.json(newPrices);
  } catch (error) {
    next(createDatabaseError('Error updating prices'));
  }
}; 