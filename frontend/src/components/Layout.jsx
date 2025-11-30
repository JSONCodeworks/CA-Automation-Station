import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Logout as LogoutIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  IntegrationInstructions as IntegrationIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  AddCircle as AddCircleIcon,
  AdminPanelSettings as AdminIcon,
  CloudQueue as CloudQueueIcon,
  CloudDone as CloudDoneIcon,
  Computer as ComputerIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

const drawerWidth = 260

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [menuItems, setMenuItems] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdminSection, setIsAdminSection] = useState(false)

  useEffect(() => {
    // Check if we're in admin or resources section
    const inAdmin = location.pathname.startsWith('/admin')
    const inResources = location.pathname.startsWith('/resources')
    
    setIsAdminSection(inAdmin)
    
    // Load appropriate menu
    if (inAdmin) {
      loadAdminMenu()
    } else if (inResources) {
      loadResourcesMenu()
    } else {
      loadMainMenu()
    }
  }, [location.pathname])

  const loadMainMenu = async () => {
    try {
      const response = await api.get('/menu/main')
      setMenuItems(response.data.menuItems || [])
    } catch (error) {
      console.error('Failed to load main menu:', error)
    }
  }

  const loadAdminMenu = async () => {
    try {
      const response = await api.get('/menu/admin')
      setMenuItems(response.data.menuItems || [])
    } catch (error) {
      console.error('Failed to load admin menu:', error)
    }
  }

  const loadResourcesMenu = async () => {
    try {
      const response = await api.get('/resources-menu')
      setMenuItems(response.data.menuItems || [])
    } catch (error) {
      console.error('Failed to load resources menu:', error)
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

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const getIcon = (iconName) => {
    // Map icon names to Material-UI icons
    const iconMap = {
      dashboard: <DashboardIcon />,
      add_circle: <AddCircleIcon />,
      assessment: <AssessmentIcon />,
      inventory: <InventoryIcon />,
      settings: <SettingsIcon />,
      admin: <AdminIcon />,
      people: <PeopleIcon />,
      menu: <MenuBookIcon />,
      security: <SecurityIcon />,
      integration: <IntegrationIcon />,
      cloud_queue: <CloudQueueIcon />,
      cloud_done: <CloudDoneIcon />,
      computer: <ComputerIcon />,
      cloud_upload: <CloudUploadIcon />
    }
    return iconMap[iconName] || <DashboardIcon />
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ bgcolor: isAdminSection ? 'primary.dark' : location.pathname.startsWith('/resources') ? 'success.main' : 'primary.main' }}>
        <Typography variant="h6" noWrap sx={{ color: 'white', fontWeight: 700 }}>
          {isAdminSection ? 'Administration' : location.pathname.startsWith('/resources') ? 'Create Resources' : 'CA Automation'}
        </Typography>
      </Toolbar>
      
      <List sx={{ pt: 2 }}>
        {(isAdminSection || location.pathname.startsWith('/resources')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleBackToDashboard}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Back to Dashboard"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        
        {menuItems.map((item) => (
          <ListItem key={item.menu_id} disablePadding>
            <ListItemButton
              selected={location.pathname === item.route}
              onClick={() => navigate(item.route)}
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                  '& .MuiListItemIcon-root': { color: 'primary.main' }
                }
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                {getIcon(item.icon)}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                secondary={item.description}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondaryTypographyProps={{ 
                  variant: 'caption',
                  sx: { fontSize: '0.7rem' }
                }}
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
