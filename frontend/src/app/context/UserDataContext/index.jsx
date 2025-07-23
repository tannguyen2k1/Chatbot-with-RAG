'use client'
import React, { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFetcher, rawPostFetcher } from '@/app/api/globalFetcher';
import useSWR from 'swr';



// Create context
export const UserDataContext = createContext(undefined);

// Default config values
const config = {
    users: [],
    search: '',
    loading: true,
};


export const UserDataProvider = ({ children }) => {
    const router = useRouter();
    const [users, setUsers] = useState(config.users);
    const [search, setSearch] = useState(config.search);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(config.loading);
    // User auth state
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Luôn fetch, fetcher sẽ tự động không gọi nếu chưa có token
    const { data: usersData, isLoading: isUsersLoading, error: usersError } = useSWR("/api/users", getFetcher);

    // Load token & user from localStorage on mount
    useEffect(() => {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
        }
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (usersData) {
            setUsers(usersData.data);
            setLoading(isUsersLoading);
        } else if (usersError) {
            setError(usersError);
            setLoading(isUsersLoading);
        } else {
            setLoading(isUsersLoading);
        }
        // Không reset token, user, isAuthenticated khi fetcher trả về null hoặc lỗi
    }, [usersData, isUsersLoading, usersError]);

    // Login function
    const login = async (username, password) => {
        try {
            const res = await rawPostFetcher('/api/auth/login', { username, password });
            if (res && res.access_token) {
                setToken(res.access_token);
                setIsAuthenticated(true);
                localStorage.setItem('access_token', res.access_token);
                localStorage.setItem('refresh_token', res.refresh_token);
                // Fetch user info
                const userRes = await getFetcher('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${res.access_token}` }
                });
                setUser(userRes);
                localStorage.setItem('user', JSON.stringify(userRes));
                return { success: true };
            } else {
                throw new Error('Login failed');
            }
        } catch (err) {
            setError(err.message || 'Login error');
            setIsAuthenticated(false);
            setToken(null);
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            return { success: false, message: err.message };
        }
    };

    // Logout function
    const logout = () => {
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/auth/auth1/login');
    };




    return (
        <UserDataContext.Provider value={{
            users,
            error,
            loading,
            setSearch,
            search,
            // Auth
            user,
            token,
            isAuthenticated,
            login,
            logout
        }}>
            {children}
        </UserDataContext.Provider>
    );
};