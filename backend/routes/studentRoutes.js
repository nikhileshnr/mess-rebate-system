import express from 'express';
import { getAllStudents, getStudentByRollNo } from '../controllers/studentController.js';

const router = express.Router();

// Get all students
router.get('/', getAllStudents);

// Get student by roll number
router.get('/:rollNo', getStudentByRollNo);

export default router; 