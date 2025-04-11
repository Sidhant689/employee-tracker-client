// Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        
        try {
            const res = await API.post('/auth/login', { email, password });
            login(res.data.token);
            navigate('/dashboard');
        } catch (error) {
            setErr(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-100 to-blue-50">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-blue-900">⏱️ EmployeeTracker Pro</h1>
                <p className="text-gray-600 mt-2">Streamline your workforce management</p>
            </div>
            
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
                    
                    {err && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-center border-l-4 border-red-500">
                            {err}
                        </div>
                    )}
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-md hover:from-blue-700 hover:to-blue-800 transition duration-200 font-medium"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>
                
                <div className="text-center mt-4 text-gray-600 text-sm">
                    © {new Date().getFullYear()} TimeTracker Pro. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;