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
const clearStatisticsCache = (req, res, next) => {
  try {
    // The clearStatsCache function is synchronous
    const result = StatisticsService.clearStatsCache();
    
    // Ensure we're always returning a valid JSON object
    const responseData = result || {
      success: true,
      message: 'Statistics cache cleared successfully',
      timestamp: new Date().toISOString()
    };
    
    // Set proper content type and send the response
    res.setHeader('Content-Type', 'application/json');
    
    // Make sure we're not accidentally returning null
    // This will ensure we always have a valid response object
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Cache clear exception:', error);
    
    // Ensure error response is also proper JSON
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to clear statistics cache',
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

export { getStatistics, clearStatisticsCache }; 