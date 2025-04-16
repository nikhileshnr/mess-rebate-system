import * as RebateRepository from '../repositories/rebateRepository.js';
import * as StudentRepository from '../repositories/studentRepository.js';
import { clearStatsCache } from './statisticsService.js';

/**
 * Create a new rebate entry with business rule validation
 */
const createRebate = async (roll_no, start_date, end_date, rebate_days, gate_pass_no) => {
  // Validate student exists
  const student = await StudentRepository.getStudentByRollNo(roll_no);
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND');
  }
  
  // Check for overlapping rebates
  const hasOverlap = await RebateRepository.checkOverlappingRebates(roll_no, start_date, end_date);
  if (hasOverlap) {
    throw new Error('OVERLAPPING_REBATE');
  }
  
  // Create the rebate
  const result = await RebateRepository.createRebate(roll_no, start_date, end_date, rebate_days, gate_pass_no);
  
  // Clear statistics cache after creating a new rebate
  clearStatsCache();
  
  return result;
};

/**
 * Get all rebates
 */
const getAllRebates = async () => {
  return await RebateRepository.fetchAllRebates();
};

/**
 * Get rebates for a specific student
 */
const getStudentRebates = async (roll_no) => {
  // Validate student exists
  const student = await StudentRepository.getStudentByRollNo(roll_no);
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND');
  }
  
  return await RebateRepository.fetchStudentRebates(roll_no);
};

/**
 * Check if a new rebate would overlap with existing ones
 */
const checkRebateOverlap = async (roll_no, start_date, end_date) => {
  // Validate student exists
  const student = await StudentRepository.getStudentByRollNo(roll_no);
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND');
  }
  
  return await RebateRepository.checkOverlappingRebates(roll_no, start_date, end_date);
};

/**
 * Update multiple rebate entries
 */
const updateMultipleRebates = async (rebates) => {
  const updatedRebates = [];
  
  // Validate each rebate and then update
  for (const rebate of rebates) {
    const { id, roll_no, start_date, end_date } = rebate;
    
    try {
      // Debug: Log all rebates for this student to find the issue
      console.log(`Attempting to update rebate with id: ${id}, roll_no: ${roll_no}`);
      
      // Get all rebates for this student to debug
      const studentRebates = await RebateRepository.fetchStudentRebates(roll_no);
      console.log(`Found ${studentRebates.length} rebate entries for student ${roll_no}:`);
      studentRebates.forEach(r => {
        // Use DATE_FORMAT to get consistent date strings rather than JS Date objects
        // This will match how IDs are being generated elsewhere
        const sqlFormattedDate = new Date(r.start_date)
          .toLocaleDateString('en-CA', { // en-CA uses YYYY-MM-DD format
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Kolkata' // Use Indian timezone to match server
          });
        
        console.log(`- ID: ${r.roll_no}_${sqlFormattedDate}, ` +
                   `Start: ${r.start_date} (${typeof r.start_date}), ` +
                   `End: ${r.end_date} (${typeof r.end_date})`);
      });
      
      // Find close matches to help diagnose the issue
      console.log(`Looking for close matches to rebate ID: ${id}`);
      await RebateRepository.findCloseRebateMatches(id);
      
      // Fetch the existing rebate to ensure it exists
      const existingRebate = await RebateRepository.getRebateById(id);
      if (!existingRebate) {
        console.error(`Rebate not found with id: ${id}`);
        throw new Error('REBATE_NOT_FOUND');
      }
      
      // If both dates are provided, validate end_date is after start_date
      if (start_date && end_date) {
        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          console.error(`Invalid date format: start=${start_date}, end=${end_date}`);
          throw new Error('INVALID_DATE_FORMAT');
        }
        
        if (endDateObj <= startDateObj) {
          console.error(`End date must be after start date: start=${start_date}, end=${end_date}`);
          throw new Error('INVALID_DATE_RANGE');
        }
      }
      
      // Update the rebate with only the fields that were provided
      const updateData = {};
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      
      const updatedRebate = await RebateRepository.updateRebate(id, updateData);
      
      updatedRebates.push(updatedRebate);
    } catch (error) {
      console.error(`Error updating rebate ${id}:`, error);
      throw error;
    }
  }
  
  // Clear statistics cache after updates
  clearStatsCache();
  
  return updatedRebates;
};

/**
 * Get rebates by month and year
 */
const getRebatesByMonth = async (year, month) => {
  return await RebateRepository.fetchRebatesByMonth(year, month);
};

export {
  createRebate,
  getAllRebates,
  getStudentRebates,
  checkRebateOverlap,
  updateMultipleRebates,
  getRebatesByMonth
}; 