import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAllRebates } from "../api";
import { formatDate } from "../utils/dateUtils";

const RebateTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [rebates, setRebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const entriesPerPage = 100;

  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    const loadRebates = async () => {
      try {
        setIsLoadingMore(true);
        const data = await fetchAllRebates();
        setRebates(data);
      } catch (err) {
        setError(err.response?.status === 401 
          ? "Please log in to view rebates."
          : "Failed to fetch rebate data. Please try again later."
        );
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    };

    loadRebates();
  }, []);

  const filterOptions = useMemo(() => {
    if (!filterColumn) return [];
    return [...new Set(rebates.map(rebate => rebate[filterColumn]))];
  }, [filterColumn, rebates]);

  const filteredRebates = useMemo(() => {
    if (!filterValue) return rebates;
    return rebates.filter(rebate => 
      String(rebate[filterColumn]).toLowerCase() === filterValue.toLowerCase()
    );
  }, [rebates, filterColumn, filterValue]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRebates.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredRebates.slice(startIndex, endIndex);

  const handleFilterChange = (e) => {
    setFilterColumn(e.target.value);
    setFilterValue("");
    // Reset to first page when filter changes
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle URL changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (page < 1 || page > totalPages) {
      setSearchParams({ page: '1' });
    }
  }, [searchParams, totalPages, setSearchParams]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-4">
        <h2 className="text-2xl font-semibold mb-4">Mess Rebate Entries</h2>
        <div className="flex flex-wrap gap-4">
          <select value={filterColumn} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">Choose</option>
            <option value="roll_no">Roll No</option>
            <option value="name">Name</option>
            <option value="branch">Branch</option>
            <option value="batch">Batch</option>
          </select>
          <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="border p-2 rounded" disabled={!filterColumn}>
            <option value="">All</option>
            {filterOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button onClick={() => { setFilterColumn(""); setFilterValue(""); }} className="border p-2 rounded bg-red-500 text-white">Clear Filters</button>
        </div>
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
                      <td className="border px-4 py-2">{startIndex + index + 1}</td>
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
                    <td colSpan="8" className="border px-4 py-2 text-center">No rebate entries found.</td>
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
          {isLoadingMore && (
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RebateTable;
