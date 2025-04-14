import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { formatDate, calculateRebateDays } from "../utils/dateUtils";

// Define animation variants outside component to prevent recreation on each render
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const Modal = memo(({ studentDetails, rollNo, startDate, endDate, onClose, onConfirm, gatePassNo }) => {
  if (!studentDetails) return null;

  // Use the utility function for calculating rebate days and memoize the result
  const rebateDays = useMemo(() => 
    calculateRebateDays(new Date(startDate), new Date(endDate)),
    [startDate, endDate]
  );

  // Memoize student info to prevent recreating on each render
  const studentInfo = useMemo(() => [
    { label: "Name", value: studentDetails.name },
    { label: "Roll No", value: rollNo },
    { label: "Branch", value: studentDetails.branch },
    { label: "Batch", value: studentDetails.batch },
    { label: "Mob. No.", value: studentDetails.mobile_no },
    { label: "Start Date", value: formatDate(startDate) },
    { label: "End Date", value: formatDate(endDate) },
    { label: "No. of Rebate Days", value: rebateDays },
    { label: "Gate Pass No", value: gatePassNo || "N/A" }
  ], [studentDetails, rollNo, startDate, endDate, rebateDays, gatePassNo]);

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-opacity-30 backdrop-blur-md z-50"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalVariants}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Confirm Rebate Details</h2>
        <div className="space-y-2">
          {studentInfo.map(({ label, value }) => (
            <p key={label} className="text-lg">
              <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button 
            onClick={onClose} 
            className="bg-gray-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </motion.div>
  );
});

Modal.displayName = "Modal";

export default Modal;
