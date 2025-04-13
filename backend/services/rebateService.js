import * as RebateRepository from '../repositories/rebateRepository.js';
import * as StudentRepository from '../repositories/studentRepository.js';

/**
 * Create a new rebate entry with business rule validation
 */
const createRebate = async (roll_no, start_date, end_date, rebate_days) => {
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
  return await RebateRepository.createRebate(roll_no, start_date, end_date, rebate_days);
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

export {
  createRebate,
  getAllRebates,
  getStudentRebates,
  checkRebateOverlap
}; 