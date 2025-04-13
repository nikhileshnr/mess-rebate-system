import { getAllStudents as getAllStudentsModel, getStudentById } from '../models/studentModel.js';
import { fetchStudentRebates } from '../models/rebateModel.js';
import { createDatabaseError, createNotFoundError } from '../utils/errorHandler.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const students = await getAllStudentsModel();
    res.json(students);
  } catch (error) {
    next(createDatabaseError('Failed to fetch students'));
  }
};

export const getStudentByRollNo = async (req, res, next) => {
  try {
    const { rollNo } = req.params;
    
    const student = await getStudentById(rollNo);
    if (!student) {
      return next(createNotFoundError('Student not found'));
    }

    const rebates = await fetchStudentRebates(rollNo);

    res.json({
      ...student,
      rebates
    });
  } catch (error) {
    next(createDatabaseError('Failed to fetch student details'));
  }
}; 