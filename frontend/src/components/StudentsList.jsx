import React, { useState, useEffect } from "react";
import { fetchAllStudents } from "../api";
import StudentDetailsModal from "./StudentDetailsModal";

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeBatch, setActiveBatch] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await fetchAllStudents();
        setStudents(data);
      } catch (err) {
        setError("Failed to fetch students. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const batches = [...new Set(students.map(student => student.batch))].sort();
  const branches = activeBatch
    ? [...new Set(students.filter(student => student.batch === activeBatch).map(student => student.branch))].sort()
    : [];

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === "" || 
      student.roll_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = !activeBatch || student.batch === activeBatch;
    const matchesBranch = !activeBranch || student.branch === activeBranch;
    return matchesSearch && matchesBatch && matchesBranch;
  });

  const clearFilters = () => {
    setActiveBatch(null);
    setActiveBranch(null);
    setSearchQuery("");
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-8 flex-1 min-h-screen">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Student List</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by Roll No"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
            />
            {(activeBatch || activeBranch || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Batch Filters */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Batch</span>
          <div className="flex flex-wrap gap-2">
            {batches.map(batch => (
              <button 
                key={batch} 
                onClick={() => { setActiveBatch(batch); setActiveBranch(null); }} 
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeBatch === batch 
                    ? "bg-blue-900 text-white shadow-md" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {batch}
              </button>
            ))}
          </div>
        </div>

        {/* Branch Filters */}
        {activeBatch && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Branch</span>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {branches.map(branch => (
                <button 
                  key={branch} 
                  onClick={() => setActiveBranch(branch)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeBranch === branch 
                      ? "bg-blue-900 text-white shadow-md" 
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {(activeBatch || activeBranch || searchQuery) && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Roll No</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Mobile No</th>
              <th className="border p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr 
                key={student.roll_no} 
                className="border hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <td className="border p-2">{student.roll_no}</td>
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.mobile_no}</td>
                <td className="border p-2">{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default StudentsList;
