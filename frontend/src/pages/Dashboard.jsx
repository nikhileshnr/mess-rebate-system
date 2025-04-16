import React, { useEffect, useCallback, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { checkLoginStatus, logout } from "../api";
import { FaSignOutAlt, FaClipboardList, FaTable, FaUsers, FaChartBar, FaEdit } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkLoginStatus();
      } catch (error) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      // Error already handled by API interceptor
    }
  }, [navigate]);

  const handleNavigation = useCallback((path) => () => {
    navigate(path);
  }, [navigate]);

  const isActive = useCallback((path) => {
    return location.pathname.includes(path);
  }, [location.pathname]);

  // Define navigation items to avoid repetition
  const navItems = useMemo(() => [
    { path: '/dashboard/createrebate', label: 'Apply Rebate', icon: <FaClipboardList className="mr-2" /> },
    { path: '/dashboard/viewrebates', label: 'View Rebates', icon: <FaTable className="mr-2" /> },
    { path: '/dashboard/editrebates', label: 'Edit Rebates', icon: <FaEdit className="mr-2" /> },
    { path: '/dashboard/students', label: 'Students List', icon: <FaUsers className="mr-2" /> },
    { path: '/dashboard/statistics', label: 'Statistics', icon: <FaChartBar className="mr-2" /> }
  ], []);

  // Memoize nav buttons to prevent unnecessary re-renders
  const navButtons = useMemo(() => (
    navItems.map((item) => (
      <button 
        key={item.path}
        className={`flex items-center p-3 mt-2 first:mt-0 rounded ${
          isActive(item.path.split('/').pop()) ? "bg-blue-700" : "hover:bg-blue-800"
        }`} 
        onClick={handleNavigation(item.path)}
      >
        {item.icon} {item.label}
      </button>
    ))
  ), [navItems, isActive, handleNavigation]);

  // Memoize logout button
  const logoutButton = useMemo(() => (
    <button 
      className="flex items-center p-3 mt-auto bg-red-500 hover:bg-red-600 rounded" 
      onClick={handleLogout}
    >
      <FaSignOutAlt className="mr-2" /> Logout
    </button>
  ), [handleLogout]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-5 flex flex-col fixed h-full">
        <h2 className="text-xl font-bold mb-6">Mess Portal</h2>
        {navButtons}
        {logoutButton}
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <Outlet />
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
