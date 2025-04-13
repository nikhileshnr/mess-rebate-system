import * as StudentRepository from '../repositories/studentRepository.js';

/**
 * Get all students
 */
const getAllStudents = async () => {
  return await StudentRepository.getAllStudents();
};

/**
 * Get a student by roll number
 */
const getStudentByRollNo = async (roll_no) => {
  const student = await StudentRepository.getStudentByRollNo(roll_no);
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND');
  }
  return student;
};

export {
  getAllStudents,
  getStudentByRollNo
}; 