import { useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyTasks = () => {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLogId, setActiveLogId] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'Done', 'Assigned'

  useEffect(() => {
    fetchTasks();
  }, [token]);
  
  useEffect(() => {
    // Set up timer interval if there's an active task
    let interval;
    if (activeTaskId && activeLogId) {
      setActiveTimer(new Date());
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    // Clean up interval when component unmounts or timer stops
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTaskId, activeLogId]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    debugger
    try {
      const res = await API.get('tasks/assigned-to-me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTasks(res.data);
      
      // Check if any task has active timer
      const activeTask = res.data.find(task => task.activeTimeLogId !== "00000000-0000-0000-0000-000000000000");
      console.log("Active task found:", activeTask);
      
      if (activeTask) {
        setActiveLogId(activeTask.activeTimeLogId);
        setActiveTaskId(activeTask.id);
        if (activeTask.startTime) {
          const startTime = new Date(activeTask.startTime);
          const elapsed = Math.floor((new Date() - startTime) / 1000);
          console.log("Found active timer, elapsed seconds:", elapsed);
          setElapsedTime(elapsed);
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async (taskId) => {
    try {
      setLoading(true);
      const res = await API.post(`timelog/start`, JSON.stringify({ taskId }), {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setActiveLogId(res.data.id);
      setActiveTaskId(taskId);
      setElapsedTime(0);
      setActiveTimer(new Date());
      
      // Update the task in the state
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, activeTimeLogId: res.data.id, startTime: new Date() } : task
      ));
      
    } catch (err) {
      console.error('Error starting timer:', err);
      alert('Failed to start timer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeLogId) return;
    
    try {
      setLoading(true);
      await API.post(`timelog/stop`, { logId: activeLogId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setActiveLogId(null);
      setActiveTaskId(null);
      setElapsedTime(0);
      setActiveTimer(null);
      
      // Refresh tasks to update time logs
      fetchTasks();
      
    } catch (err) {
      console.error('Error stopping timer:', err);
      alert('Failed to stop timer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markTaskComplete = async (taskId) => {
    if (activeTaskId === taskId) {
      alert('Please stop the active timer before marking this task as complete.');
      return;
    }
    
    try {
      setLoading(true);
      await API.post(`tasks/${taskId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the task in the state
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: 'Done' } : task
      ));
      
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Failed to mark task as complete. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTasksByFilter = () => {
    switch (filter) {
      case 'active':
        return tasks.filter(task => task.status === 'InProgress');
      case 'Done':
        return tasks.filter(task => task.status === 'Done');
      case 'Assigned':
        return tasks.filter(task => task.status == 'Assigned');
      default:
        return tasks;
    }
  };

  const getTaskPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-400 bg-red-50';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-200';
    }
  };

  const filteredTasks = getTasksByFilter();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📋 My Tasks</h1>
          <p className="text-gray-600 mt-1">Track and manage your assigned tasks</p>
        </div>

        {activeTaskId && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="font-bold text-blue-800">⏱️ Active Timer</h3>
                <p className="text-blue-700">
                  Currently tracking: <span className="font-semibold">{tasks.find(t => t.id === activeTaskId)?.title}</span>
                </p>
              </div>
              <div className="flex items-center">
                <div className="bg-white px-4 py-2 rounded-md shadow text-xl font-mono mr-4">
                  {formatElapsedTime(elapsedTime)}
                </div>
                <button 
                  onClick={stopTimer} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Timer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 md:mb-0">Task List</h2>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter('all')} 
                className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('active')} 
                className={`px-3 py-1 rounded-md ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('Assigned')} 
                className={`px-3 py-1 rounded-md ${filter === 'Assigned' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => setFilter('Done')} 
                className={`px-3 py-1 rounded-md ${filter === 'Done' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Done
              </button>
            </div>
          </div>

          {loading && !activeTaskId ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border-l-4 border-red-500">
                {error}
              </div>
              <button 
                onClick={fetchTasks}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">No tasks found</p>
              <p>{filter !== 'all' ? `No ${filter} tasks available. Try changing the filter.` : 'You have no tasks assigned to you at the moment.'}</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`border-l-4 rounded-md bg-white shadow p-4 ${getTaskPriorityClass(task.priority)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <div>
                      {task.priority && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div>
                      <span className="font-medium">Due:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </div>
                    <div>
                      {task.totalHours ? (
                        <span>
                          <span className="font-medium">Logged:</span> {task.totalHours.toFixed(2)} hrs
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {task.status === 'Done' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </span>
                    ) : activeTaskId === task.id ? (
                      <button 
                        onClick={stopTimer} 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md flex items-center justify-center transition-colors"
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop Timer
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => startTimer(task.id)} 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md flex items-center justify-center transition-colors"
                          disabled={activeLogId !== null || loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Timer
                        </button>
                        <button 
                          onClick={() => markTaskComplete(task.id)} 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center justify-center transition-colors"
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Task Statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-gray-700 font-medium mb-2">Tasks Completed</h3>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(task => task.status === 'Done').length} / {tasks.length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-gray-700 font-medium mb-2">Total Hours Logged</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.reduce((total, task) => total + (task.totalHours || 0), 0).toFixed(2)} hrs
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-gray-700 font-medium mb-2">Tasks Due Soon</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(task => {
                    if (!task.dueDate || task.status === 'Done') return false;
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 3 && diffDays >= 0;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;