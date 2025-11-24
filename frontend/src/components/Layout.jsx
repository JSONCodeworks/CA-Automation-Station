import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

const drawerWidth = 260

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [menuItems, setMenuItems] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    try {
      const response = await api.get('/menu/main')
      setMenuItems(response.data.menuItems || [])
    } catch (error) {
      console.error('Failed to load menu:', error)
    }
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const getIcon = (iconName) => {
    // Map icon names to Material-UI icons
    const iconMap = {
      dashboard: <DashboardIcon />,
      add_circle: <DashboardIcon />,
      assessment: <DashboardIcon />,
      inventory: <DashboardIcon />,
      settings: <DashboardIcon />
    }
    return iconMap[iconName] || <DashboardIcon />
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.menu_id} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.route)}
              sx={{
                '&:hover': {
                  bgcolor: 'primary.dark',
                  '& .MuiListItemIcon-root': { color: 'primary.main' }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                {getIcon(item.icon)}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box component="img" src="/logo.png" alt="Logo" sx={{ height: 40, mr: 2, display: { xs: 'none', sm: 'block' } }} 
               onError={(e) => { e.target.style.display = 'none' }} />

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            CA Automation Station
          </Typography>

          {/* User Avatar */}
          <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
            <Avatar
              alt={user?.full_name || user?.username}
              src={user?.profile_picture}
              sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
            >
              {user?.full_name?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1">{user?.full_name || user?.username}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              {user?.title && <Typography variant="caption" color="text.secondary">{user?.title}</Typography>}
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
