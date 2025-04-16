import React, { useState, useEffect, useCallback } from 'react';
import { fetchRebatesByMonth, updateRebates } from '../api';
import { toast } from 'react-toastify';

const EditRebates = () => {
  const [rebates, setRebates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [modifiedRebates, setModifiedRebates] = useState({});
  const [verifiedRebates, setVerifiedRebates] = useState(
    JSON.parse(localStorage.getItem('verifiedRebates') || '[]')
  );
  const [dateErrors, setDateErrors] = useState({});

  // Fetch rebates when year/month change
  useEffect(() => {
    const loadRebates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchRebatesByMonth(year, month);
        
        // Transform to include verified status from localStorage
        const rebatesWithVerification = data.map(rebate => ({
            ...rebate,
          verified: verifiedRebates.includes(rebate.id),
          // Store original dates for comparison later
          _originalStartDate: rebate.start_date,
          _originalEndDate: rebate.end_date,
          // Format dates for display (dd/mm/yyyy)
          displayStartDate: formatDateToDisplay(rebate.start_date),
          displayEndDate: formatDateToDisplay(rebate.end_date)
        }));
        
        setRebates(rebatesWithVerification);
        // Clear modified rebates when changing month/year
        setModifiedRebates({});
        setDateErrors({});
      } catch (err) {
        console.error("Error fetching rebates:", err);
        setError(err.message || "Failed to load rebates");
        toast.error("Failed to load rebates");
      } finally {
        setIsLoading(false);
      }
    };

    if (year && month) {
      loadRebates();
    }
  }, [year, month]);

  // Format date from ISO/SQL date to DD/MM/YYYY for display
  const formatDateToDisplay = (dateStr) => {
    if (!dateStr) return '';
    
    try {
      // Create a date object, handling both ISO date strings and SQL date strings
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      // Format as DD/MM/YYYY using built-in methods
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

  // Parse date string from DD/MM/YYYY to YYYY-MM-DD format
  const parseDateString = (dateStr) => {
    try {
      if (!dateStr) return '';
      
      // Remove any extra spaces and normalize delimiters
      dateStr = dateStr.trim().replace(/-/g, '/');
      
      // Parse date with format DD/MM/YYYY
      const parts = dateStr.split('/');
      if (parts.length !== 3) return '';
      
      // Extract day, month, year as numbers
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      // Basic validation
      if (
        isNaN(day) || day < 1 || day > 31 ||
        isNaN(month) || month < 1 || month > 12 ||
        isNaN(year) || year < 2000 || year > 2100
      ) {
        return '';
      }
      
      // Create a YYYY-MM-DD string
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch (e) {
      console.error("Error parsing date:", e);
      return '';
    }
  };

  // Validate date input (dd/mm/yyyy format)
  const validateDateInput = (dateStr, rebateId, fieldName) => {
    // Clear any existing error for this field
    setDateErrors(prev => ({
      ...prev,
      [`${rebateId}_${fieldName}`]: null
    }));

    // If empty, show error
    if (!dateStr.trim()) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: "Required"
      }));
      return false;
    }
    
    // Check format using regex: dd/mm/yyyy
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!dateRegex.test(dateStr)) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: "Use format: dd/mm/yyyy"
      }));
      return false;
    }
    
    // Parse the date parts
    const [_, day, month, year] = dateStr.match(dateRegex);
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    // Check ranges
    if (dayNum < 1 || dayNum > 31) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: "Invalid day"
      }));
      return false;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: "Invalid month"
      }));
      return false;
    }
    
    if (yearNum < 2000 || yearNum > 2100) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: "Invalid year"
      }));
      return false;
    }
    
    // Check month/day validity (e.g., April has 30 days)
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > daysInMonth) {
      setDateErrors(prev => ({
        ...prev,
        [`${rebateId}_${fieldName}`]: `${monthNum} has ${daysInMonth} days`
      }));
      return false;
    }
    
    return true;
  };

  // Handle date input changes
  const handleDateChange = useCallback((id, field, value) => {
    // Get the rebate object for this ID
    const currentRebate = rebates.find(r => r.id === id);
    
    // Update displayable version in the rebates state
    setRebates(prev => prev.map(rebate => 
      rebate.id === id 
        ? { ...rebate, [`display${field}`]: value }
        : rebate
    ));
    
    // Validate the input
    const isValid = validateDateInput(value, id, field);
    
    if (isValid) {
      // If valid, convert from DD/MM/YYYY to YYYY-MM-DD format
      const isoDate = parseDateString(value);
      console.log(`DEBUG - Parsed date for ${field}: ${value} -> ${isoDate}`);
      
      setModifiedRebates(prev => {
        // Get the existing modified rebate or create a base one from current rebate data
        const existingData = prev[id] || {
          id: id,
          roll_no: currentRebate.roll_no
        };
        
        // Only update the specific field that changed (start_date or end_date)
        // Don't include the unchanged field
        return {
          ...prev,
          [id]: {
            ...existingData,
            [field === 'StartDate' ? 'start_date' : 'end_date']: isoDate
          }
        };
      });
    }
  }, [rebates]);

  // Toggle verified status
  const handleVerifyToggle = useCallback((id) => {
    // Update the verified rebates array in localStorage
    setVerifiedRebates(prev => {
      const newVerifiedRebates = prev.includes(id)
        ? prev.filter(rebateId => rebateId !== id)
        : [...prev, id];
      
      // Save to localStorage
      localStorage.setItem('verifiedRebates', JSON.stringify(newVerifiedRebates));
      return newVerifiedRebates;
    });
    
    // Update the rebates state
    setRebates(prev => prev.map(rebate => 
      rebate.id === id 
        ? { ...rebate, verified: !rebate.verified }
        : rebate
    ));
  }, []);

  // Validate all dates before saving
  const validateAllDates = () => {
    let isValid = true;
    const errors = {};
    
    Object.values(modifiedRebates).forEach(rebate => {
      if (!rebate) return;
      
      // Get the corresponding rebate from state for display values
      const stateRebate = rebates.find(r => r.id === rebate.id);
      if (!stateRebate) return;
      
      // Skip verified rebates
      if (stateRebate.verified) return;
      
      // Get the original unmodified date if not provided in the update
      const effectiveStartDate = rebate.start_date || stateRebate._originalStartDate;
      const effectiveEndDate = rebate.end_date || stateRebate._originalEndDate;
      
      // Validate start date if it was modified
      if (rebate.start_date) {
        const startDateValid = validateDateInput(
          stateRebate.displayStartDate,
          rebate.id,
          'StartDate'
        );
        if (!startDateValid) {
          isValid = false;
          errors[`${rebate.id}_StartDate`] = "Invalid start date";
        }
      }
      
      // Validate end date if it was modified
      if (rebate.end_date) {
        const endDateValid = validateDateInput(
          stateRebate.displayEndDate,
          rebate.id,
          'EndDate'
        );
        if (!endDateValid) {
          isValid = false;
          errors[`${rebate.id}_EndDate`] = "Invalid end date";
        }
      }
      
      // If both dates are valid (original or modified), check that end date is after start date
      if (effectiveStartDate && effectiveEndDate) {
        const startDate = new Date(effectiveStartDate);
        const endDate = new Date(effectiveEndDate);
        
        if (endDate <= startDate) {
          isValid = false;
          errors[`${rebate.id}_EndDate`] = "End date must be after start date";
        }
      }
    });
    
    setDateErrors(errors);
    return isValid;
  };

  // Save changes to database
  const handleSave = async () => {
    // Validate all dates before saving
    if (!validateAllDates()) {
      toast.error("Please fix the date errors before saving");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Filter out verified rebates and prepare payload for update
      const rebatesToUpdate = Object.values(modifiedRebates)
        .filter(rebate => {
          if (!rebate) return false;
          
          // Skip verified rebates
          const stateRebate = rebates.find(r => r.id === rebate.id);
          if (stateRebate?.verified) return false;
          
          // Ensure roll_no and at least one date field is present
          if (!rebate.roll_no || (!rebate.start_date && !rebate.end_date)) {
            console.log('DEBUG - Skipping rebate with missing required fields:', rebate);
            return false;
          }
          
          return true;
        })
        .map(rebate => {
          const stateRebate = rebates.find(r => r.id === rebate.id);
          
          // Get required fields from the current state if not provided in the update
          let start_date = rebate.start_date || stateRebate?._originalStartDate;
          let end_date = rebate.end_date || stateRebate?._originalEndDate;
          
          // Remove time component if present
          if (typeof start_date === 'string' && start_date.includes('T')) {
            start_date = start_date.split('T')[0];
          }
          
          if (typeof end_date === 'string' && end_date.includes('T')) {
            end_date = end_date.split('T')[0];
          }
          
          // Return the rebate with clean date formats
          const updatePayload = {
            id: rebate.id,
            roll_no: rebate.roll_no
          };
          
          // Only include fields that were changed in the modified rebate
          if (rebate.start_date) {
            updatePayload.start_date = start_date;
          }
          
          if (rebate.end_date) {
            updatePayload.end_date = end_date;
          }
          
          console.log('DEBUG - Update payload:', updatePayload);
          return updatePayload;
        });
      
      console.log('DEBUG - Rebates to update:', rebatesToUpdate);
      
      if (rebatesToUpdate.length === 0) {
        toast.info("No changes to save");
        setIsLoading(false);
        return;
      }
      
      // Update rebates
      const result = await updateRebates(rebatesToUpdate);
      toast.success("Rebates updated successfully");
      
      // Refresh data
      const data = await fetchRebatesByMonth(year, month);
      
      // Transform to include verified status from localStorage
      const rebatesWithVerification = data.map(rebate => ({
          ...rebate,
        verified: verifiedRebates.includes(rebate.id),
        // Store original dates for comparison later
        _originalStartDate: rebate.start_date,
        _originalEndDate: rebate.end_date,
        // Format dates for display (dd/mm/yyyy)
        displayStartDate: formatDateToDisplay(rebate.start_date),
        displayEndDate: formatDateToDisplay(rebate.end_date)
      }));
      
      setRebates(rebatesWithVerification);
      // Clear modified rebates after successful save
      setModifiedRebates({});
    } catch (err) {
      console.error("Error updating rebates:", err);
      setError(err.message || "Failed to update rebates");
      toast.error("Failed to update rebates: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Rebates</h1>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Month</h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="mb-6">
        <button 
          onClick={handleSave} 
          disabled={isLoading || Object.keys(modifiedRebates).length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        
        {Object.keys(modifiedRebates).length > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {Object.keys(modifiedRebates).filter(id => {
              const rebate = rebates.find(r => r.id === id);
              return rebate && !rebate.verified;
            }).length} changes to save
          </span>
        )}
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
      
      {/* Rebates Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {isLoading && rebates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading rebates...</div>
        ) : rebates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No rebates found for the selected month</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verify</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rebates.map((rebate) => (
                  <tr key={rebate.id} className={rebate.verified ? "bg-green-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={rebate.verified || false}
                        onChange={() => handleVerifyToggle(rebate.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{rebate.roll_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{rebate.student_name || rebate.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rebate.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      {rebate.verified ? (
                      rebate.displayStartDate
                      ) : (
                      <div>
                          <input 
                            type="text" 
                          value={rebate.displayStartDate || ''}
                          onChange={(e) => handleDateChange(rebate.id, 'StartDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                          className={`w-32 p-1 border rounded text-center ${
                            dateErrors[`${rebate.id}_StartDate`] ? 'border-red-500' : ''
                          }`}
                        />
                        {dateErrors[`${rebate.id}_StartDate`] && (
                          <div className="text-xs text-red-500">
                            {dateErrors[`${rebate.id}_StartDate`]}
                          </div>
                        )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rebate.verified ? (
                      rebate.displayEndDate
                      ) : (
                      <div>
                          <input 
                            type="text" 
                          value={rebate.displayEndDate || ''}
                          onChange={(e) => handleDateChange(rebate.id, 'EndDate', e.target.value)}
                          placeholder="dd/mm/yyyy"
                          className={`w-32 p-1 border rounded text-center ${
                            dateErrors[`${rebate.id}_EndDate`] ? 'border-red-500' : ''
                          }`}
                        />
                        {dateErrors[`${rebate.id}_EndDate`] && (
                          <div className="text-xs text-red-500">
                            {dateErrors[`${rebate.id}_EndDate`]}
                          </div>
                        )}
                        </div>
                      )}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">{rebate.rebate_days || rebate.days}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EditRebates; 