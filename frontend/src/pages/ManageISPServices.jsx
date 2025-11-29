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
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function ManageISPServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    service_description: '',
    service_category: '',
    service_status: 'Active',
    pricing_model: '',
    base_price: '',
    setup_fee: '',
    billing_cycle: '',
    contract_length: '',
    bandwidth_limit: '',
    storage_limit: '',
    user_limit: '',
    support_level: '',
    sla_uptime: '',
    features: '',
    restrictions: '',
    documentation_url: '',
    is_active: true,
    is_public: true,
    display_order: 0
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/isp-services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load ISP services');
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
        service_name: service.service_name || '',
        service_description: service.service_description || '',
        service_category: service.service_category || '',
        service_status: service.service_status || 'Active',
        pricing_model: service.pricing_model || '',
        base_price: service.base_price || '',
        setup_fee: service.setup_fee || '',
        billing_cycle: service.billing_cycle || '',
        contract_length: service.contract_length || '',
        bandwidth_limit: service.bandwidth_limit || '',
        storage_limit: service.storage_limit || '',
        user_limit: service.user_limit || '',
        support_level: service.support_level || '',
        sla_uptime: service.sla_uptime || '',
        features: service.features || '',
        restrictions: service.restrictions || '',
        documentation_url: service.documentation_url || '',
        is_active: service.is_active !== undefined ? service.is_active : true,
        is_public: service.is_public !== undefined ? service.is_public : true,
        display_order: service.display_order || 0
      });
    } else {
      setEditMode(false);
      setCurrentService(null);
      setFormData({
        service_name: '',
        service_description: '',
        service_category: '',
        service_status: 'Active',
        pricing_model: '',
        base_price: '',
        setup_fee: '',
        billing_cycle: '',
        contract_length: '',
        bandwidth_limit: '',
        storage_limit: '',
        user_limit: '',
        support_level: '',
        sla_uptime: '',
        features: '',
        restrictions: '',
        documentation_url: '',
        is_active: true,
        is_public: true,
        display_order: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentService(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.service_name) {
        toast.error('Service name is required');
        return;
      }

      if (editMode && currentService) {
        await api.put(`/admin/isp-services/${currentService.scv_id}`, formData);
        toast.success('Service updated successfully');
      } else {
        await api.post('/admin/isp-services', formData);
        toast.success('Service created successfully (GUID generated)');
      }

      handleCloseDialog();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save service');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (scv_id, service_name) => {
    if (!window.confirm(`Are you sure you want to delete "${service_name}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/isp-services/${scv_id}`);
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete service');
      console.error('Error:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Deprecated': return 'warning';
      case 'Beta': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage ISP Services</Typography>
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
            Add Service
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading services...</Typography>
      ) : services.length === 0 ? (
        <Alert severity="info">No ISP services found. Click "Add Service" to create one.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Service Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pricing</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Base Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Support</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SLA</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Active</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.scv_id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{service.service_name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      ID: {service.scv_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{service.service_category || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.service_status}
                      color={getStatusColor(service.service_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{service.pricing_model || '-'}</TableCell>
                  <TableCell>
                    {service.base_price ? `$${parseFloat(service.base_price).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{service.support_level || '-'}</TableCell>
                  <TableCell>{service.sla_uptime ? `${service.sla_uptime}%` : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.is_active ? 'Yes' : 'No'}
                      color={service.is_active ? 'success' : 'default'}
                      size="small"
                    />
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
                        onClick={() => handleDelete(service.scv_id, service.service_name)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit ISP Service' : 'Add New ISP Service'}
          {editMode && currentService && (
            <Typography variant="caption" display="block" color="text.secondary">
              GUID: {currentService.scv_id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Service Name"
                value={formData.service_name}
                onChange={(e) => handleChange('service_name', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.service_status}
                onChange={(e) => handleChange('service_status', e.target.value)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Beta">Beta</MenuItem>
                <MenuItem value="Deprecated">Deprecated</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.service_description}
                onChange={(e) => handleChange('service_description', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.service_category}
                onChange={(e) => handleChange('service_category', e.target.value)}
                placeholder="e.g., Privilege Cloud, Identity Security"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Documentation URL"
                value={formData.documentation_url}
                onChange={(e) => handleChange('documentation_url', e.target.value)}
                placeholder="https://..."
              />
            </Grid>

            {/* Pricing Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Pricing & Billing
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pricing Model"
                value={formData.pricing_model}
                onChange={(e) => handleChange('pricing_model', e.target.value)}
                placeholder="e.g., Per User/Month"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Base Price ($)"
                value={formData.base_price}
                onChange={(e) => handleChange('base_price', e.target.value)}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Setup Fee ($)"
                value={formData.setup_fee}
                onChange={(e) => handleChange('setup_fee', e.target.value)}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Billing Cycle"
                value={formData.billing_cycle}
                onChange={(e) => handleChange('billing_cycle', e.target.value)}
                placeholder="e.g., Monthly, Annual"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Contract Length (months)"
                value={formData.contract_length}
                onChange={(e) => handleChange('contract_length', e.target.value)}
                inputProps={{ min: '0' }}
              />
            </Grid>

            {/* Technical Specifications */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Technical Specifications
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bandwidth Limit"
                value={formData.bandwidth_limit}
                onChange={(e) => handleChange('bandwidth_limit', e.target.value)}
                placeholder="e.g., Unlimited, 100 Mbps"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Storage Limit"
                value={formData.storage_limit}
                onChange={(e) => handleChange('storage_limit', e.target.value)}
                placeholder="e.g., 100 GB, Unlimited"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="User Limit"
                value={formData.user_limit}
                onChange={(e) => handleChange('user_limit', e.target.value)}
                inputProps={{ min: '0' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Support Level"
                value={formData.support_level}
                onChange={(e) => handleChange('support_level', e.target.value)}
                placeholder="e.g., Standard Support, Premium Support"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="SLA Uptime (%)"
                value={formData.sla_uptime}
                onChange={(e) => handleChange('sla_uptime', e.target.value)}
                inputProps={{ step: '0.01', min: '0', max: '100' }}
              />
            </Grid>

            {/* Features & Restrictions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Features & Restrictions
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Features"
                value={formData.features}
                onChange={(e) => handleChange('features', e.target.value)}
                placeholder="Comma-separated list of features"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Restrictions"
                value={formData.restrictions}
                onChange={(e) => handleChange('restrictions', e.target.value)}
                placeholder="Any limitations or restrictions"
              />
            </Grid>

            {/* Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Settings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_public}
                    onChange={(e) => handleChange('is_public', e.target.checked)}
                  />
                }
                label="Public"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', e.target.value)}
                inputProps={{ min: '0' }}
              />
            </Grid>
          </Grid>
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
