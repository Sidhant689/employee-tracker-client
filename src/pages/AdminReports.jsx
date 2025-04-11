import { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminReports = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  useEffect(() => {
    fetchReports();
  }, [token]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('admin/task-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedReports = () => {
    if (!sortConfig.key) return reports;
    
    return [...reports].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const renderSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <span className="ml-1 text-gray-400">↕️</span>;
    }
    return sortConfig.direction === 'ascending' ? 
      <span className="ml-1 text-blue-600">↑</span> : 
      <span className="ml-1 text-blue-600">↓</span>;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📊 Task & Time Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of task assignments and time tracking</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Task Summary</h2>
            </div>
            <button 
              onClick={fetchReports} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border-l-4 border-red-500">
                {error}
              </div>
              <button 
                onClick={fetchReports}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No reports available. Task data will appear here once tasks are assigned and tracked.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('title')}>
                      <div className="flex items-center">
                        Task {renderSortIcon('title')}
                      </div>
                    </th>
                    <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('employeeName')}>
                      <div className="flex items-center">
                        Employee {renderSortIcon('employeeName')}
                      </div>
                    </th>
                    <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('totalHours')}>
                      <div className="flex items-center">
                        Total Time {renderSortIcon('totalHours')}
                      </div>
                    </th>
                    <th className="px-6 py-3 cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center">
                        Status {renderSortIcon('status')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedReports().map((report) => (
                    <tr key={report.taskId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{report.title}</td>
                      <td className="px-6 py-4">{report.employeeName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md font-medium">
                            {report.totalHours} hrs
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'completed' ? 'bg-green-100 text-green-800' :
                          report.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Report Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="p-2 rounded-full bg-blue-100 text-blue-500 mr-3">📥</span>
              <span>Export to CSV</span>
            </button>
            <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <span className="p-2 rounded-full bg-green-100 text-green-500 mr-3">📊</span>
              <span>Generate Charts</span>
            </button>
            <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <span className="p-2 rounded-full bg-purple-100 text-purple-500 mr-3">📅</span>
              <span>Schedule Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;