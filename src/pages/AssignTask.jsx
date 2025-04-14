import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const AssignTask = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({
        title: "",
        description: "",
        dueDate: "",
        assignedToId: "",
        priority: "medium",
        estimatedHours: ""
    });

    const { token, user } = useAuth();

    useEffect(() => {
        fetchEmployees();
    }, [token]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await API.get("user/employees", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Employees fetched:", res.data);
            // Make sure res.data is an array
            setEmployees(Array.isArray(res.data) ? res.data : []);
            
            // If the API returns an object with a 'data' property containing the array:
            // setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError("Failed to load employees. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Clear messages when form changes
        setError("");
        setSuccess("");
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        
        try {
            // Format the data according to what the API expects
            const taskData = {
                title: form.title,
                description: form.description,
                dueDate: form.dueDate,
                priority: form.priority,
                estimatedHours: form.estimatedHours,
                assignedToId: form.assignedToId
            };
            
            await API.post("tasks", taskData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setSuccess("Task assigned successfully!");
            setForm({
                title: "",
                description: "",
                dueDate: "",
                assignedToId: "",
                priority: "medium",
                estimatedHours: ""
            });
        } catch (err) {
            console.error("Error assigning task:", err);
            setError(err.response?.data?.message || "Failed to assign task. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderPriorityBadge = (priority) => {
        const colors = {
            low: "bg-green-100 text-green-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-red-100 text-red-800"
        };
        
        return (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">📝 Assign Task</h1>
                    <p className="text-gray-600 mt-1">Create and assign new tasks to your team members</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Task Details</h2>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border-l-4 border-red-500">
                                        {error}
                                    </div>
                                )}
                                
                                {success && (
                                    <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 border-l-4 border-green-500">
                                        {success}
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="title">
                                                Task Title *
                                            </label>
                                            <input 
                                                id="title"
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                name="title" 
                                                placeholder="Enter task title" 
                                                value={form.title} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
                                                Task Description *
                                            </label>
                                            <textarea 
                                                id="description"
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32" 
                                                name="description" 
                                                placeholder="Provide detailed description of the task" 
                                                value={form.description} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="dueDate">
                                                    Due Date *
                                                </label>
                                                <input 
                                                    id="dueDate"
                                                    type="date" 
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                    name="dueDate" 
                                                    value={form.dueDate} 
                                                    onChange={handleChange} 
                                                    required
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="estimatedHours">
                                                    Estimated Hours
                                                </label>
                                                <input 
                                                    id="estimatedHours"
                                                    type="number" 
                                                    min="0" 
                                                    step="0.5"
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                    name="estimatedHours" 
                                                    placeholder="Enter estimated hours" 
                                                    value={form.estimatedHours} 
                                                    onChange={handleChange} 
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="assignedToId">
                                                    Assign To *
                                                </label>
                                                <select 
                                                    id="assignedToId"
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                    name="assignedToId" 
                                                    value={form.assignedToId} 
                                                    onChange={handleChange} 
                                                    required
                                                >
                                                    <option value="">Select Employee</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="priority">
                                                    Priority *
                                                </label>
                                                <select 
                                                    id="priority"
                                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                    name="priority" 
                                                    value={form.priority} 
                                                    onChange={handleChange} 
                                                    required
                                                >
                                                    <option value="low">Low</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="high">High</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4">
                                            <button 
                                                type="submit" 
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <span className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Assigning Task...
                                                    </span>
                                                ) : 'Assign Task'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Task Guidelines</h2>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-500">
                                            1
                                        </span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-gray-700">Use clear and specific task titles</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-500">
                                            2
                                        </span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-gray-700">Provide detailed descriptions with all necessary information</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-500">
                                            3
                                        </span>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-gray-700">Set realistic due dates and time estimates</p>
                                    </div>
                                </div>
                                
                                <div className="pt-4">
                                    <h3 className="font-medium text-gray-800 mb-2">Priority Levels:</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            {renderPriorityBadge("low")}
                                            <span className="ml-2 text-gray-700">Regular tasks, flexible timeline</span>
                                        </div>
                                        <div className="flex items-center">
                                            {renderPriorityBadge("medium")}
                                            <span className="ml-2 text-gray-700">Important tasks, firm deadline</span>
                                        </div>
                                        <div className="flex items-center">
                                            {renderPriorityBadge("high")}
                                            <span className="ml-2 text-gray-700">Critical tasks, urgent attention</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignTask;