import React, { createContext, useState, useEffect } from 'react'
import api from './api'

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const restoreSession = async () => {
        const token = localStorage.getItem("token")
        if (token) {
            setLoading(true)
            try {
                const response = await api.get("/user/Profile")
                setUser(response.data.user)
            } catch (err) {
                console.error("Session restoration failed:", err)
                localStorage.removeItem("token")
                setUser(null)
            } finally {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }

    useEffect(() => {
        restoreSession()
    }, [])

    return (
        <UserContext.Provider value={{ user, setUser, loading, restoreSession }}>
            {children}
        </UserContext.Provider>
    );
}
