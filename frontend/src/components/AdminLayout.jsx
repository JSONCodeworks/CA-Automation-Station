import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material'
import {
  People as PeopleIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  IntegrationInstructions as IntegrationIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import api from '../services/api'

const adminDrawerWidth = 260

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [adminMenuItems, setAdminMenuItems] = useState([])

  useEffect(() => {
    loadAdminMenu()
  }, [])

  const loadAdminMenu = async () => {
    try {
      const response = await api.get('/menu/admin')
      setAdminMenuItems(response.data.menuItems || [])
    } catch (error) {
      console.error('Failed to load admin menu:', error)
    }
  }

  const getIcon = (iconName) => {
    const iconMap = {
      people: <PeopleIcon />,
      menu: <MenuIcon />,
      settings: <SettingsIcon />,
      security: <SecurityIcon />,
      integration: <IntegrationIcon />
    }
    return iconMap[iconName] || <SettingsIcon />
  }

  const getCurrentPageTitle = () => {
    const path = location.pathname
    const menuItem = adminMenuItems.find(item => path.includes(item.route))
    return menuItem?.title || 'Administration'
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Admin Side Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: adminDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: adminDrawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
            bgcolor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
            Administration
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            System Management
          </Typography>
        </Box>
        
        <List sx={{ pt: 2 }}>
          {adminMenuItems.map((item) => (
            <ListItem key={item.menu_id} disablePadding>
              <ListItemButton
                selected={location.pathname === item.route}
                onClick={() => navigate(item.route)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                  {getIcon(item.icon)}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  secondary={item.description}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { fontSize: '0.7rem' }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/dashboard')} sx={{ mx: 1, borderRadius: 1 }}>
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Back to Dashboard" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Admin Content Area */}
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: 'background.paper' }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/dashboard')}
            sx={{ textDecoration: 'none', color: 'text.secondary' }}
          >
            Home
          </Link>
          <Typography color="text.primary" variant="body2">
            Administration
          </Typography>
          <Typography color="primary" variant="body2" fontWeight={600}>
            {getCurrentPageTitle()}
          </Typography>
        </Breadcrumbs>

        <Outlet />
      </Box>
    </Box>
  )
}
