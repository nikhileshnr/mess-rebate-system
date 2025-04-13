import * as StatisticsService from '../services/statisticsService.js';
import { NotFoundError, DatabaseError } from '../errors/applicationErrors.js';

/**
 * Controller method to get statistics with filters and pagination
 */
const getStatistics = async (req, res, next) => {
  try {
    const { year, branch, batch, page, limit } = req.query;
    
    // Convert page and limit to numbers if provided
    const pagination = {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined
    };
    
    // Pass filters and pagination to service layer
    const statistics = await StatisticsService.getStatistics({ 
      year, 
      branch, 
      batch,
      ...pagination
    });
    
    res.json(statistics);
  } catch (error) {
    console.error('Statistics error:', error);
    next(new DatabaseError('Failed to fetch statistics'));
  }
};

/**
 * Clear statistics cache for admin use
 */
const clearStatisticsCache = async (req, res, next) => {
  try {
    const result = await StatisticsService.clearStatsCache();
    res.json(result);
  } catch (error) {
    console.error('Cache clear error:', error);
    next(new DatabaseError('Failed to clear statistics cache'));
  }
};

export { getStatistics, clearStatisticsCache }; 