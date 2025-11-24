import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import UserManagement from './pages/UserManagement'
import MenuManagement from './pages/MenuManagement'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<Login />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resources/*" element={<Resources />} />
                <Route path="/admin/*" element={
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/admin/users" />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/menus" element={<MenuManagement />} />
                    </Routes>
                  </AdminLayout>
                } />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

export default App
