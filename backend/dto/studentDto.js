/**
 * Transform database student record to API response format
 */
const toStudentResponse = (student) => {
  return {
    roll_no: student.roll_no,
    name: student.name,
    branch: student.branch,
    batch: student.batch
  };
};

/**
 * Transform request body to database format
 */
const fromStudentRequest = (requestBody) => {
  return {
    roll_no: requestBody.roll_no,
    name: requestBody.name,
    branch: requestBody.branch,
    batch: requestBody.batch
  };
};

export {
  toStudentResponse,
  fromStudentRequest
}; 