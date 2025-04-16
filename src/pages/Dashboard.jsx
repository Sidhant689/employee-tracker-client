// Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const Dashboard = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        hoursLogged: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard stats
        if (user) {
            setLoading(true);
            API.get('dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                setStats(res.data || {
                    totalTasks: Math.floor(Math.random() * 30),
                    completedTasks: Math.floor(Math.random() * 15),
                    pendingTasks: Math.floor(Math.random() * 15),
                    hoursLogged: Math.floor(Math.random() * 100)
                });
            })
            .catch(err => {
                console.error("Error fetching dashboard stats:", err);
                // Set dummy data for demo
                setStats({
                    totalTasks: Math.floor(Math.random() * 30),
                    completedTasks: Math.floor(Math.random() * 15),
                    pendingTasks: Math.floor(Math.random() * 15),
                    hoursLogged: Math.floor(Math.random() * 100)
                });
            })
            .finally(() => setLoading(false));
        }
    }, [user, token]);

    const renderRoleInfo = () => {
        switch (user?.role) {
            case 'Admin':
                return (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    As an Admin, you have full access to all system features including reports, task assignments, and user management.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'Manager':
                return (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    As a Manager, you can assign tasks to employees and monitor their progress.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'Employee':
                return (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    As an Employee, you can view tasks assigned to you and log time spent on them.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
                    <p className="text-gray-600 mt-1">Here's your activity summary</p>
                </div>
                
                {renderRoleInfo()}
                
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase">Total Tasks</p>
                                    <p className="text-gray-800 text-2xl font-semibold">{stats.totalTasks}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase">Completed</p>
                                    <p className="text-gray-800 text-2xl font-semibold">{stats.completedTasks}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-yellow-500">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase">Pending</p>
                                    <p className="text-gray-800 text-2xl font-semibold">{stats.pendingTasks}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase">Hours Logged</p>
                                    <p className="text-gray-800 text-2xl font-semibold">{stats.hoursLogged}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {user?.role === "Admin" && (
                            <a href="/reports" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <span className="p-2 rounded-full bg-blue-100 text-blue-500 mr-3">📊</span>
                                <span>View Reports</span>
                            </a>
                        )}
                        
                        {(user?.role === "Admin" || user?.role === "Manager") && (
                            <a href="/assign-task" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <span className="p-2 rounded-full bg-green-100 text-green-500 mr-3">📝</span>
                                <span>Assign New Task</span>
                            </a>
                        )}
                        
                        {user?.role === "Employee" && (
                            <a href="/my-tasks" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                                <span className="p-2 rounded-full bg-yellow-100 text-yellow-500 mr-3">⏱️</span>
                                <span>View My Tasks</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;