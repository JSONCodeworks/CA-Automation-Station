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
  Alert,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material'
import {
  Add,
  Delete,
  Block,
  CheckCircle,
  Edit,
  Visibility,
  VisibilityOff,
  PersonAdd
} from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    title: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

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

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      // Edit mode
      setSelectedUser(user)
      setUserForm({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        full_name: user.full_name || '',
        title: user.title || ''
      })
    } else {
      // Add mode
      setSelectedUser(null)
      setUserForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        title: ''
      })
    }
    setOpenUserDialog(true)
  }

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false)
    setSelectedUser(null)
    setUserForm({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      title: ''
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSaveUser = async () => {
    // Validation
    if (!userForm.username || !userForm.email) {
      toast.error('Username and email are required')
      return
    }

    if (!selectedUser) {
      // Adding new user - password required
      if (!userForm.password) {
        toast.error('Password is required for new users')
        return
      }
      if (userForm.password !== userForm.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (userForm.password.length < 8) {
        toast.error('Password must be at least 8 characters')
        return
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userForm.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      if (selectedUser) {
        // Update existing user
        await api.put(`/admin/users/${selectedUser.user_id}`, {
          email: userForm.email,
          full_name: userForm.full_name,
          title: userForm.title
        })
        toast.success('User updated successfully')
      } else {
        // Create new user
        await api.post('/auth/register', {
          username: userForm.username,
          email: userForm.email,
          password: userForm.password,
          fullName: userForm.full_name,
          title: userForm.title
        })
        toast.success('User created successfully')
      }
      handleCloseUserDialog()
      loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${selectedUser ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user)
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    })
    setOpenPasswordDialog(true)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false)
    setSelectedUser(null)
    setPasswordForm({
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword) {
      toast.error('Password is required')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.put(`/admin/users/${selectedUser.user_id}/password`, {
        password: passwordForm.newPassword
      })
      toast.success('Password updated successfully')
      handleClosePasswordDialog()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password')
    } finally {
      setLoading(false)
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
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenUserDialog()}
          size="large"
        >
          Add New User
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Note:</strong> You cannot disable or delete your own account. New users must change their password on first login.
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
                  <TableCell>Title</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id} hover>
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
                      <Typography variant="caption" color="text.secondary">
                        {user.title || '-'}
                      </Typography>
                    </TableCell>
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
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenUserDialog(user)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {!user.is_sso_user && (
                          <Tooltip title="Change Password">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenPasswordDialog(user)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Add Role">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedUser(user)
                              setOpenRoleDialog(true)
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={user.is_active ? "Disable User" : "Enable User"}>
                          <IconButton
                            size="small"
                            color={user.is_active ? "warning" : "success"}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
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
                            <Delete fontSize="small" />
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
                No users found. Click "Add New User" to create your first user.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? `Edit User: ${selectedUser.username}` : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Username *"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              disabled={!!selectedUser}
              margin="normal"
              helperText={selectedUser ? "Username cannot be changed" : "Unique username for login"}
            />
            
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Full Name"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Title"
              value={userForm.title}
              onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
              margin="normal"
              helperText="Job title or role"
            />

            {!selectedUser && (
              <>
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  Password must be at least 8 characters long
                </Alert>

                <TextField
                  fullWidth
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  margin="normal"
                  error={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''}
                  helperText={
                    userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''
                      ? 'Passwords do not match'
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </>
            )}

            {selectedUser && (
              <Alert severity="info" sx={{ mt: 2 }}>
                To change this user's password, use the "Change Password" button in the actions menu.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : selectedUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Change Password: {selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
            Password must be at least 8 characters long
          </Alert>

          <TextField
            fullWidth
            label="New Password *"
            type={showPassword ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password *"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            margin="normal"
            error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
            helperText={
              passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

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
