import React, { useState, useEffect } from 'react';
import { fetchStudentDetails, fetchStudentRebates } from '../api';
import { FaSpinner } from 'react-icons/fa';

const StudentDetailsModal = ({ student, onClose }) => {
  const [studentDetails, setStudentDetails] = useState(null);
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('overall');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [details, rebatesData] = await Promise.all([
          fetchStudentDetails(student.roll_no),
          fetchStudentRebates(student.roll_no)
        ]);
        
        if (!details) {
          throw new Error('Student not found');
        }
        
        setStudentDetails(details);
        setRebates(rebatesData || []);
      } catch (err) {
        console.error('Error loading student data:', err);
        setError({
          message: err.message || 'Failed to fetch student data',
          type: err.type || 'UNKNOWN_ERROR'
        });
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, [student.roll_no]);

  const getFilteredRebates = () => {
    if (!rebates || rebates.length === 0) {
      return [];
    }
    
    return rebates.filter(rebate => {
      const startDate = new Date(rebate.start_date);
      
      switch (timePeriod) {
        case 'month':
          return startDate.getMonth() === new Date(selectedMonth).getMonth() &&
                 startDate.getFullYear() === new Date(selectedMonth).getFullYear();
        case 'year':
          return startDate.getFullYear() === parseInt(selectedYear);
        default:
          return true;
      }
    });
  };

  const calculateTotalDays = () => {
    return getFilteredRebates().reduce((total, rebate) => total + rebate.rebate_days, 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
          <FaSpinner className="w-6 h-6 text-blue-900 animate-spin" />
          <p className="text-sm text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-red-500 text-sm text-center mb-3">
            {error.message}
          </div>
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{student.name}</h2>
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-4 text-sm">
                <div className="py-1">
                  <span className="text-gray-600 text-xs block mb-1">Roll No</span>
                  <span className="font-medium text-gray-900">{student.roll_no}</span>
                </div>
                <div className="py-1">
                  <span className="text-gray-600 text-xs block mb-1">Branch</span>
                  <span className="font-medium text-gray-900">{student.branch}</span>
                </div>
                <div className="py-1">
                  <span className="text-gray-600 text-xs block mb-1">Batch</span>
                  <span className="font-medium text-gray-900">{student.batch}</span>
                </div>
                <div className="py-1">
                  <span className="text-gray-600 text-xs block mb-1">Phone</span>
                  <span className="font-medium text-gray-900">{student.mobile_no}</span>
                </div>
                <div className="py-1">
                  <span className="text-gray-600 text-xs block mb-1">Email</span>
                  <span className="font-medium text-gray-900">{student.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Time Period:</span>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="overall">Overall</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              {timePeriod === 'month' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              )}
              {timePeriod === 'year' && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Rebate History */}
          <div className="bg-white rounded border border-gray-300">
            <div className="p-3 border-b border-gray-300">
              <h3 className="text-base font-semibold text-gray-900">Rebate History</h3>
            </div>
            {getFilteredRebates().length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No rebates found for the selected period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-300">
                    {getFilteredRebates().map((rebate, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(rebate.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(rebate.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {rebate.rebate_days}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-200">
                    <tr>
                      <td colSpan="2" className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        Total Days:
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {calculateTotalDays()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;