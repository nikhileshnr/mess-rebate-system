import React, { useState } from "react";
import { applyRebate, fetchStudentDetails, checkOverlappingRebates } from "../api";
import { calculateRebateDays } from "../utils/dateUtils";
import { FaSpinner } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import Modal from "../components/Modal";

const CreateRebate = () => {
  const [rollNo, setRollNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleRollNoChange = async (e) => {
    const roll = e.target.value.toUpperCase();
    setRollNo(roll);
    setError(""); // Clear error when user starts typing
    setStudentDetails(null); // Reset student details when roll number changes
    
    if (roll.length >= 8) {
      setIsValidating(true);
      try {
        const data = await fetchStudentDetails(roll);
        if (data && data.roll_no) {
          setStudentDetails(data);
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
        setStudentDetails(null);
      } finally {
        setIsValidating(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!rollNo || !startDate || !endDate) {
      setError("Please enter all details");
      return;
    }

    // Check if student details are valid
    if (!studentDetails || !studentDetails.roll_no) {
      setError("Invalid Roll Number. Please check and try again.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError("Invalid date range");
      return;
    }

    setError("");
    
    // Check for overlapping rebates before showing modal
    try {
      const overlapCheck = await checkOverlappingRebates(rollNo, startDate, endDate);
      if (overlapCheck.hasOverlap) {
        setError(overlapCheck.message);
        return;
      }
      
      // Only show modal if no overlap is found
      setShowModal(true);
    } catch (err) {
      setError(err.message || "Error checking for overlapping rebates");
    }
  };

  const confirmRebate = async () => {
    setShowModal(false);
    const rebateDays = calculateRebateDays(new Date(startDate), new Date(endDate));
    try {
      await applyRebate({ roll_no: rollNo, start_date: startDate, end_date: endDate, rebate_days: rebateDays });
      alert("Rebate Applied Successfully!");
      // Clear all input fields after successful submission
      setRollNo("");
      setStartDate("");
      setEndDate("");
      setStudentDetails(null);
      setError("");
    } catch (err) {
      // Display the specific error message from the backend
      setError(err.message || "Error submitting rebate. Please try again.");
    }
  };

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4 text-center">Enter Rebate Details</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <label className="block mb-2">Roll Number:</label>
        <div className="relative">
          <input 
            type="text" 
            value={rollNo} 
            onChange={handleRollNoChange} 
            className="w-full border p-2 rounded pr-8" 
            placeholder="Enter Roll No"
          />
          {isValidating && (
            <FaSpinner className="absolute right-2 top-2 text-gray-400 animate-spin" />
          )}
        </div>
        <label className="block mt-4">Start Date:</label>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
          className="w-full border p-2 rounded"
        />
        <label className="block mt-4">End Date:</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
          className="w-full border p-2 rounded"
        />
        <button 
          onClick={handleSubmit} 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          Submit
        </button>
      </div>

      {/* Modal with AnimatePresence for smooth exit animation */}
      <AnimatePresence>
        {showModal && studentDetails && studentDetails.roll_no && (
          <Modal
            studentDetails={studentDetails}
            rollNo={rollNo}
            startDate={startDate}
            endDate={endDate}
            onClose={() => setShowModal(false)}
            onConfirm={confirmRebate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateRebate; 