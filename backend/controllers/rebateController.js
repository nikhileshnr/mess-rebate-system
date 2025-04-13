import * as RebateService from '../services/rebateService.js';
import { validateRequest, validateQuery, validateParams } from '../validators/requestValidator.js';
import { rebateSchemas } from '../validators/schemas.js';
import { toRebateResponse } from '../dto/rebateDto.js';
import { 
  NotFoundError, 
  ValidationError, 
  DatabaseError, 
  BusinessRuleError 
} from '../errors/applicationErrors.js';

/**
 * Controller to create a new rebate entry
 */
export const createRebateEntry = async (req, res, next) => {
  try {
    const { roll_no, start_date, end_date, rebate_days } = req.body;
    
    // Service layer handles business logic and validation
    const result = await RebateService.createRebate(roll_no, start_date, end_date, rebate_days);
    
    res.status(201).json({
      success: true,
      message: 'Rebate entry created successfully!',
      rebate: result
    });
  } catch (error) {
    if (error.message === 'STUDENT_NOT_FOUND') {
      next(new NotFoundError('Student not found with the provided roll number', 'student'));
    } else if (error.message === 'OVERLAPPING_REBATE') {
      next(new BusinessRuleError('This rebate period overlaps with an existing rebate entry', 'no-overlap'));
    } else {
      next(new DatabaseError('Failed to create rebate entry'));
    }
  }
};

/**
 * Controller to get all rebates
 */
export const getAllRebates = async (req, res, next) => {
  try {
    const rebates = await RebateService.getAllRebates();
    
    // Transform to response format
    const response = rebates.map(rebate => toRebateResponse(rebate));
    
    res.json(response);
  } catch (error) {
    next(new DatabaseError('Failed to fetch rebates'));
  }
};

/**
 * Controller to get rebates for a specific student
 */
export const getStudentRebates = async (req, res, next) => {
  try {
    const { roll_no } = req.params;
    
    const rebates = await RebateService.getStudentRebates(roll_no);
    
    // Transform to response format
    const response = rebates.map(rebate => toRebateResponse(rebate));
    
    res.json(response);
  } catch (error) {
    if (error.message === 'STUDENT_NOT_FOUND') {
      next(new NotFoundError('Student not found with the provided roll number', 'student'));
    } else {
      next(new DatabaseError('Failed to fetch student rebates'));
    }
  }
};

/**
 * Controller to check for overlapping rebates
 */
export const checkRebateOverlap = async (req, res, next) => {
  try {
    const { roll_no, start_date, end_date } = req.query;
    
    const hasOverlap = await RebateService.checkRebateOverlap(roll_no, start_date, end_date);
    
    res.json({
      hasOverlap,
      message: hasOverlap 
        ? 'This rebate period overlaps with an existing rebate entry' 
        : 'No overlap found'
    });
  } catch (error) {
    if (error.message === 'STUDENT_NOT_FOUND') {
      next(new NotFoundError('Student not found with the provided roll number', 'student'));
    } else {
      next(new ValidationError(error.message));
    }
  }
};
