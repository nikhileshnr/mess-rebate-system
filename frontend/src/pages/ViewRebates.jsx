import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchAllRebates, fetchAllStudents, fetchPriceSettings, updatePriceSettings } from "../api";
import { formatDate } from "../utils/dateUtils";
import ExcelJS from 'exceljs';

// Create memoized loading component for better performance
const LoadingIndicator = memo(() => (
  <div className="text-center mt-4">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
  </div>
));

const ViewRebates = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [activeBranch, setActiveBranch] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [showFeastModal, setShowFeastModal] = useState(false);
  const [feastDate, setFeastDate] = useState(null);
  const [noFeast, setNoFeast] = useState(false);
  const [prices, setPrices] = useState({
    price_per_day: 0,
    gala_dinner_cost: 0
  });
  const [tempPrices, setTempPrices] = useState({
    price_per_day: 0,
    gala_dinner_cost: 0
  });
  const [selectedDate, setSelectedDate] = useState("");
  const entriesPerPage = 100;

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingMore(true);
        setError("");
        const [rebatesResponse, pricesResponse] = await Promise.all([
          fetchAllRebates(),
          fetchPriceSettings()
        ]);
        
        if (!Array.isArray(rebatesResponse)) {
          throw new Error("Invalid rebates data received");
        }
        
        setRebates(rebatesResponse);
        setPrices(pricesResponse);
        setTempPrices(pricesResponse);
      } catch (err) {
        setError(err.response?.status === 401 
          ? "Please log in to view rebates."
          : err.message || "Failed to fetch data. Please try again later."
        );
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    loadData();
  }, []);

  // Get unique values for filters - optimized with proper memoization
  const availableMonths = useMemo(() => {
    const months = new Set();
    rebates.forEach(rebate => {
      if (rebate && rebate.start_date) {
        const date = new Date(rebate.start_date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
      }
    });
    return Array.from(months).sort().reverse();
  }, [rebates]);

  const availableBatches = useMemo(() => {
    return [...new Set(rebates.map(rebate => rebate?.batch).filter(Boolean))].sort();
  }, [rebates]);

  // Filter rebates based on selected filters - optimized dependency array
  const filteredRebates = useMemo(() => {
    return rebates.filter(rebate => {
      if (!rebate || !rebate.start_date) return false;
      
      const startDate = new Date(rebate.start_date);
      const monthYear = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthMatch = !selectedMonth || monthYear === selectedMonth;
      const batchMatch = !selectedBatch || String(rebate.batch) === String(selectedBatch);
      
      return monthMatch && batchMatch;
    });
  }, [rebates, selectedMonth, selectedBatch]);

  // Get branches for tabs from filtered rebates
  const availableBranches = useMemo(() => {
    return [...new Set(filteredRebates.map(rebate => rebate?.branch).filter(Boolean))].sort();
  }, [filteredRebates]);

  // Filter rebates by active branch
  const branchRebates = useMemo(() => {
    if (!activeBranch) return filteredRebates;
    return filteredRebates.filter(rebate => rebate.branch === activeBranch);
  }, [filteredRebates, activeBranch]);

  // Calculate pagination
  const totalPages = useMemo(() => 
    Math.ceil(branchRebates.length / entriesPerPage), 
    [branchRebates.length]
  );
  
  const currentEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return branchRebates.slice(startIndex, endIndex);
  }, [branchRebates, currentPage]);

  const handlePageChange = useCallback((newPage) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  // Handle URL changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (page < 1 || page > totalPages) {
      setSearchParams({ page: '1' });
    }
  }, [searchParams, totalPages, setSearchParams]);

  // Reset active branch when filters change
  useEffect(() => {
    setActiveBranch("");
  }, [selectedMonth, selectedBatch]);

  // Update selectedMonth when date changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${year}-${month}`);
    } else {
      setSelectedMonth("");
    }
  }, [selectedDate]);

  const handleExport = useCallback(async () => {
    if (!selectedMonth || !selectedBatch) return;
    setShowFeastModal(true);
  }, [selectedMonth, selectedBatch]);

  const handleFeastModalClose = useCallback(() => {
    setShowFeastModal(false);
    setFeastDate(null);
    setNoFeast(false);
  }, []);

  const handleFeastModalConfirm = async () => {
    if (!noFeast && !feastDate) {
      setError("Please select a feast date or check 'No Feast'");
      return;
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mess Rebate System';
    workbook.lastModifiedBy = 'Mess Rebate System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Get all students from the selected batch
    const allStudents = await fetchAllStudents(selectedBatch);
    
    // Filter students by the selected batch
    const batchStudents = allStudents.filter(student => String(student.batch) === String(selectedBatch));
    
    // Group students by branch
    const studentsByBranch = {};
    batchStudents.forEach(student => {
      if (!studentsByBranch[student.branch]) {
        studentsByBranch[student.branch] = [];
      }
      studentsByBranch[student.branch].push(student);
    });

    // Group rebates by branch and student
    const rebatesByBranch = {};
    filteredRebates.forEach(rebate => {
      if (!rebatesByBranch[rebate.branch]) {
        rebatesByBranch[rebate.branch] = {};
      }
      if (!rebatesByBranch[rebate.branch][rebate.roll_no]) {
        rebatesByBranch[rebate.branch][rebate.roll_no] = [];
      }
      rebatesByBranch[rebate.branch][rebate.roll_no].push(rebate);
    });

    // Create a worksheet for each branch
    Object.entries(studentsByBranch).forEach(([branch, branchStudents]) => {
      const worksheet = workbook.addWorksheet(branch);

      // Add institute header
      worksheet.mergeCells('A1:L1');
      const instituteHeader = worksheet.getCell('A1');
      instituteHeader.value = 'RAJIV GANDHI INSTITUTE OF PETROLEUM TECHNOLOGY, JAIS, AMETHI';
      instituteHeader.font = { bold: true, size: 14 };
      instituteHeader.alignment = { horizontal: 'center', vertical: 'center' };

      // Set up column headers
      worksheet.getRow(2).values = [
        'S.No',
        'Student Name',
        'Roll No',
        'Date From',
        'Date To',
        'Rebate (Days)',
        'Feast Day\n' + (noFeast ? 'No Feast' : formatDate(feastDate)),
        'Total Days',
        'Feast Amount',
        'Amount\n(@₹' + prices.price_per_day + ')',
        'GST-5%\n(@₹'+Number(prices.price_per_day*0.05).toFixed(2)+')',
        'Total Amount'
      ];

      // Set column widths
      worksheet.getColumn(1).width = 10;  // S.No
      worksheet.getColumn(2).width = 30;  // Student Name
      worksheet.getColumn(3).width = 15;  // Roll No
      worksheet.getColumn(4).width = 15;  // Date From
      worksheet.getColumn(5).width = 15;  // Date To
      worksheet.getColumn(6).width = 15;  // Rebate Days
      worksheet.getColumn(7).width = 15;  // Feast Day
      worksheet.getColumn(8).width = 15;  // Total Days
      worksheet.getColumn(9).width = 15;  // Feast Amount
      worksheet.getColumn(10).width = 15; // Amount
      worksheet.getColumn(11).width = 15; // GST
      worksheet.getColumn(12).width = 15; // Total Amount

      // Style the header row
      const headerRow = worksheet.getRow(2);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      headerRow.height = 40; // Increase height to accommodate two lines

      // Add data rows
      let rowNumber = 3;
      const [year, month] = selectedMonth.split('-');
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const daysInMonth = monthEnd.getDate();

      branchStudents.forEach((student, index) => {
        const studentRebates = rebatesByBranch[branch]?.[student.roll_no] || [];
        
        if (studentRebates.length === 0) {
          // Student has no rebates in this month, so they were present on feast day
          const feastDayPresence = noFeast ? 0 : 1;
          const totalDays = daysInMonth - feastDayPresence;
          const feastAmount = noFeast ? 0 : (feastDayPresence ? prices.gala_dinner_cost : 0);
          const amount = totalDays * prices.price_per_day;
          const gst = amount * 0.05;
          const totalAmount = amount + gst + feastAmount;

          worksheet.addRow([
            index + 1,                    // S.No
            student.name,                 // Student Name
            student.roll_no,              // Roll No
            '',                           // Date From
            '',                           // Date To
            0,                            // Rebate Days
            feastDayPresence,             // Feast Day
            totalDays,                    // Total Days
            feastAmount,                  // Feast Amount
            amount,                       // Amount
            gst,                          // GST
            totalAmount                   // Total Amount
          ]);
        } else {
          // Calculate rebate days within the selected month
          let totalRebateDays = 0;
          let wasAbsentOnFeastDay = false;
          const adjustedRebates = studentRebates.map(rebate => {
            const startDate = new Date(rebate.start_date);
            const endDate = new Date(rebate.end_date);
            
            // Adjust dates to stay within the selected month
            const adjustedStartDate = startDate < monthStart ? monthStart : startDate;
            const adjustedEndDate = endDate > monthEnd ? monthEnd : endDate;
            
            // Calculate days for this rebate period
            const days = Math.ceil((adjustedEndDate - adjustedStartDate) / (1000 * 60 * 60 * 24)) + 1;
            totalRebateDays += days;

            // Check if feast day falls within any rebate period
            if (!noFeast && feastDate) {
              if (feastDate >= adjustedStartDate && feastDate <= adjustedEndDate) {
                wasAbsentOnFeastDay = true;
              }
            }
            
            return {
              ...rebate,
              adjustedStartDate,
              adjustedEndDate,
              days
            };
          });

          const feastDayPresence = noFeast ? 0 : (wasAbsentOnFeastDay ? 0 : 1);
          const totalDays = daysInMonth - totalRebateDays - (noFeast ? 0 : 1);
          const feastAmount = noFeast ? 0 : (feastDayPresence ? prices.gala_dinner_cost : 0);
          const amount = totalDays * prices.price_per_day;
          const gst = amount * 0.05;
          const totalAmount = amount + gst + feastAmount;

          // Add first row with student info and total rebate days
          worksheet.addRow([
            index + 1,                    // S.No
            student.name,                 // Student Name
            student.roll_no,              // Roll No
            formatDate(adjustedRebates[0].adjustedStartDate), // Date From
            formatDate(adjustedRebates[0].adjustedEndDate),   // Date To
            totalRebateDays,              // Rebate Days
            feastDayPresence,             // Feast Day
            totalDays,                    // Total Days
            feastAmount,                  // Feast Amount
            amount,                       // Amount
            gst,                          // GST
            totalAmount                   // Total Amount
          ]);

          // Add additional rows for multiple rebate periods
          if (adjustedRebates.length > 1) {
            for (let i = 1; i < adjustedRebates.length; i++) {
              worksheet.addRow([
                index + 1,                    // S.No
                student.name,                 // Student Name
                student.roll_no,              // Roll No
                formatDate(adjustedRebates[i].adjustedStartDate), // Date From
                formatDate(adjustedRebates[i].adjustedEndDate),   // Date To
                0,                            // Rebate Days
                feastDayPresence,             // Feast Day
                totalDays,                    // Total Days
                feastAmount,                  // Feast Amount
                amount,                       // Amount
                gst,                          // GST
                totalAmount                   // Total Amount
              ]);
            }
          }
        }
      });
    });

    // Generate the Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rebates_${selectedMonth}_batch_${selectedBatch}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    handleFeastModalClose();
  };

  const handlePriceChange = useCallback((e) => {
    const { name, value } = e.target;
    setTempPrices(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  }, []);

  const handleSavePrices = useCallback(async () => {
    try {
      await updatePriceSettings(tempPrices);
      setPrices(tempPrices);
      setIsEditingPrices(false);
    } catch (err) {
      setError("Failed to update prices. Please try again.");
    }
  }, [tempPrices]);

  const handleCancelEdit = useCallback(() => {
    setTempPrices(prices);
    setIsEditingPrices(false);
  }, [prices]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Mess Rebate Entries</h2>
          
          {/* Price Settings Section - Compact and in top right */}
          <div className="flex flex-col items-end gap-2">
            {!isEditingPrices ? (
              <div className="flex flex-col items-end gap-2">
                <span className="text-base font-medium text-gray-700">Price/Day: ₹{prices.price_per_day}</span>
                <span className="text-base font-medium text-gray-700">Gala: ₹{prices.gala_dinner_cost}</span>
                <button
                  onClick={() => setIsEditingPrices(true)}
                  className="px-3 py-1 bg-blue-500 text-white text-base font-medium rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="price_per_day"
                    value={tempPrices.price_per_day}
                    onChange={handlePriceChange}
                    className="w-28 px-3 py-1 text-base font-medium border rounded"
                    min="0"
                    step="0.01"
                    placeholder="Price/Day"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="gala_dinner_cost"
                    value={tempPrices.gala_dinner_cost}
                    onChange={handlePriceChange}
                    className="w-28 px-3 py-1 text-base font-medium border rounded"
                    min="0"
                    step="0.01"
                    placeholder="Gala Cost"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrices}
                    className="px-3 py-1 bg-green-500 text-white text-base font-medium rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-500 text-white text-base font-medium rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <label className="text-sm text-gray-600 whitespace-nowrap">Month:</label>
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 p-1 text-sm focus:ring-0 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <label className="text-sm text-gray-600 whitespace-nowrap">Batch:</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="border-0 p-1 text-sm focus:ring-0 focus:outline-none"
            >
              <option value="">All Batches</option>
              {availableBatches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>

          {/* Export Button - Only show when month and batch are selected */}
          {selectedMonth && selectedBatch && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export to Excel
            </button>
          )}

          <button 
            onClick={() => {
              setSelectedMonth("");
              setSelectedBatch("");
              setActiveBranch("");
            }} 
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear
          </button>
        </div>

        {/* Branch Tabs - Only show when month and batch are selected */}
        {selectedMonth && selectedBatch && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveBranch("")}
              className={`px-4 py-2 rounded ${
                !activeBranch
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              All Branches
            </button>
            {availableBranches.map(branch => (
              <button
                key={branch}
                onClick={() => setActiveBranch(branch)}
                className={`px-4 py-2 rounded ${
                  activeBranch === branch
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 text-center">
              <thead className="sticky top-0 bg-blue-900 text-white z-10">
                <tr>
                  <th className="border px-4 py-2 whitespace-nowrap">S.No</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Roll No</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Name</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Branch</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Batch</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Start Date</th>
                  <th className="border px-4 py-2 whitespace-nowrap">End Date</th>
                  <th className="border px-4 py-2 whitespace-nowrap">Rebate Days</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.length > 0 ? (
                  currentEntries.map((rebate, index) => (
                    <tr key={`${rebate.roll_no}-${rebate.start_date}`} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{rebate.roll_no}</td>
                      <td className="border px-4 py-2">{rebate.name}</td>
                      <td className="border px-4 py-2">{rebate.branch}</td>
                      <td className="border px-4 py-2">{rebate.batch}</td>
                      <td className="border px-4 py-2">{formatDate(rebate.start_date)}</td>
                      <td className="border px-4 py-2">{formatDate(rebate.end_date)}</td>
                      <td className="border px-4 py-2">{rebate.rebate_days}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="border px-4 py-2 text-center">
                      {selectedMonth && selectedBatch ? "No rebate entries found for the selected criteria." : "Please select a month and batch to view rebates."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100"
              >
                Last
              </button>
            </div>
          )}
          {isLoadingMore && <LoadingIndicator />}
        </div>
      </div>

      {/* Feast Day Modal */}
      {showFeastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Select Feast Day</h2>
            
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={noFeast}
                  onChange={(e) => setNoFeast(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>No Feast</span>
              </label>
            </div>

            {!noFeast && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feast Date
                </label>
                <input
                  type="date"
                  value={feastDate ? feastDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFeastDate(new Date(e.target.value))}
                  className="w-full p-2 border rounded"
                  min={`${selectedMonth}-01`}
                  max={`${selectedMonth}-${new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate()}`}
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleFeastModalClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFeastModalConfirm}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ViewRebates);