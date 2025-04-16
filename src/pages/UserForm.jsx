import { useState, useEffect } from 'react';
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Edit, Trash2, Check, X, Plus, Loader, Users} from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        roleId: ""
    });
    const [passwordStrength, setPasswordStrength] = useState({
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecial: false,
        isMinLength: false
    });

    const { token, user } = useAuth();
    const isAdmin = user?.role === "Admin";

    useEffect(() => {
        if (token) {
            fetchRoles();
            fetchUsers();
        }
    }, [token]);

    // Password strength checker
    useEffect(() => {
        if (form.password) {
            setPasswordStrength({
                hasLowercase: /[a-z]/.test(form.password),
                hasUppercase: /[A-Z]/.test(form.password),
                hasNumber: /[0-9]/.test(form.password),
                hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password),
                isMinLength: form.password.length >= 6
            });
        } else {
            setPasswordStrength({
                hasLowercase: false,
                hasUppercase: false,
                hasNumber: false,
                hasSpecial: false,
                isMinLength: false
            });
        }
    }, [form.password]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await API.get("role/roles", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            // Ensure we have an array and remove any duplicates by ID
            const rolesData = Array.isArray(res.data) ? res.data : [];
            const uniqueRoles = Array.from(new Map(rolesData.map(role => [role.id, role])).values());
            setRoles(uniqueRoles);
        } catch (err) {
            console.error("Error fetching roles:", err);
            setError("Failed to load roles. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setUserLoading(true);
        try {
            const res = await API.get("user/users", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users. Please try again.");
        } finally {
            setUserLoading(false);
        }
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Clear messages when form changes
        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            roleId: ""
        });
        setIsEditing(false);
        setSelectedUserId(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleEditClick = (userToEdit) => {
        setForm({
            name: userToEdit.name,
            email: userToEdit.email,
            password: "",
            confirmPassword: "",
            roleId: userToEdit.role.id
        });
        setIsEditing(true);
        setSelectedUserId(userToEdit.id);
        setShowForm(true);
        setShowPassword(false);
        setShowConfirmPassword(false);
        window.scrollTo(0, 0);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        try {
            await API.delete(`users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            setSuccess("User deleted successfully!");
            // Refresh the user list
            fetchUsers();
        } catch (err) {
            console.error("Error deleting user:", err);
            setError(err.response?.data?.message || "Failed to delete user. Please try again.");
        }
    };

    const validatePassword = () => {
        if (!isEditing || form.password) {
            // Check password strength requirements
            if (!passwordStrength.isMinLength) {
                setError("Password must be at least 6 characters long");
                return false;
            }
            if (!passwordStrength.hasLowercase) {
                setError("Password must include at least one lowercase letter");
                return false;
            }
            if (!passwordStrength.hasUppercase) {
                setError("Password must include at least one uppercase letter");
                return false;
            }
            if (!passwordStrength.hasNumber) {
                setError("Password must include at least one number");
                return false;
            }
            if (!passwordStrength.hasSpecial) {
                setError("Password must include at least one special character");
                return false;
            }
            
            // Check if passwords match
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match");
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        
        // Validate password
        if (!validatePassword()) {
            setSubmitting(false);
            return;
        }

        try {
            // Format the data according to what the API expects
            const userData = {
                name: form.name,
                email: form.email,
                roleId: form.roleId
            };
            
            // Only include password if it was provided (for editing users)
            if (form.password) {
                userData.password = form.password;
            }
            
            if (isEditing) {
                await API.put(`user/${selectedUserId}`, userData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccess("User updated successfully!");
            } else {
                await API.post("user/save/", userData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSuccess("User created successfully!");
            }
            
            resetForm();
            fetchUsers();
            setShowForm(false);
        } catch (err) {
            console.error("Error saving user:", err);
            setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} user. Please try again.`);
        } finally {
            setSubmitting(false);
        }
    };

    const getPasswordStrengthPercentage = () => {
        const { hasLowercase, hasUppercase, hasNumber, hasSpecial, isMinLength } = passwordStrength;
        const criteria = [hasLowercase, hasUppercase, hasNumber, hasSpecial, isMinLength];
        const metCriteria = criteria.filter(Boolean).length;
        return (metCriteria / criteria.length) * 100;
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const renderPasswordStrength = () => {
        if (!form.password) return null;
        
        const strengthPercentage = getPasswordStrengthPercentage();
        let strengthColor = "bg-red-500";
        let strengthText = "Weak";
        
        if (strengthPercentage >= 100) {
            strengthColor = "bg-green-500";
            strengthText = "Strong";
        } else if (strengthPercentage >= 60) {
            strengthColor = "bg-yellow-500";
            strengthText = "Medium";
        }
        
        return (
            <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                        className={`h-2.5 rounded-full ${strengthColor}`} 
                        style={{ width: `${strengthPercentage}%` }}
                    ></div>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                    <span>{strengthText} Password</span>
                    <span>{strengthPercentage}%</span>
                </div>
                <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center ${passwordStrength.isMinLength ? "text-green-600" : "text-gray-500"}`}>
                        {passwordStrength.isMinLength ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        At least 6 characters
                    </div>
                    <div className={`text-xs flex items-center ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-500"}`}>
                        {passwordStrength.hasLowercase ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        One lowercase letter
                    </div>
                    <div className={`text-xs flex items-center ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-500"}`}>
                        {passwordStrength.hasUppercase ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        One uppercase letter
                    </div>
                    <div className={`text-xs flex items-center ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                        {passwordStrength.hasNumber ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        One number
                    </div>
                    <div className={`text-xs flex items-center ${passwordStrength.hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                        {passwordStrength.hasSpecial ? (
                            <Check className="h-4 w-4 mr-1 text-green-600" />
                        ) : (
                            <X className="h-4 w-4 mr-1 text-gray-400" />
                        )}
                        One special character (!@#$%^&*...)
                    </div>
                </div>
            </div>
        );
    };

    const renderRoleBadge = (role) => {
        const roleName = role ? role : "Unknown";
        
        const colors = {
            Admin: "bg-blue-100 text-blue-800",
            Manager: "bg-green-100 text-green-800",
            Employee: "bg-yellow-100 text-yellow-800"
        };
        
        return (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[roleName] || "bg-gray-100 text-gray-800"}`}>
                {roleName}
            </span>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            <Users className="inline mr-2" size={28} />
                            User Management
                        </h1>
                        <p className="text-gray-600 mt-1">Create, view, and manage users</p>
                    </div>
                    <button 
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                    >
                        {showForm ? 'Hide Form' : (
                            <>
                                <Plus className="mr-1" size={18} />
                                Add User
                            </>
                        )}
                    </button>
                </div>

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

                {/* Users List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Users List</h2>
                    </div>

                    <div className="p-6">
                        {userLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader className="animate-spin h-10 w-10 text-blue-500" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {users.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No users found. Click "Add User" to create one.
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {renderRoleBadge(user.role.name)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleEditClick(user)}
                                                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                                            >
                                                                <Edit className="h-5 w-5 mr-1" />
                                                                Edit
                                                            </button>
                                                            
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="text-red-600 hover:text-red-900 flex items-center"
                                                                >
                                                                    <Trash2 className="h-5 w-5 mr-1" />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="mt-8">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit User' : 'Create User'}</h2>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <Loader className="animate-spin h-10 w-10 text-blue-500" />
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                                                Full Name *
                                            </label>
                                            <input 
                                                id="name"
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                name="name" 
                                                placeholder="Enter full name" 
                                                value={form.name} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                                                Email Address *
                                            </label>
                                            <input 
                                                id="email"
                                                type="email"
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                name="email" 
                                                placeholder="Enter email address" 
                                                value={form.email} 
                                                onChange={handleChange} 
                                                required 
                                                autoComplete='off'
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                                                    {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" 
                                                        name="password" 
                                                        placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
                                                        value={form.password} 
                                                        onChange={handleChange} 
                                                        required={!isEditing}
                                                        minLength={!isEditing ? "6" : ""}
                                                        autoComplete='off'
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={togglePasswordVisibility}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                {renderPasswordStrength()}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                                                    {isEditing ? 'Confirm New Password' : 'Confirm Password *'}
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        id="confirmPassword"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" 
                                                        name="confirmPassword" 
                                                        placeholder={isEditing ? "Confirm new password" : "Confirm password"}
                                                        value={form.confirmPassword} 
                                                        onChange={handleChange} 
                                                        required={!isEditing}
                                                        minLength={!isEditing ? "6" : ""}
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={toggleConfirmPasswordVisibility}
                                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="h-5 w-5" />
                                                        ) : (
                                                            <Eye className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                {form.password && form.confirmPassword && (
                                                    <div className="mt-1 text-sm">
                                                        {form.password === form.confirmPassword ? (
                                                            <span className="text-green-600 flex items-center">
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Passwords match
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 flex items-center">
                                                                <X className="h-4 w-4 mr-1" />
                                                                Passwords do not match
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="roleId">
                                                User Role *
                                            </label>
                                            <select 
                                                id="roleId"
                                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                                name="roleId" 
                                                value={form.roleId} 
                                                onChange={handleChange} 
                                                required
                                            >
                                                <option value="">Select Role</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="pt-4 flex space-x-4">
                                            <button 
                                                type="button" 
                                                onClick={() => { setShowForm(false); resetForm(); }}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <span className="flex items-center justify-center">
                                                        <Loader className="animate-spin mr-2 h-4 w-4 text-white" />
                                                        {isEditing ? 'Updating...' : 'Creating...'}
                                                    </span>
                                                ) : isEditing ? 'Update User' : 'Create User'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;