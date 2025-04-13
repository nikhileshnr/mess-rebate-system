import * as RebateRepository from '../repositories/rebateRepository.js';
import * as StudentRepository from '../repositories/studentRepository.js';
import NodeCache from 'node-cache';

// Create a cache with 30 minute TTL
const statsCache = new NodeCache({ stdTTL: 1800 });

/**
 * Gets complete statistics with optional filters
 */
const getStatistics = async (filters = {}) => {
  const { year, branch, batch, page = 1, limit = 20 } = filters;
  
  // Create a cache key based on the filters, excluding pagination parameters
  const cacheKey = `stats_${year || 'all'}_${branch || 'all'}_${batch || 'all'}`;
  
  // Check if we have cached data for these filters
  const cachedStats = statsCache.get(cacheKey);
  
  if (cachedStats) {
    // If pagination requested, paginate only the users but keep all other stats complete
    if (page && limit) {
      return paginateUsers(cachedStats, page, limit);
    }
    return cachedStats;
  }
  
  // Always fetch complete dataset for accurate statistics
  const [allRebates, allStudents] = await Promise.all([
    RebateRepository.fetchAllFilteredRebates(filters), // This should get ALL rebates matching filters, without pagination
    StudentRepository.getFilteredStudents(filters)
  ]);
  
  // Create a map of students for quick lookup
  const studentMap = {};
  allStudents.forEach(student => {
    studentMap[student.roll_no] = student;
  });
  
  // Get unique branches and batches for the filter dropdowns
  const branches = [...new Set(allStudents.map(student => student.branch))].filter(Boolean).sort();
  const batches = [...new Set(allStudents.map(student => student.batch))].filter(Boolean).sort();
  
  // Calculate overview statistics using complete dataset
  const overview = calculateOverviewStats(allRebates);
  
  // Calculate student rebate statistics
  const studentRebateStats = calculateStudentRebateStats(allStudents, allRebates);
  
  // Calculate monthly trends
  const monthlyTrends = calculateMonthlyTrends(allRebates);

  // Calculate branch and batch statistics
  const branchStats = calculateBranchStats(allRebates, studentMap, branches);
  const batchStats = calculateBatchStats(allRebates, studentMap, batches);

  // Prepare the final response with complete data
  const response = {
    overview,
    allUsers: Object.values(studentRebateStats),
    monthlyTrends,
    branchStats,
    batchStats,
    filters: {
      branches,
      batches,
      years: [...new Set(allRebates.map(rebate => 
        new Date(rebate.start_date).getFullYear()
      ))].sort((a, b) => b - a)
    }
  };
  
  // Cache the complete results
  statsCache.set(cacheKey, response);
  
  // Return paginated users if pagination is requested
  if (page && limit) {
    return paginateUsers(response, page, limit);
  }
  
  return response;
};

/**
 * Helper function to calculate overview statistics
 */
const calculateOverviewStats = (rebates) => {
  const totalRebates = rebates.length;
  const totalDays = rebates.reduce((sum, rebate) => sum + rebate.rebate_days, 0);
  const uniqueStudents = new Set(rebates.map(rebate => rebate.roll_no)).size;
  const averageDaysPerStudent = uniqueStudents > 0 ? totalDays / uniqueStudents : 0;

  return {
    totalRebates,
    totalDays,
    uniqueStudents,
    averageDaysPerStudent
  };
};

/**
 * Helper function to paginate only the users list while keeping all other stats intact
 */
const paginateUsers = (data, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const totalUsers = data.allUsers.length;
  
  const paginatedResponse = {
    ...data,
    allUsers: data.allUsers.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalItems: totalUsers,
      itemsPerPage: limit
    }
  };
  
  return paginatedResponse;
};

/**
 * Calculate student rebate statistics
 */
const calculateStudentRebateStats = (students, rebates) => {
  // Initialize student stats
  const studentStats = {};
  students.forEach(student => {
    studentStats[student.roll_no] = {
      roll_no: student.roll_no,
      name: student.name,
      branch: student.branch,
      batch: student.batch,
      totalRebates: 0,
      totalDays: 0,
      filteredRebates: 0,
      filteredDays: 0
    };
  });

  // Calculate rebate stats for each student
  rebates.forEach(rebate => {
    if (studentStats[rebate.roll_no]) {
      studentStats[rebate.roll_no].totalRebates++;
      studentStats[rebate.roll_no].totalDays += rebate.rebate_days;
      studentStats[rebate.roll_no].filteredRebates++;
      studentStats[rebate.roll_no].filteredDays += rebate.rebate_days;
    }
  });
  
  return studentStats;
};

/**
 * Calculate monthly trends from rebate data
 */
const calculateMonthlyTrends = (rebates) => {
  const monthlyTrends = {};
  
  rebates.forEach(rebate => {
    const month = new Date(rebate.start_date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = {
        totalRebates: 0,
        totalDays: 0,
        uniqueStudents: new Set()
      };
    }
    monthlyTrends[month].totalRebates++;
    monthlyTrends[month].totalDays += rebate.rebate_days;
    monthlyTrends[month].uniqueStudents.add(rebate.roll_no);
  });

  // Convert monthly trends to array and sort by date
  return Object.entries(monthlyTrends).map(([month, stats]) => ({
    month,
    totalRebates: stats.totalRebates,
    totalDays: stats.totalDays,
    uniqueStudents: stats.uniqueStudents.size
  })).sort((a, b) => new Date(a.month) - new Date(b.month));
};

/**
 * Calculate statistics by branch
 */
const calculateBranchStats = (rebates, studentMap, branches) => {
  const branchStats = {};
  
  branches.forEach(branch => {
    branchStats[branch] = {
      totalRebates: 0,
      totalDays: 0,
      uniqueStudents: new Set(),
      averageDaysPerStudent: 0
    };
  });
  
  rebates.forEach(rebate => {
    const student = studentMap[rebate.roll_no];
    if (student && student.branch && branchStats[student.branch]) {
      branchStats[student.branch].totalRebates++;
      branchStats[student.branch].totalDays += rebate.rebate_days;
      branchStats[student.branch].uniqueStudents.add(rebate.roll_no);
    }
  });
  
  // Calculate average days per student
  Object.keys(branchStats).forEach(branch => {
    const stats = branchStats[branch];
    stats.uniqueStudents = stats.uniqueStudents.size;
    stats.averageDaysPerStudent = stats.uniqueStudents > 0 ? stats.totalDays / stats.uniqueStudents : 0;
  });
  
  return branchStats;
};

/**
 * Calculate statistics by batch
 */
const calculateBatchStats = (rebates, studentMap, batches) => {
  const batchStats = {};
  
  batches.forEach(batch => {
    batchStats[batch] = {
      totalRebates: 0,
      totalDays: 0,
      uniqueStudents: new Set(),
      averageDaysPerStudent: 0
    };
  });
  
  rebates.forEach(rebate => {
    const student = studentMap[rebate.roll_no];
    if (student && student.batch) {
      const batchKey = student.batch.toString();
      if (batchStats[batchKey]) {
        batchStats[batchKey].totalRebates++;
        batchStats[batchKey].totalDays += rebate.rebate_days;
        batchStats[batchKey].uniqueStudents.add(rebate.roll_no);
      }
    }
  });
  
  // Calculate average days per student
  Object.keys(batchStats).forEach(batch => {
    const stats = batchStats[batch];
    stats.uniqueStudents = stats.uniqueStudents.size;
    stats.averageDaysPerStudent = stats.uniqueStudents > 0 ? stats.totalDays / stats.uniqueStudents : 0;
  });
  
  return batchStats;
};

/**
 * Clear the statistics cache
 */
const clearStatsCache = () => {
  statsCache.flushAll();
  return { success: true, message: 'Statistics cache cleared' };
};

export {
  getStatistics,
  clearStatsCache
}; 