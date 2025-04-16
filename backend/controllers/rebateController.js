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
import { pool, executeQuery } from '../config/db.js';

/**
 * Controller to create a new rebate entry
 */
export const createRebateEntry = async (req, res, next) => {
  try {
    const { roll_no, start_date, end_date, rebate_days, gate_pass_no, _validate_only } = req.body;
    
    // Validate gate_pass_no is present and in correct format
    if (!gate_pass_no) {
      return next(new ValidationError('Gate Pass Number is required'));
    }
    
    // Validate gate_pass_no format (A-31287 pattern)
    if (!gate_pass_no.match(/^[A-Z]-\d+$/)) {
      return next(new ValidationError('Gate Pass Number must be in the format A-31287'));
    }
    
    // Validate gate_pass_no length
    if (gate_pass_no.length > 10) {
      return next(new ValidationError('Gate Pass Number must not exceed 10 characters'));
    }
    
    // Check for duplicate gate pass
    try {
      // This SQL checks if the gate pass number already exists
      const checkDuplicateSql = "SELECT COUNT(*) as count FROM rebates WHERE gate_pass_no = ?";
      const results = await executeQuery(checkDuplicateSql, [gate_pass_no]);
      
      if (results[0].count > 0) {
        return next(new ValidationError('Gate Pass Number already exists. Please use a different one.', 'gate_pass_no'));
      }
      
      // If this is just a validation check, return success without creating the rebate
      if (_validate_only) {
        return res.status(200).json({
          success: true,
          message: 'Validation passed. Gate pass number is available.',
          validated: true
        });
      }
    } catch (error) {
      console.error("Error checking duplicate gate pass:", error);
      // If this is a validation-only request, return the error
      if (_validate_only) {
        return next(new DatabaseError('Failed to validate gate pass number. Please try again.'));
      }
      // Otherwise, continue with the try/catch flow
    }
    
    // Service layer handles business logic and validation
    const result = await RebateService.createRebate(roll_no, start_date, end_date, rebate_days, gate_pass_no);
    
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
    } else if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage && error.sqlMessage.includes('gate_pass_no')) {
      // Handle the duplicate gate pass number error
      next(new ValidationError('Gate Pass Number already exists. Please use a different one.', 'gate_pass_no'));
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
    const { year, month } = req.query;
    
    let rebates;
    
    // If year and month are provided, filter by month
    if (year && month) {
      rebates = await RebateService.getRebatesByMonth(parseInt(year), parseInt(month));
    } else {
      // Otherwise, get all rebates
      rebates = await RebateService.getAllRebates();
    }
    
    // Transform to response format
    const response = rebates.map(rebate => toRebateResponse(rebate));
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching rebates:', error);
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

/**
 * Controller to update multiple rebate entries
 */
export const updateRebates = async (req, res, next) => {
  try {
    const { rebates } = req.body;
    
    if (!rebates || !Array.isArray(rebates) || rebates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rebates provided for update'
      });
    }
    
    // Call service to update the rebates
    const result = await RebateService.updateMultipleRebates(rebates);
    
    res.json({
      success: true,
      message: 'Rebates updated successfully',
      updatedCount: result.length
    });
  } catch (error) {
    console.error('Error updating rebates:', error);
    if (error.message === 'REBATE_NOT_FOUND') {
      next(new NotFoundError('One or more rebate entries not found', 'rebate'));
    } else if (error.message === 'INVALID_DATE_RANGE') {
      next(new ValidationError('End date must be after start date'));
    } else if (error.message === 'INVALID_DATE_FORMAT') {
      next(new ValidationError('Invalid date format provided'));
    } else if (error.message === 'INVALID_ID_FORMAT') {
      next(new ValidationError('Invalid rebate ID format'));
    } else {
      next(new DatabaseError('Failed to update rebate entries: ' + error.message));
    }
  }
};
