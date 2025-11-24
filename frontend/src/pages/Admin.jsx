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
  TextField
} from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')

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
    try {
      await api.post(`/admin/users/${selectedUser.user_id}/roles`, {
        role_name: newRole
      })
      toast.success('Role added successfully')
      setOpenDialog(false)
      setNewRole('')
      loadUsers()
    } catch (error) {
      toast.error('Failed to add role')
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        User Administration
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>SSO User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      {user.roles?.split(',').map((role, i) => (
                        <Chip key={i} label={role} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {user.is_sso_user ? (
                        <Chip label="SSO" color="primary" size="small" />
                      ) : (
                        <Chip label="Local" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Chip label="Active" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" color="error" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => {
                          setSelectedUser(user)
                          setOpenDialog(true)
                        }}
                      >
                        Add Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Role to {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            helperText="e.g., admin, developer, user"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddRole} variant="contained">
            Add Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
