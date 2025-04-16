// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token") || sessionStorage.getItem("token"));
    const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken"));
    const [tokenExpiry, setTokenExpiry] = useState(() => {
        const expiry = localStorage.getItem("tokenExpiry") || sessionStorage.getItem("tokenExpiry");
        return expiry ? new Date(expiry) : null;
    });
    const [isPersistent, setIsPersistent] = useState(() => localStorage.getItem("isPersistent") === "true");

    const normalizeDecodedToken = (decoded) => {
        return {
            id: decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            name: decoded.name || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            email: decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
        };
    };

    // Handle token initialization and refresh
    const initializeAuth = async () => {
        console.log("Auth check starting, token exists:", !!token);
        try {
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    setUser(normalizeDecodedToken(decoded));
                    
                    // Set up token refresh
                    const expiryTime = tokenExpiry ? new Date(tokenExpiry) : null;
                    if (expiryTime && refreshToken) {
                        const currentTime = new Date();
                        // If token expires in less than 5 minutes, refresh it now
                        if ((expiryTime.getTime() - currentTime.getTime()) < 5 * 60 * 1000) {
                            await refreshAccessToken();
                        } else {
                            // Schedule refresh 1 minute before expiry
                            const timeToRefresh = expiryTime.getTime() - currentTime.getTime() - 60 * 1000;
                            const refreshTimeout = setTimeout(() => {
                                refreshAccessToken();
                            }, timeToRefresh);
                            
                            return () => clearTimeout(refreshTimeout);
                        }
                    }
                } catch (err) {
                    console.error("Invalid token:", err);
                    if (refreshToken) {
                        await refreshAccessToken();
                    } else {
                        logout(); // token tampered/expired and no refresh token
                    }
                }
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeAuth();
    }, []); // Empty dependency array ensures this only runs once on mount

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            const response = await API.post('/auth/refresh-token', { refreshToken });
            
            // Update storage and state with new tokens
            const { accessToken, refreshToken: newRefreshToken, expiresAt, isPersistent: newIsPersistent } = response.data;
            
            // Store based on persistence setting
            const storage = newIsPersistent ? localStorage : sessionStorage;
            
            // Clear both storages to avoid conflicts
            clearAuthStorage();
            
            // Set in the appropriate storage
            storage.setItem("token", accessToken);
            storage.setItem("refreshToken", newRefreshToken);
            storage.setItem("tokenExpiry", expiresAt);
            storage.setItem("isPersistent", newIsPersistent);
            
            // Update state
            setToken(accessToken);
            setRefreshToken(newRefreshToken);
            setTokenExpiry(new Date(expiresAt));
            setIsPersistent(newIsPersistent);
            
            const decoded = jwtDecode(accessToken);
            setUser(normalizeDecodedToken(decoded));
        } catch (err) {
            console.error("Failed to refresh token:", err);
            logout(); // Refresh token invalid/expired
        } finally {
            setLoading(false);
        }
    };

    const login = (accessToken, newRefreshToken, expiresAt, persistent = false) => {
        // Determine which storage to use based on persistence setting
        const storage = persistent ? localStorage : sessionStorage;
        
        // Clear both storages to avoid conflicts
        clearAuthStorage();
        
        // Store auth data in the appropriate storage
        storage.setItem("token", accessToken);
        storage.setItem("refreshToken", newRefreshToken);
        storage.setItem("tokenExpiry", expiresAt);
        storage.setItem("isPersistent", persistent);
        
        // Update state
        setToken(accessToken);
        setRefreshToken(newRefreshToken);
        setTokenExpiry(new Date(expiresAt));
        setIsPersistent(persistent);
        
        const decoded = jwtDecode(accessToken);
        setUser(normalizeDecodedToken(decoded));
    };

    const logout = async () => {
        // If we have a refresh token, try to revoke it on the server
        if (refreshToken && token) {
            try {
                await API.post('/auth/revoke-token', { refreshToken }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Error revoking token:", err);
                // Continue with logout even if revocation fails
            }
        }
        
        // Clear all auth data from storage
        clearAuthStorage();
        
        // Reset state
        setToken(null);
        setRefreshToken(null);
        setTokenExpiry(null);
        setIsPersistent(false);
        setUser(null);
    };

    // Helper to clear all auth data from both storages
    const clearAuthStorage = () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiry");
        localStorage.removeItem("isPersistent");
        
        // Clear sessionStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("tokenExpiry");
        sessionStorage.removeItem("isPersistent");
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            loading,
            refreshToken,
            isPersistent,
            refreshAccessToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);