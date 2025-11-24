import { create } from 'zustand'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials)
    const { token, user } = response.data
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        set({ user: response.data.user, isAuthenticated: true })
      } catch (error) {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }
  }
}))
