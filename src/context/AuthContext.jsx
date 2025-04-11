// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token"));

    const normalizeDecodedToken = (decoded) => {
        return {
            id: decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            name: decoded.name || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            email: decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
        };
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(normalizeDecodedToken(decoded));
            } catch (err) {
                console.error("Invalid token:", err);
                logout(); // token tampered/expired
            }
        }
        setLoading(false);
    }, [token]);

    const login = (token) => {
        localStorage.setItem("token", token);
        setToken(token);
        const decoded = jwtDecode(token);
        setUser(normalizeDecodedToken(decoded));
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);