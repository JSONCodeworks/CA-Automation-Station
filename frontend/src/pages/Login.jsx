import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Divider,
  Alert
} from '@mui/material'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isAuthenticated } = useAuthStore()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Handle SSO callback
    const token = searchParams.get('token')
    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard')
    }

    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate, searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(credentials)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/sso/cyberark'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.05) 0%, transparent 50%)',
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={4} sx={{ bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                CA Automation Station
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access the automation portal
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username or Email"
                variant="outlined"
                margin="normal"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleSSOLogin}
              sx={{ py: 1.5 }}
            >
              Sign in with CyberArk SSO
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
              Default credentials: admin@jsoncloudworks.com / T3@mw0rK!
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
