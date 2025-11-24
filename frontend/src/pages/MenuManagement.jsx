import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  Tabs,
  Tab,
  Chip
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  DragIndicator
} from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function MenuManagement() {
  const [tabValue, setTabValue] = useState(0)
  const [mainMenuItems, setMainMenuItems] = useState([])
  const [adminMenuItems, setAdminMenuItems] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    icon: '',
    title: '',
    route: '',
    display_order: '',
    required_role: '',
    description: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      const [mainResponse, adminResponse] = await Promise.all([
        api.get('/admin/menu-management/main'),
        api.get('/admin/menu-management/admin')
      ])
      setMainMenuItems(mainResponse.data.menuItems || [])
      setAdminMenuItems(adminResponse.data.menuItems || [])
    } catch (error) {
      toast.error('Failed to load menu items')
    }
  }

  const currentMenuType = tabValue === 0 ? 'main' : 'admin'
  const currentMenuItems = tabValue === 0 ? mainMenuItems : adminMenuItems

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        icon: item.icon,
        title: item.title,
        route: item.route,
        display_order: item.display_order,
        required_role: item.required_role || '',
        description: item.description || '',
        is_active: item.is_active
      })
    } else {
      setEditingItem(null)
      setFormData({
        icon: '',
        title: '',
        route: '',
        display_order: (currentMenuItems.length + 1).toString(),
        required_role: '',
        description: '',
        is_active: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingItem(null)
    setFormData({
      icon: '',
      title: '',
      route: '',
      display_order: '',
      required_role: '',
      description: '',
      is_active: true
    })
  }

  const handleSave = async () => {
    if (!formData.title || !formData.route || !formData.icon) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        display_order: parseInt(formData.display_order) || 0
      }

      if (editingItem) {
        await api.put(`/admin/menu-management/${currentMenuType}/${editingItem.menu_id}`, payload)
        toast.success('Menu item updated successfully')
      } else {
        await api.post(`/admin/menu-management/${currentMenuType}`, payload)
        toast.success('Menu item created successfully')
      }

      handleCloseDialog()
      loadMenus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save menu item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return

    try {
      await api.delete(`/admin/menu-management/${currentMenuType}/${menuId}`)
      toast.success('Menu item deleted successfully')
      loadMenus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete menu item')
    }
  }

  const handleToggleActive = async (item) => {
    try {
      await api.put(`/admin/menu-management/${currentMenuType}/${item.menu_id}`, {
        ...item,
        is_active: !item.is_active
      })
      toast.success('Menu item status updated')
      loadMenus()
    } catch (error) {
      toast.error('Failed to update menu item')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Menu Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage navigation menu items for main and admin sections
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Main Menu" />
          <Tab label="Admin Menu" />
        </Tabs>

        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}>Order</TableCell>
                  <TableCell>Icon</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Route</TableCell>
                  {tabValue === 0 && <TableCell>Required Role</TableCell>}
                  {tabValue === 1 && <TableCell>Description</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentMenuItems.map((item) => (
                  <TableRow key={item.menu_id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DragIndicator sx={{ color: 'text.disabled', mr: 1 }} />
                        {item.display_order}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.icon} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                    <TableCell>
                      <code style={{ fontSize: '0.85em', color: '#00d4ff' }}>{item.route}</code>
                    </TableCell>
                    {tabValue === 0 && (
                      <TableCell>
                        {item.required_role ? (
                          <Chip label={item.required_role} size="small" color="primary" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </TableCell>
                    )}
                    {tabValue === 1 && (
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {item.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Switch
                        checked={item.is_active}
                        onChange={() => handleToggleActive(item)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item.menu_id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {currentMenuItems.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No menu items found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Icon *"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            margin="normal"
            helperText="Material-UI icon name (e.g., dashboard, people, settings)"
          />
          <TextField
            fullWidth
            label="Route *"
            value={formData.route}
            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
            margin="normal"
            helperText="Navigation path (e.g., /admin/users)"
          />
          <TextField
            fullWidth
            type="number"
            label="Display Order *"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
            margin="normal"
          />
          {tabValue === 0 && (
            <TextField
              fullWidth
              label="Required Role"
              value={formData.required_role}
              onChange={(e) => setFormData({ ...formData, required_role: e.target.value })}
              margin="normal"
              helperText="Leave empty for no restriction"
            />
          )}
          {tabValue === 1 && (
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
          )}
          <Box sx={{ mt: 2 }}>
            <Switch
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <Typography component="span" sx={{ ml: 1 }}>
              Active
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
