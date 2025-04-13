import { getStudentById } from '../models/studentModel.js';
import { createRebate, fetchAllRebates, fetchStudentRebates, checkOverlappingRebates } from '../models/rebateModel.js';
import {
  createValidationError,
  createDatabaseError,
  createNotFoundError,
  createDuplicateError
} from '../utils/errorHandler.js';

// Validate dates
const validateDates = (startDate, endDate) => {
  if (isNaN(startDate) || isNaN(endDate)) {
    throw createValidationError('Invalid date format');
  }
  if (startDate > endDate) {
    throw createValidationError('Start date cannot be after end date');
  }
};

// Calculate rebate days
const calculateRebateDays = (startDate, endDate) => {
  return Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1;
};

export const createRebateEntry = async (req, res, next) => {
  try {
    const { roll_no, start_date, end_date } = req.body;

    if (!roll_no || !start_date || !end_date) {
      throw createValidationError('Please enter valid details');
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    validateDates(startDate, endDate);

    const rebate_days = calculateRebateDays(startDate, endDate);

    // Check if student exists
    const student = await getStudentById(roll_no);
    if (!student) {
      throw createNotFoundError('Invalid Roll No.');
    }

    // Create rebate entry
    try {
      const rebate = await createRebate(roll_no, start_date, end_date, rebate_days);
      res.json({
        success: true,
        message: 'Rebate entry created successfully!',
        rebate
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw createDuplicateError('A rebate entry already exists for this roll number and start date');
      }
      if (error.message === 'OVERLAPPING_REBATE') {
        throw createValidationError('This rebate period overlaps with an existing rebate entry. Please check the dates and try again.');
      }
      throw createDatabaseError('Failed to create rebate entry');
    }
  } catch (error) {
    next(error);
  }
};

export const getAllRebates = async (req, res, next) => {
  try {
    const results = await fetchAllRebates();
    
    if (!Array.isArray(results)) {
      throw createDatabaseError('Invalid response format from database');
    }
    
    res.json(results);
  } catch (error) {
    next(createDatabaseError('Failed to fetch rebates'));
  }
};

export const getStudentRebates = async (req, res, next) => {
  try {
    const { roll_no } = req.params;
    
    if (!roll_no) {
      throw createValidationError('Roll number is required');
    }

    const results = await fetchStudentRebates(roll_no);
    res.json(results);
  } catch (error) {
    next(createDatabaseError('Failed to fetch student rebates'));
  }
};

export const checkRebateOverlap = async (req, res, next) => {
  try {
    const { roll_no, start_date, end_date } = req.query;
    
    if (!roll_no || !start_date || !end_date) {
      throw createValidationError('Roll number, start date, and end date are required');
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    validateDates(startDate, endDate);
    
    // Check for overlapping rebates
    const hasOverlap = await checkOverlappingRebates(roll_no, start_date, end_date);
    
    res.json({
      hasOverlap,
      message: hasOverlap ? 'This rebate period overlaps with an existing rebate entry' : 'No overlap found'
    });
  } catch (error) {
    next(error);
  }
};
