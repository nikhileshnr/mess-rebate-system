import * as Rebate from '../models/rebateModel.js';
import * as Student from '../models/studentModel.js';
import { createDatabaseError } from '../utils/errorHandler.js';

const getStatistics = async (req, res, next) => {
  try {
    const { year, branch, batch } = req.query;
    
    // Get all rebates and students
    const allRebates = await Rebate.fetchAllRebates();
    const allStudents = await Student.getAllStudents();
    
    // Create a map of students for quick lookup
    const studentMap = {};
    allStudents.forEach(student => {
      studentMap[student.roll_no] = student;
    });
    
    // Get unique branches and batches for the filter dropdowns
    const branches = [...new Set(allStudents.map(student => student.branch))].filter(Boolean).sort();
    const batches = [...new Set(allStudents.map(student => student.batch))].filter(Boolean).sort();
    
    // Initialize studentRebateStats with all students and their total rebates
    const studentRebateStats = {};
    allStudents.forEach(student => {
      studentRebateStats[student.roll_no] = {
        roll_no: student.roll_no,
        name: student.name,
        branch: student.branch,
        batch: student.batch,
        totalRebates: 0,
        totalDays: 0
      };
    });

    // Calculate total rebates for each student (unfiltered)
    allRebates.forEach(rebate => {
      if (studentRebateStats[rebate.roll_no]) {
        studentRebateStats[rebate.roll_no].totalRebates++;
        studentRebateStats[rebate.roll_no].totalDays += rebate.rebate_days;
      }
    });
    
    // Filter rebates based on year, branch, and batch
    let filteredRebates = [...allRebates];
    
    // Apply filters one by one
    if (year) {
      const yearNum = parseInt(year);
      filteredRebates = filteredRebates.filter(rebate => {
        const rebateYear = new Date(rebate.start_date).getFullYear();
        return rebateYear === yearNum;
      });
    }
    
    if (branch) {
      filteredRebates = filteredRebates.filter(rebate => {
        const student = studentMap[rebate.roll_no];
        return student && student.branch === branch;
      });
    }
    
    if (batch) {
      const batchNum = parseInt(batch);
      filteredRebates = filteredRebates.filter(rebate => {
        const student = studentMap[rebate.roll_no];
        return student && (student.batch === batch || student.batch === batchNum);
      });
    }

    // Calculate overall statistics using filtered rebates
    const totalRebates = filteredRebates.length;
    const totalDays = filteredRebates.reduce((sum, rebate) => sum + rebate.rebate_days, 0);
    const uniqueStudents = new Set(filteredRebates.map(rebate => rebate.roll_no)).size;
    const averageDaysPerStudent = uniqueStudents > 0 ? totalDays / uniqueStudents : 0;

    // Calculate filtered rebate days for each student
    const filteredStudentStats = {};
    allStudents.forEach(student => {
      filteredStudentStats[student.roll_no] = {
        ...studentRebateStats[student.roll_no],
        filteredRebates: 0,
        filteredDays: 0
      };
    });

    // Apply filters to student stats
    filteredRebates.forEach(rebate => {
      if (filteredStudentStats[rebate.roll_no]) {
        filteredStudentStats[rebate.roll_no].filteredRebates++;
        filteredStudentStats[rebate.roll_no].filteredDays += rebate.rebate_days;
      }
    });

    // Get all users with their stats, properly filtered
    const allUsers = Object.values(filteredStudentStats)
      .filter(student => {
        // Only filter by branch and batch, not by rebates
        if (branch && student.branch !== branch) return false;
        if (batch && student.batch.toString() !== batch.toString()) return false;
        return true;
      });

    // Calculate monthly trends
    const monthlyTrends = {};
    filteredRebates.forEach(rebate => {
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
    const monthlyTrendsArray = Object.entries(monthlyTrends).map(([month, stats]) => ({
      month,
      totalRebates: stats.totalRebates,
      totalDays: stats.totalDays,
      uniqueStudents: stats.uniqueStudents.size
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    // Calculate branch-wise statistics
    const branchStats = {};
    branches.forEach(branch => {
      branchStats[branch] = {
        totalRebates: 0,
        totalDays: 0,
        uniqueStudents: new Set(),
        averageDaysPerStudent: 0
      };
    });

    // Calculate batch-wise statistics
    const batchStats = {};
    batches.forEach(batch => {
      batchStats[batch] = {
        totalRebates: 0,
        totalDays: 0,
        uniqueStudents: new Set(),
        averageDaysPerStudent: 0
      };
    });

    // Populate branch and batch statistics in one pass
    filteredRebates.forEach(rebate => {
      const student = studentMap[rebate.roll_no];
      if (student) {
        if (student.branch && branchStats[student.branch]) {
          branchStats[student.branch].totalRebates++;
          branchStats[student.branch].totalDays += rebate.rebate_days;
          branchStats[student.branch].uniqueStudents.add(rebate.roll_no);
        }
        
        if (student.batch) {
          const batchKey = student.batch.toString();
          if (batchStats[batchKey]) {
            batchStats[batchKey].totalRebates++;
            batchStats[batchKey].totalDays += rebate.rebate_days;
            batchStats[batchKey].uniqueStudents.add(rebate.roll_no);
          }
        }
      }
    });

    // Calculate averages for branches and batches
    const calculateAverages = (statsObject) => {
      Object.keys(statsObject).forEach(key => {
        const stats = statsObject[key];
        stats.uniqueStudents = stats.uniqueStudents.size;
        stats.averageDaysPerStudent = stats.uniqueStudents > 0 ? stats.totalDays / stats.uniqueStudents : 0;
      });
    };
    
    calculateAverages(branchStats);
    calculateAverages(batchStats);

    res.json({
      overview: {
        totalRebates,
        totalDays,
        uniqueStudents,
        averageDaysPerStudent
      },
      allUsers,  // Send all users instead of separate top and least active lists
      monthlyTrends: monthlyTrendsArray,
      branchStats,
      batchStats,
      filters: {
        branches,
        batches,
        years: [...new Set(allRebates.map(rebate => 
          new Date(rebate.start_date).getFullYear()
        ))].sort((a, b) => b - a)
      }
    });
  } catch (error) {
    next(createDatabaseError('Failed to fetch statistics'));
  }
};

export { getStatistics }; 