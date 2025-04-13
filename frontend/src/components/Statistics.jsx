import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStatistics } from '../api';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
} from 'chart.js';

// Register ChartJS components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

// Chart options defined outside component to prevent recreation
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Rebate Statistics'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: '',
    branch: '',
    batch: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    branches: [],
    batches: [],
    years: []
  });

  // Fetch statistics data
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchStatistics(filters);
      setStats(response);
      setAvailableFilters(response.filters);
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats when filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Prepare data for branch chart
  const branchChartData = useMemo(() => {
    if (!stats || !stats.branchStats) return null;
    
    return {
      labels: stats.branchStats.map(branch => branch.name),
      datasets: [
        {
          label: 'Total Rebate Days',
          data: stats.branchStats.map(branch => branch.totalDays),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Average Days per Student',
          data: stats.branchStats.map(branch => branch.averageDaysPerStudent),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [stats?.branchStats]);

  // Prepare data for batch chart
  const batchChartData = useMemo(() => {
    if (!stats || !stats.batchStats) return null;
    
    return {
      labels: stats.batchStats.map(batch => batch.name),
      datasets: [
        {
          label: 'Total Rebate Days',
          data: stats.batchStats.map(batch => batch.totalDays),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Average Days per Student',
          data: stats.batchStats.map(batch => batch.averageDaysPerStudent),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [stats?.batchStats]);

  // Prepare data for monthly chart
  const monthlyChartData = useMemo(() => {
    if (!stats || !stats.monthlyStats) return null;
    
    return {
      labels: stats.monthlyStats.map(month => month.month),
      datasets: [
        {
          label: 'Total Rebate Days',
          data: stats.monthlyStats.map(month => month.totalDays),
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1
        }
      ]
    };
  }, [stats?.monthlyStats]);

  // Prepare data for yearly chart
  const yearlyChartData = useMemo(() => {
    if (!stats || !stats.yearStats) return null;
    
    return {
      labels: stats.yearStats.map(year => year.year),
      datasets: [
        {
          label: 'Total Rebate Days',
          data: stats.yearStats.map(year => year.totalDays),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Average Days per Student',
          data: stats.yearStats.map(year => year.averageDaysPerStudent),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [stats?.yearStats]);

  // Memoize filter selects to prevent unnecessary re-renders
  const filterSelects = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
          Year
        </label>
        <select
          id="year"
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">All Years</option>
          {availableFilters.years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branch">
          Branch
        </label>
        <select
          id="branch"
          name="branch"
          value={filters.branch}
          onChange={handleFilterChange}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">All Branches</option>
          {availableFilters.branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="batch">
          Batch
        </label>
        <select
          id="batch"
          name="batch"
          value={filters.batch}
          onChange={handleFilterChange}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">All Batches</option>
          {availableFilters.batches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
      </div>
    </div>
  ), [filters, availableFilters, handleFilterChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Mess Rebate Statistics</h1>
      
      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        {filterSelects}
      </div>
      
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Rebates</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRebates}</p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Rebate Days</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalRebateDays}</p>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Avg Days per Student</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.avgDaysPerStudent.toFixed(2)}</p>
          </div>
        </div>
      )}
      
      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Branch Chart */}
          {branchChartData && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Rebates by Branch</h3>
              <Bar data={branchChartData} options={chartOptions} />
            </div>
          )}
          
          {/* Batch Chart */}
          {batchChartData && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Rebates by Batch</h3>
              <Bar data={batchChartData} options={chartOptions} />
            </div>
          )}
          
          {/* Monthly Chart */}
          {monthlyChartData && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Rebate Trends</h3>
              <Line data={monthlyChartData} options={chartOptions} />
            </div>
          )}
          
          {/* Yearly Chart */}
          {yearlyChartData && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Yearly Rebate Trends</h3>
              <Bar data={yearlyChartData} options={chartOptions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(Statistics); 