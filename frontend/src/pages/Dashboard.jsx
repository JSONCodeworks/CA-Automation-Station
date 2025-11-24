import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material'
import { Add, Assessment, Inventory } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const quickActions = [
    { title: 'Create Resource', icon: <Add />, route: '/resources/create', color: '#00d4ff' },
    { title: 'View Reports', icon: <Assessment />, route: '/reports', color: '#6276a1' },
    { title: 'Resource Inventory', icon: <Inventory />, route: '/resources/inventory', color: '#00a8cc' }
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Welcome back, {user?.full_name || user?.username}!
      </Typography>

      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #1a2332 0%, #252f3e 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
            CA Automation Station
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your enterprise portal for resource provisioning and automation management. 
            Create, track, and manage cloud resources with ease.
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.title}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${action.color}40`
                }
              }}
              onClick={() => navigate(action.route)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: `${action.color}20`, 
                    p: 1.5, 
                    borderRadius: 2, 
                    display: 'flex',
                    mr: 2,
                    color: action.color
                  }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6">{action.title}</Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  fullWidth
                  sx={{ borderColor: action.color, color: action.color }}
                >
                  Go to {action.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No recent activity to display. Start by creating your first resource!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
