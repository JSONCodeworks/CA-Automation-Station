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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material'
import {
  Add,
  Delete,
  Block,
  CheckCircle
} from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.users || [])
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      toast.error('Please enter a role name')
      return
    }
    
    setLoading(true)
    try {
      await api.post(`/admin/users/${selectedUser.user_id}/roles`, {
        role_name: newRole.trim()
      })
      toast.success('Role added successfully')
      setOpenRoleDialog(false)
      setNewRole('')
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add role')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRole = async (userId, roleName) => {
    if (!window.confirm(`Remove role "${roleName}" from this user?`)) return
    
    try {
      await api.delete(`/admin/users/${userId}/roles/${roleName}`)
      toast.success('Role removed successfully')
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove role')
    }
  }

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active
    const action = newStatus ? 'enable' : 'disable'
    
    if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return
    
    try {
      await api.put(`/admin/users/${user.user_id}/disable`, {
        is_active: newStatus
      })
      toast.success(`User ${action}d successfully`)
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} user`)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    setLoading(true)
    try {
      await api.delete(`/admin/users/${selectedUser.user_id}`)
      toast.success('User deleted successfully')
      setOpenDeleteDialog(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts, roles, and permissions
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Note:</strong> You cannot disable or delete your own account. Users with the "admin" role have full system access.
      </Alert>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      {user.is_active ? (
                        <Chip 
                          icon={<CheckCircle />} 
                          label="Active" 
                          color="success" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          icon={<Block />} 
                          label="Disabled" 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.roles?.split(',').map((role, i) => (
                          <Chip 
                            key={i} 
                            label={role} 
                            size="small"
                            color={role === 'admin' ? 'primary' : 'default'}
                            onDelete={() => handleRemoveRole(user.user_id, role)}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.is_sso_user ? (
                        <Chip label="SSO" color="primary" size="small" />
                      ) : (
                        <Chip label="Local" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(user.last_login)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Add Role">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedUser(user)
                              setOpenRoleDialog(true)
                            }}
                          >
                            <Add />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={user.is_active ? "Disable User" : "Enable User"}>
                          <IconButton
                            size="small"
                            color={user.is_active ? "warning" : "success"}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? <Block /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedUser(user)
                              setOpenDeleteDialog(true)
                            }}
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

          {users.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No users found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => !loading && setOpenRoleDialog(false)}>
        <DialogTitle>Add Role to {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            helperText="e.g., admin, developer, viewer"
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAddRole} variant="contained" disabled={loading}>
            {loading ? 'Adding...' : 'Add Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => !loading && setOpenDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>Warning:</strong> This action cannot be undone!
          </Alert>
          <Typography>
            Are you sure you want to permanently delete <strong>{selectedUser?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This will remove:
          </Typography>
          <ul>
            <li><Typography variant="body2">User account</Typography></li>
            <li><Typography variant="body2">All assigned roles</Typography></li>
            <li><Typography variant="body2">User preferences</Typography></li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
