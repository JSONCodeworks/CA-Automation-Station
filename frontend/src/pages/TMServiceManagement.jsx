import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function TMServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({
    tms_name: '',
    tms_jsonid: '',
    tms_makeavailable: false,
    tms_icon: null
  });
  const [iconPreview, setIconPreview] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tm-services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load TM services');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setEditMode(true);
      setCurrentService(service);
      setFormData({
        tms_name: service.tms_name || '',
        tms_jsonid: service.tms_jsonid || '',
        tms_makeavailable: service.tms_makeavailable || false,
        tms_icon: null
      });
      
      // Load icon preview if exists
      if (service.has_icon) {
        setIconPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tm-services/${service.tms_id}/icon`);
      } else {
        setIconPreview(null);
      }
    } else {
      setEditMode(false);
      setCurrentService(null);
      setFormData({
        tms_name: '',
        tms_jsonid: '',
        tms_makeavailable: false,
        tms_icon: null
      });
      setIconPreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentService(null);
    setIconPreview(null);
  };

  const handleIconChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, tms_icon: reader.result }));
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.tms_name || !formData.tms_jsonid) {
        toast.error('Service name and JSON ID are required');
        return;
      }

      if (editMode && currentService) {
        await api.put(`/admin/tm-services/${currentService.tms_id}`, formData);
        toast.success('TM Service updated successfully');
      } else {
        await api.post('/admin/tm-services', formData);
        toast.success('TM Service created successfully (GUID generated)');
      }

      handleCloseDialog();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save TM service');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (tms_id, tms_name) => {
    if (!window.confirm(`Are you sure you want to delete "${tms_name}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/tm-services/${tms_id}`);
      toast.success('TM Service deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete TM service');
      console.error('Error:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">TM Service Management</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchServices}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add TM Service
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading TM services...</Typography>
      ) : services.length === 0 ? (
        <Alert severity="info">No TM services found. Click "Add TM Service" to create one.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Icon</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Service Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>JSON ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Make Available</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Service ID (GUID)</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.tms_id} hover>
                  <TableCell>
                    {service.has_icon ? (
                      <Avatar
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tm-services/${service.tms_id}/icon`}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        <ImageIcon />
                      </Avatar>
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}>
                        <ImageIcon />
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{service.tms_name}</Typography>
                  </TableCell>
                  <TableCell>{service.tms_jsonid}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.tms_makeavailable ? 'Yes' : 'No'}
                      color={service.tms_makeavailable ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {service.tms_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(service)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(service.tms_id, service.tms_name)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit TM Service' : 'Add New TM Service'}
          {editMode && currentService && (
            <Typography variant="caption" display="block" color="text.secondary">
              GUID: {currentService.tms_id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Service Name"
              value={formData.tms_name}
              onChange={(e) => handleChange('tms_name', e.target.value)}
              required
              helperText="Required"
            />

            <TextField
              fullWidth
              label="JSON ID"
              value={formData.tms_jsonid}
              onChange={(e) => handleChange('tms_jsonid', e.target.value)}
              required
              helperText="Required"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.tms_makeavailable}
                  onChange={(e) => handleChange('tms_makeavailable', e.target.checked)}
                />
              }
              label="Make Available"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Service Icon
              </Typography>
              {iconPreview && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={iconPreview}
                    alt="Icon preview"
                    style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
              >
                {iconPreview ? 'Change Icon' : 'Upload Icon'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleIconChange}
                />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Accepts image files (PNG, JPG, etc.)
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
