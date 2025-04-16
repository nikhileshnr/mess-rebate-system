/**
 * Transform database rebate record to API response format
 */
const toRebateResponse = (rebate) => {
  return {
    id: rebate.id,
    roll_no: rebate.roll_no,
    student_name: rebate.name,
    branch: rebate.branch,
    batch: rebate.batch,
    start_date: rebate.start_date,
    end_date: rebate.end_date,
    days: rebate.rebate_days,
    gate_pass_no: rebate.gate_pass_no || "N/A"
  };
};

/**
 * Transform request body to database format
 */
const fromRebateRequest = (requestBody) => {
  return {
    roll_no: requestBody.roll_no,
    start_date: requestBody.start_date,
    end_date: requestBody.end_date,
    rebate_days: requestBody.rebate_days,
    gate_pass_no: requestBody.gate_pass_no
  };
};

export {
  toRebateResponse,
  fromRebateRequest
}; 