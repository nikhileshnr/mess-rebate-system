import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchStatistics } from '../api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    year: '',
    branch: '',
    batch: '',
    page: 1,
    limit: 20
  });
  const [sortOrder, setSortOrder] = useState('desc');
  const [allFilterOptions, setAllFilterOptions] = useState({
    years: [],
    branches: [],
    batches: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Only include page and limit parameters if on the users tab
      const apiFilters = {
        ...filters,
        // Only paginate when viewing users tab
        ...(activeTab === 'users' ? { page: filters.page, limit: filters.limit } : { page: undefined, limit: undefined })
      };
      
      const response = await fetchStatistics(apiFilters);
      console.log("Statistics data:", response);
      
      // Update the response to use all available options instead of filtered ones
      const updatedResponse = {
        ...response,
        filters: {
          // Only use the stored options if they exist, otherwise use the response
          years: allFilterOptions.years.length > 0 ? allFilterOptions.years : response.filters.years,
          branches: allFilterOptions.branches.length > 0 ? allFilterOptions.branches : response.filters.branches,
          batches: allFilterOptions.batches.length > 0 ? allFilterOptions.batches : response.filters.batches
        }
      };
      
      setStats(updatedResponse);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters, activeTab]); // Remove allFilterOptions from dependencies

  // Add a separate useEffect to ensure allFilterOptions is only updated once on initial load
  useEffect(() => {
    if (stats && !allFilterOptions.years.length) {
      setAllFilterOptions({
        years: stats.filters.years,
        branches: stats.filters.branches,
        batches: stats.filters.batches
      });
    }
  }, [stats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Reset pagination when filter changes
    if (name !== 'page') {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        page: 1 // Reset to first page
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleTabChange = (tab) => {
    // When changing tabs, special handling for users tab
    if (tab === 'users' && activeTab !== 'users') {
      // When switching to users tab, ensure pagination is applied
      fetchStats();
    } else if (activeTab === 'users' && tab !== 'users') {
      // When leaving users tab, get full data for other tabs
      fetchStats();
    }
    
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Failed to load statistics</div>
      </div>
    );
  }

  // Prepare data for monthly trends chart
  const monthlyTrendsData = {
    labels: stats.monthlyTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Total Rebates',
        data: stats.monthlyTrends.map(trend => trend.totalRebates),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Total Days',
        data: stats.monthlyTrends.map(trend => trend.totalDays),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  // Prepare data for branch statistics
  const branchData = {
    labels: Object.keys(stats.branchStats),
    datasets: [
      {
        label: 'Total Rebates by Branch',
        data: Object.values(stats.branchStats).map(branch => branch.totalRebates),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',   // Red
          'rgba(54, 162, 235, 0.7)',   // Blue
          'rgba(255, 206, 86, 0.7)',   // Yellow
          'rgba(75, 192, 192, 0.7)',   // Teal
          'rgba(153, 102, 255, 0.7)',  // Purple
          'rgba(255, 159, 64, 0.7)',   // Orange
          'rgba(201, 203, 207, 0.7)',  // Gray
          'rgba(255, 99, 71, 0.7)',    // Tomato
          'rgba(46, 204, 113, 0.7)',   // Green
          'rgba(52, 152, 219, 0.7)',   // Light Blue
          'rgba(155, 89, 182, 0.7)',   // Amethyst
          'rgba(241, 196, 15, 0.7)',   // Sunflower
          'rgba(230, 126, 34, 0.7)',   // Carrot
          'rgba(231, 76, 60, 0.7)',    // Pomegranate
          'rgba(26, 188, 156, 0.7)',   // Turquoise
        ],
      }
    ]
  };

  // Prepare data for batch statistics
  const batchData = {
    labels: Object.keys(stats.batchStats),
    datasets: [
      {
        label: 'Average Days by Batch',
        data: Object.values(stats.batchStats).map(batch => batch.averageDaysPerStudent),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      }
    ]
  };

  const renderOverviewTab = () => (
    <div>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Rebates</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.overview.totalRebates}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Days</h3>
          <p className="text-3xl font-bold text-green-600">{stats.overview.totalDays}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Unique Students</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.overview.uniqueStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Avg Days/Student</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.overview.averageDaysPerStudent.toFixed(1)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Monthly Trends</h3>
          <Line data={monthlyTrendsData} options={{ responsive: true }} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Branch Distribution</h3>
          <Pie data={branchData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Average Days by Batch</h3>
          <Bar data={batchData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );

  // Render pagination controls
  const renderPagination = () => {
    if (!stats.pagination) return null;
    
    const { currentPage, totalPages } = stats.pagination;
    
    return (
      <div className="flex justify-center mt-6">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            First
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            Prev
          </button>
          
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            Next
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Render Users Tab Content with sorting toggle and pagination
  const renderUsersTab = () => {
    if (!stats || !stats.allUsers) {
      return (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Users</h3>
          <p className="text-gray-500">No user data available.</p>
        </div>
      );
    }

    // Sort users based on the current sort order
    const sortedUsers = [...stats.allUsers].sort((a, b) => {
      const comparison = a.filteredDays - b.filteredDays;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Users</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="desc">Most Active</option>
              <option value="asc">Least Active</option>
            </select>
          </div>
        </div>
        
        <div className="mt-2 mb-4">
          <span className="text-sm text-gray-600">
            Showing {stats.pagination?.currentPage || 1} of {stats.pagination?.totalPages || 1} pages 
            ({stats.pagination?.totalItems || sortedUsers.length} total items)
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Roll No</th>
                <th className="px-6 py-3 text-left">Branch</th>
                <th className="px-6 py-3 text-left">Batch</th>
                <th className="px-6 py-3 text-left">Total Rebates</th>
                <th className="px-6 py-3 text-left">Total Days</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => {
                const rank = stats.pagination 
                  ? (stats.pagination.currentPage - 1) * stats.pagination.itemsPerPage + index + 1
                  : index + 1;
                  
                return (
                  <tr key={user.roll_no} className="border-t">
                    <td className="px-6 py-4">{rank}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.roll_no}</td>
                    <td className="px-6 py-4">{user.branch}</td>
                    <td className="px-6 py-4">{user.batch}</td>
                    <td className="px-6 py-4">{user.filteredRebates}</td>
                    <td className="px-6 py-4">{user.filteredDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {renderPagination()}
      </div>
    );
  };

  // Render Branch Statistics Tab Content
  const renderBranchStatsTab = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Branch-wise Statistics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">Branch</th>
              <th className="px-6 py-3 text-left">Total Rebates</th>
              <th className="px-6 py-3 text-left">Total Days</th>
              <th className="px-6 py-3 text-left">Unique Students</th>
              <th className="px-6 py-3 text-left">Avg Days/Student</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.branchStats).map(([branch, data]) => (
              <tr key={branch} className="border-t">
                <td className="px-6 py-4">{branch}</td>
                <td className="px-6 py-4">{data.totalRebates}</td>
                <td className="px-6 py-4">{data.totalDays}</td>
                <td className="px-6 py-4">{data.uniqueStudents}</td>
                <td className="px-6 py-4">{data.averageDaysPerStudent.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Batch Statistics Tab Content
  const renderBatchStatsTab = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Batch-wise Statistics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">Batch</th>
              <th className="px-6 py-3 text-left">Total Rebates</th>
              <th className="px-6 py-3 text-left">Total Days</th>
              <th className="px-6 py-3 text-left">Unique Students</th>
              <th className="px-6 py-3 text-left">Avg Days/Student</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.batchStats).map(([batch, data]) => (
              <tr key={batch} className="border-t">
                <td className="px-6 py-4">{batch}</td>
                <td className="px-6 py-4">{data.totalRebates}</td>
                <td className="px-6 py-4">{data.totalDays}</td>
                <td className="px-6 py-4">{data.uniqueStudents}</td>
                <td className="px-6 py-4">{data.averageDaysPerStudent.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'branchStats':
        return renderBranchStatsTab();
      case 'batchStats':
        return renderBatchStatsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mess Rebate Statistics</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <select
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">All Years</option>
          {stats.filters.years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          name="branch"
          value={filters.branch}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">All Branches</option>
          {stats.filters.branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select
          name="batch"
          value={filters.batch}
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">All Batches</option>
          {stats.filters.batches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => handleTabChange('branchStats')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'branchStats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Branch Statistics
          </button>
          <button
            onClick={() => handleTabChange('batchStats')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'batchStats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Batch Statistics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Statistics;