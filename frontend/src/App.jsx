import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import ResourcesLanding from './pages/ResourcesLanding'
import CyberArkTestDrive from './pages/CyberArkTestDrive'
import UserManagement from './pages/UserManagement'
import MenuManagement from './pages/MenuManagement'
import AppConfiguration from './pages/AppConfiguration'
import ManageISPServices from './pages/ManageISPServices'
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
                <Route path="/resources" element={<ResourcesLanding />} />
                <Route path="/resources/cyberark-testdrive" element={<CyberArkTestDrive />} />
                
                {/* Admin Routes - No nested layout */}
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/menus" element={<MenuManagement />} />
                <Route path="/admin/config" element={<AppConfiguration />} />
                <Route path="/admin/isp-services" element={<ManageISPServices />} />
                <Route path="/admin" element={<Navigate to="/admin/users" />} />
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
