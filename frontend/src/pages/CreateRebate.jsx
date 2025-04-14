import React, { useState, useEffect } from "react";
import { applyRebate, fetchStudentDetails, checkOverlappingRebates } from "../api";
import { calculateRebateDays } from "../utils/dateUtils";
import { FaSpinner } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import Modal from "../components/Modal";

const CreateRebate = () => {
  const [rollNo, setRollNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [gatePassPrefix, setGatePassPrefix] = useState("");
  const [gatePassNumber, setGatePassNumber] = useState("");
  const [studentDetails, setStudentDetails] = useState(null);
  const [error, setError] = useState("");
  const [prefixError, setPrefixError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Combined gate pass for sending to backend
  const gatePassNo = gatePassPrefix && gatePassNumber 
    ? `${gatePassPrefix}-${gatePassNumber}`
    : "";

  // Validate inputs whenever they change
  useEffect(() => {
    validateGatePass();
  }, [gatePassPrefix, gatePassNumber]);

  const validateGatePass = () => {
    let isValid = true;
    
    // Validate prefix (one uppercase letter)
    if (gatePassPrefix) {
      if (!/^[A-Z]$/.test(gatePassPrefix)) {
        setPrefixError("Must be one uppercase letter");
        isValid = false;
      } else {
        setPrefixError("");
      }
    } else {
      setPrefixError("");
    }
    
    // Validate number (non-empty numeric string)
    if (gatePassNumber) {
      if (!/^\d+$/.test(gatePassNumber)) {
        setNumberError("Must contain only digits");
        isValid = false;
      } else {
        setNumberError("");
      }
    } else {
      setNumberError("");
    }
    
    // Check combined length (10 chars max including hyphen)
    if (gatePassPrefix && gatePassNumber) {
      const combined = `${gatePassPrefix}-${gatePassNumber}`;
      if (combined.length > 10) {
        setNumberError("Combined gate pass exceeds 10 characters");
        isValid = false;
      }
    }
    
    return isValid;
  };

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
    // Validate all required fields
    if (!rollNo || !startDate || !endDate || !gatePassNo) {
      setError("Please enter all required details");
      return;
    }

    // Validate gate pass format
    if (!validateGatePass()) {
      setError("Please fix the errors in the Gate Pass fields");
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
    
    try {
      // Check for overlapping rebates before showing modal
      const overlapCheck = await checkOverlappingRebates(rollNo, startDate, endDate);
      if (overlapCheck.hasOverlap) {
        setError(overlapCheck.message);
        return;
      }
      
      // Pre-validate gate pass for duplicates by attempting a dry-run submission
      const rebateDays = calculateRebateDays(new Date(startDate), new Date(endDate));
      try {
        // Add _check=true query parameter to indicate this is just a validation check
        await applyRebate({ 
          roll_no: rollNo, 
          start_date: startDate, 
          end_date: endDate, 
          rebate_days: rebateDays,
          gate_pass_no: gatePassNo,
          _validate_only: true // This is a flag we'll check in the backend
        });
        
        // If we get here, it means no duplicate was found, so show the modal
        setShowModal(true);
      } catch (err) {
        // Check if it's a gate pass error and highlight the field with red border but don't show field-level error
        if (err.code === 'VALIDATION_ERROR' && err.field === 'gate_pass_no') {
          // Add red border to the field by setting numberError to a space (this will trigger the red border CSS)
          setNumberError(" ");
          // Only show the error at the top of the form
          setError("Gate Pass Number already exists. Please use a different one.");
        } else {
          // Display any other error message from the backend
          setError(err.message || "Error validating rebate data. Please try again.");
        }
      }
    } catch (err) {
      setError(err.message || "Error checking for overlapping rebates");
    }
  };

  const confirmRebate = async () => {
    setShowModal(false);
    const rebateDays = calculateRebateDays(new Date(startDate), new Date(endDate));
    try {
      await applyRebate({ 
        roll_no: rollNo, 
        start_date: startDate, 
        end_date: endDate, 
        rebate_days: rebateDays,
        gate_pass_no: gatePassNo
      });
      alert("Rebate Applied Successfully!");
      // Clear all input fields after successful submission
      setRollNo("");
      setStartDate("");
      setEndDate("");
      setGatePassPrefix("");
      setGatePassNumber("");
      setStudentDetails(null);
      setError("");
    } catch (err) {
      // Check if it's a gate pass error and highlight the field with red border but don't show field-level error
      if (err.code === 'VALIDATION_ERROR' && err.field === 'gate_pass_no') {
        // Add red border to the field by setting numberError to a space (this will trigger the red border CSS)
        setNumberError(" ");
        // Only show the error at the top of the form
        setError("Gate Pass Number already exists. Please use a different one.");
      } else {
        // Display the specific error message from the backend
        setError(err.message || "Error submitting rebate. Please try again.");
      }
      
      // Scroll to the top to make the error visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        <label className="block mt-4">Gate Pass No:</label>
        <div className="flex items-center space-x-2">
          <div className="w-1/4">
            <input 
              type="text" 
              value={gatePassPrefix} 
              onChange={(e) => setGatePassPrefix(e.target.value.toUpperCase())}
              className={`w-full border p-2 rounded text-center ${prefixError ? 'border-red-500' : ''}`}
              placeholder="A"
              maxLength={1}
              required
            />
            {prefixError && <p className="text-red-500 text-xs mt-1">{prefixError}</p>}
          </div>
          
          <div className="flex items-center justify-center">
            <span className="text-lg font-bold">-</span>
          </div>
          
          <div className="flex-1">
            <input 
              type="text" 
              value={gatePassNumber} 
              onChange={(e) => setGatePassNumber(e.target.value)}
              className={`w-full border p-2 rounded ${numberError ? 'border-red-500' : ''}`}
              placeholder="31287"
              required
            />
            {numberError && numberError.trim() !== "" && <p className="text-red-500 text-xs mt-1">{numberError}</p>}
          </div>
        </div>
        
        <button 
          onClick={handleSubmit} 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={!rollNo || !startDate || !endDate || !gatePassPrefix || !gatePassNumber || !!prefixError || !!numberError}
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
            gatePassNo={gatePassNo}
            onClose={() => setShowModal(false)}
            onConfirm={confirmRebate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateRebate; 