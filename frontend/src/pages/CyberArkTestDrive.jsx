import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Send, Cancel, CheckCircle } from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function CyberArkTestDrive() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [tdbuildJSON, setTdbuildJSON] = useState(null)
  const [apiResponse, setApiResponse] = useState(null)
  const [showResponse, setShowResponse] = useState(false)
  
  const [formData, setFormData] = useState({
    owner_email: user?.email || '',
    owner_phone: user?.phone_number || '',
    company_name: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_type: 'External',
    expiry_date: null,
    tenant_name: '',
    sf_url: '',
    template_id: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.get('/epod-templates')
      setTemplates(response.data.templates || [])
    } catch (error) {
      toast.error('Failed to load templates')
    }
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleVerify = () => {
    // Validation
    if (!formData.owner_email || !formData.company_name || !formData.customer_name || 
        !formData.customer_email || !formData.tenant_name || !formData.template_id || !formData.expiry_date) {
      toast.error('Please fill in all required fields')
      return
    }

    // Find selected template
    const selectedTemplate = templates.find(t => t.template_id === formData.template_id)
    
    // Create JSON envelope
    const jsonData = {
      id: formData.template_id,
      owner_email: formData.owner_email,
      owner_phone: formData.owner_phone,
      company_name: formData.company_name,
      customer_type: formData.customer_type,
      sf_url: formData.sf_url,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      tenant_name: formData.tenant_name,
      tenant_type: 'POV',
      expiry_date: formData.expiry_date ? formData.expiry_date.toISOString().split('T')[0] : '',
      skytap_userdata: ''
    }

    setTdbuildJSON(jsonData)
    setShowConfirmation(true)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setTdbuildJSON(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await api.post('/pss-request/deploy', {
        tdbuildJSON: tdbuildJSON
      })
      
      setApiResponse(response.data)
      setShowConfirmation(false)
      setShowResponse(true)
      toast.success('Deployment request submitted successfully!')
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit deployment request')
      console.error('Submission error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseResponse = () => {
    setShowResponse(false)
    setApiResponse(null)
    navigate('/dashboard')
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          CyberArk TestDrive (POV) Deployment
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Deploy a CyberArk TestDrive environment for Proof of Value
        </Typography>

        <Card>
          <CardContent>
            <Grid container spacing={3}>
              {/* Element 1: Test Drive Owner */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Test Drive Owner *"
                  value={formData.owner_email}
                  onChange={(e) => handleChange('owner_email', e.target.value)}
                  helperText="Email address of the test drive owner"
                />
              </Grid>

              {/* Element 2: Owner Phone */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Phone"
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange('owner_phone', e.target.value)}
                  helperText="Your contact phone number"
                />
              </Grid>

              {/* Element 3: Company Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name *"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  helperText="Name of the company"
                />
              </Grid>

              {/* Element 4: Customer Contact Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Contact Name *"
                  value={formData.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  helperText="Primary contact person"
                />
              </Grid>

              {/* Element 5: Customer Contact Phone */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Contact Phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange('customer_phone', e.target.value)}
                  helperText="Customer's phone number"
                />
              </Grid>

              {/* Element 6: Customer Contact Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Contact Email *"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                  helperText="Customer's email address"
                />
              </Grid>

              {/* Element 7: Customer Type */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Customer Type *"
                  value={formData.customer_type}
                  onChange={(e) => handleChange('customer_type', e.target.value)}
                  helperText="Internal or external customer"
                >
                  <MenuItem value="Internal">Internal</MenuItem>
                  <MenuItem value="External">External</MenuItem>
                </TextField>
              </Grid>

              {/* Element 8: Tenant Expiration Date */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Tenant Expiration Date *"
                  value={formData.expiry_date}
                  onChange={(newValue) => handleChange('expiry_date', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: 'When should the tenant expire?'
                    }
                  }}
                />
              </Grid>

              {/* Element 9: Tenant Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tenant Name *"
                  value={formData.tenant_name}
                  onChange={(e) => handleChange('tenant_name', e.target.value)}
                  helperText="Unique name for this tenant"
                />
              </Grid>

              {/* Element 10: Salesforce URL */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Salesforce URL (optional)"
                  value={formData.sf_url}
                  onChange={(e) => handleChange('sf_url', e.target.value)}
                  placeholder="optional"
                  helperText="Link to Salesforce opportunity"
                />
              </Grid>

              {/* Element 11: Template Selection */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="ePOD Template *"
                  value={formData.template_id}
                  onChange={(e) => handleChange('template_id', e.target.value)}
                  helperText="Select the deployment template"
                >
                  {templates.map((template) => (
                    <MenuItem key={template.template_id} value={template.template_id}>
                      {template.template_name}
                      {template.template_description && ` - ${template.template_description}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CheckCircle />}
                  onClick={handleVerify}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Verify & Review
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onClose={handleCancel} maxWidth="md" fullWidth>
          <DialogTitle>Review Deployment Request</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please review the deployment details below. Click Submit to proceed.
            </Alert>
            
            <Paper elevation={0} sx={{ bgcolor: 'grey.900', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                JSON Payload:
              </Typography>
              <pre style={{ 
                fontSize: '0.85rem', 
                overflow: 'auto', 
                margin: '8px 0 0 0',
                color: '#00d4ff'
              }}>
                {JSON.stringify(tdbuildJSON, null, 2)}
              </pre>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} startIcon={<Cancel />} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Response Dialog */}
        <Dialog open={showResponse} onClose={handleCloseResponse} maxWidth="md" fullWidth>
          <DialogTitle>Deployment Request Response</DialogTitle>
          <DialogContent>
            {apiResponse?.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="h6">Request Submitted Successfully!</Typography>
                <Typography variant="body2">
                  Your TestDrive deployment request has been submitted.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6">Request Failed</Typography>
                <Typography variant="body2">
                  {apiResponse?.error || 'An error occurred'}
                </Typography>
              </Alert>
            )}
            
            <Paper elevation={0} sx={{ bgcolor: 'grey.900', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                API Response:
              </Typography>
              <pre style={{ 
                fontSize: '0.85rem', 
                overflow: 'auto', 
                margin: '8px 0 0 0',
                color: '#00d4ff'
              }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResponse} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
