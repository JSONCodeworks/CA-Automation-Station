import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Divider,
  FormHelperText,
  Avatar,
  Checkbox,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// Country list (using a subset to avoid crashes - can be expanded)
const COUNTRIES = [
  "UNITED STATES OF AMERICA",
  "CANADA",
  "UNITED KINGDOM",
  "GERMANY",
  "FRANCE",
  "ITALY",
  "SPAIN",
  "AUSTRALIA",
  "JAPAN",
  "SINGAPORE",
  "INDIA",
  "UNITED ARAB EMIRATES",
  "INDONESIA",
  "BRAZIL",
  "MEXICO",
  "NETHERLANDS",
  "SWITZERLAND",
  "SWEDEN",
  "NORWAY",
  "DENMARK",
  "BELGIUM",
  "AUSTRIA",
  "IRELAND",
  "NEW ZEALAND",
  "SOUTH KOREA",
  "CHINA",
  "HONG KONG",
  "ISRAEL",
  "SOUTH AFRICA",
  "POLAND"
];

const REGIONS = [
  "America East",
  "Germany",
  "UK",
  "Australia",
  "Canada",
  "Japan",
  "Singapore",
  "India",
  "Italy",
  "Indonesia",
  "UAE"
];

export default function ISPPOCRequest() {
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [tmServices, setTmServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [iconUrls, setIconUrls] = useState({});
  const [pcloudDialogOpen, setPcloudDialogOpen] = useState(false);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);

  // Panel 1 - Form Data
  const [formData, setFormData] = useState({
    jv_customername: '',
    jv_customercountry: 'UNITED STATES OF AMERICA',
    jv_customercontactname: '',
    jv_customerphone: '',
    jv_customeremail: '',
    jv_poctype: 'INTERNAL',
    jv_tenantexpdate: null,
    jv_tenantname: '',
    jv_tenantsub: '',
    jv_tenantregion: 'America East',
    jv_sfurl: ''
  });

  // Panel 2 - Identity Options
  const [identityOptions, setIdentityOptions] = useState({
    jv_sharedenv: true,
    jv_enablesso: true,
    jv_enablemfa: true,
    jv_appgateway: false,
    jv_privlcm: false,
    jv_epauth: false,
    jv_mfassomode: 'Adaptive',
    jv_wflcm: 'Off'
  });

  // Panel 3 - Privilege Cloud Config
  const [pcloudConfig, setPcloudConfig] = useState({
    jv_pclouddeflic: true,
    jv_pcloudcustomerips: ''
  });

  const steps = [
    'Customer Information',
    'Configure Identity Options',
    'Select Products',
    'Review & Submit'
  ];

  useEffect(() => {
    fetchTMServices();
    
    // Set default expiration date (10 days from now)
    const defaultExpDate = new Date();
    defaultExpDate.setDate(defaultExpDate.getDate() + 10);
    setFormData(prev => ({ ...prev, jv_tenantexpdate: defaultExpDate }));
  }, []);

  const fetchTMServices = async () => {
    try {
      const response = await api.get('/admin/tm-services');
      const availableServices = response.data.filter(s => s.tms_makeavailable);
      setTmServices(availableServices);
      
      // Load icons
      const newIconUrls = {};
      for (const service of availableServices) {
        if (service.has_icon) {
          try {
            const iconUrl = await fetchIconWithAuth(service.tms_id);
            if (iconUrl) {
              newIconUrls[service.tms_id] = iconUrl;
            }
          } catch (error) {
            console.error(`Failed to load icon for ${service.tms_id}:`, error);
          }
        }
      }
      setIconUrls(newIconUrls);
      
    } catch (error) {
      console.error('Error fetching TM services:', error);
      toast.error('Failed to load services');
    }
  };

  const fetchIconWithAuth = async (tms_id) => {
    try {
      const response = await api.get(`/admin/tm-services/${tms_id}/icon`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'image/png' 
      });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
      
    } catch (error) {
      console.error(`Error fetching icon for ${tms_id}:`, error);
      return null;
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIdentityChange = (field, value) => {
    setIdentityOptions(prev => ({ ...prev, [field]: value }));
  };

  const handlePcloudChange = (field, value) => {
    setPcloudConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.some(s => s.tms_id === service.tms_id);
    
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.tms_id !== service.tms_id));
    } else {
      setSelectedServices([...selectedServices, service]);
      
      // Check if this is Privilege Cloud
      if (service.tms_jsonid === 'pcloud' || service.tms_name.toLowerCase().includes('privilege cloud')) {
        setPcloudDialogOpen(true);
      }
    }
  };

  const validatePanel1 = () => {
    const required = [
      'jv_customername',
      'jv_customercountry',
      'jv_customercontactname',
      'jv_customerphone',
      'jv_customeremail',
      'jv_poctype',
      'jv_tenantname',
      'jv_tenantsub',
      'jv_tenantregion'
    ];
    
    const allFilled = required.every(field => formData[field] && formData[field].trim() !== '');
    const hasExpDate = formData.jv_tenantexpdate !== null;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.jv_customeremail);
    const validSubdomain = formData.jv_tenantsub.length <= 14 && 
                           !/[.\s_]/.test(formData.jv_tenantsub);
    
    return allFilled && hasExpDate && validEmail && validSubdomain;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validatePanel1()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const generateJSON = () => {
    const servicesList = selectedServices.map(s => s.tms_jsonid).join(',');
    const isPcloudSelected = selectedServices.some(
      s => s.tms_jsonid === 'pcloud' || s.tms_name.toLowerCase().includes('privilege cloud')
    );

    const json = {
      "ISPSS Request JSON": {
        "ISPSS Request Info": {
          "Requestor": user?.email || '',
          "RequestType": "POC"
        },
        "ISPSS Base Config": {
          "CustomerName": formData.jv_customername,
          "SFGUID": "",
          "OrgType": formData.jv_poctype,
          "Customer_SF_URL": formData.jv_sfurl,
          "CustomerCountry": formData.jv_customercountry,
          "InstallDate": new Date().toISOString().split('T')[0],
          "ExpDate": formData.jv_tenantexpdate ? formData.jv_tenantexpdate.toISOString().split('T')[0] : '',
          "SE_SF_Activity_URL": "",
          "TenantName": formData.jv_tenantname,
          "Region": formData.jv_tenantregion,
          "SubDomain": formData.jv_tenantsub,
          "InstallConnectorManagement": "true",
          "TenantContactName": formData.jv_customercontactname,
          "TenantContactEmail": formData.jv_customeremail,
          "TenantContactPhone": formData.jv_customerphone,
          "Services": servicesList
        },
        "Identity Config": {
          "EnvMode": identityOptions.jv_sharedenv.toString(),
          "EnableSSO": identityOptions.jv_enablesso.toString(),
          "EnableAppGW": identityOptions.jv_appgateway.toString(),
          "EnableLCM": identityOptions.jv_privlcm.toString(),
          "EnableMFA": identityOptions.jv_enablemfa.toString(),
          "EnableEPAuth": identityOptions.jv_epauth.toString(),
          "MFA/SSO_Mode": identityOptions.jv_mfassomode,
          "WorkForceLCM": identityOptions.jv_wflcm
        }
      }
    };

    if (isPcloudSelected) {
      json["ISPSS Request JSON"]["PCloud Config"] = {
        "DefaultLicense": pcloudConfig.jv_pclouddeflic.toString(),
        "CustomerIPs": pcloudConfig.jv_pcloudcustomerips
      };
    }

    return json;
  };

  const handleSubmit = async () => {
    try {
      const pocbuildjson = generateJSON();
      
      // TODO: Implement actual submission endpoint
      console.log('Submitting POC Request:', pocbuildjson);
      
      toast.success('POC Request submitted successfully!');
      
      // Reset form
      setActiveStep(0);
      setSelectedServices([]);
      
    } catch (error) {
      console.error('Error submitting POC request:', error);
      toast.error('Failed to submit POC request');
    }
  };

  // Panel 1: Customer Information Form
  const renderPanel1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Customer Information</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Customer Name"
            value={formData.jv_customername}
            onChange={(e) => handleFormChange('jv_customername', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Customer Country</InputLabel>
            <Select
              value={formData.jv_customercountry}
              onChange={(e) => handleFormChange('jv_customercountry', e.target.value)}
              label="Customer Country"
            >
              {COUNTRIES.map(country => (
                <MenuItem key={country} value={country}>{country}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Customer Contact Name"
            value={formData.jv_customercontactname}
            onChange={(e) => handleFormChange('jv_customercontactname', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Customer Contact Phone"
            value={formData.jv_customerphone}
            onChange={(e) => handleFormChange('jv_customerphone', e.target.value)}
            helperText="Do not include special characters"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            type="email"
            label="Customer Email"
            value={formData.jv_customeremail}
            onChange={(e) => handleFormChange('jv_customeremail', e.target.value)}
            error={formData.jv_customeremail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.jv_customeremail)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Define POC Type</InputLabel>
            <Select
              value={formData.jv_poctype}
              onChange={(e) => handleFormChange('jv_poctype', e.target.value)}
              label="Define POC Type"
            >
              <MenuItem value="INTERNAL">INTERNAL</MenuItem>
              <MenuItem value="EXTERNAL">EXTERNAL</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Tenant Expiration Date *"
              value={formData.jv_tenantexpdate}
              onChange={(newValue) => handleFormChange('jv_tenantexpdate', newValue)}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true
                }
              }}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Tenant Name"
            value={formData.jv_tenantname}
            onChange={(e) => handleFormChange('jv_tenantname', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Tenant Sub-Domain"
            value={formData.jv_tenantsub}
            onChange={(e) => handleFormChange('jv_tenantsub', e.target.value)}
            helperText="Max 14 characters, no spaces, dots, or underscores"
            error={formData.jv_tenantsub && (formData.jv_tenantsub.length > 14 || /[.\s_]/.test(formData.jv_tenantsub))}
            inputProps={{ maxLength: 14 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Tenant Region</InputLabel>
            <Select
              value={formData.jv_tenantregion}
              onChange={(e) => handleFormChange('jv_tenantregion', e.target.value)}
              label="Tenant Region"
            >
              {REGIONS.map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Salesforce URL (optional)"
            value={formData.jv_sfurl}
            onChange={(e) => handleFormChange('jv_sfurl', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );

  // Panel 2: Identity Options
  const renderPanel2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Configure Identity Options</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_sharedenv}
                onChange={(e) => handleIdentityChange('jv_sharedenv', e.target.checked)}
              />
            }
            label="Shared Environment"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_enablesso}
                onChange={(e) => handleIdentityChange('jv_enablesso', e.target.checked)}
              />
            }
            label="Enable Single Sign-On"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_enablemfa}
                onChange={(e) => handleIdentityChange('jv_enablemfa', e.target.checked)}
              />
            }
            label="Enable MFA"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_appgateway}
                onChange={(e) => handleIdentityChange('jv_appgateway', e.target.checked)}
              />
            }
            label="Application Gateway"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_privlcm}
                onChange={(e) => handleIdentityChange('jv_privlcm', e.target.checked)}
              />
            }
            label="Privilege LCM"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Switch
                checked={identityOptions.jv_epauth}
                onChange={(e) => handleIdentityChange('jv_epauth', e.target.checked)}
              />
            }
            label="Endpoint Authentication"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>MFA/SSO Mode</InputLabel>
            <Select
              value={identityOptions.jv_mfassomode}
              onChange={(e) => handleIdentityChange('jv_mfassomode', e.target.value)}
              label="MFA/SSO Mode"
            >
              <MenuItem value="Adaptive">Adaptive</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Workforce LCM</InputLabel>
            <Select
              value={identityOptions.jv_wflcm}
              onChange={(e) => handleIdentityChange('jv_wflcm', e.target.value)}
              label="Workforce LCM"
            >
              <MenuItem value="Off">Off</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  // Panel 3: Select Products
  const renderPanel3 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Select Products</Typography>
      <Grid container spacing={2}>
        {tmServices.map(service => {
          const isSelected = selectedServices.some(s => s.tms_id === service.tms_id);
          
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={service.tms_id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => handleServiceToggle(service)}
              >
                <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                  {isSelected && (
                    <CheckIcon
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'primary.main'
                      }}
                    />
                  )}
                  
                  {service.has_icon && iconUrls[service.tms_id] ? (
                    <Avatar
                      src={iconUrls[service.tms_id]}
                      variant="rounded"
                      sx={{ width: 64, height: 64, margin: '0 auto 16px' }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ width: 64, height: 64, margin: '0 auto 16px', bgcolor: 'primary.main' }}
                    >
                      {service.tms_name.substring(0, 2).toUpperCase()}
                    </Avatar>
                  )}
                  
                  <Typography variant="subtitle2">{service.tms_name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selectedServices.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please select at least one product to continue
        </Alert>
      )}

      {/* Privilege Cloud Configuration Dialog */}
      <Dialog open={pcloudDialogOpen} onClose={() => setPcloudDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Privilege Cloud Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={pcloudConfig.jv_pclouddeflic}
                  onChange={(e) => handlePcloudChange('jv_pclouddeflic', e.target.checked)}
                />
              }
              label="Default License"
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Customer IP(s)"
              value={pcloudConfig.jv_pcloudcustomerips}
              onChange={(e) => handlePcloudChange('jv_pcloudcustomerips', e.target.value)}
              helperText='Use "," to separate multiple IPs (192.168.0.1, 10.0.0.5, 172.0.0.1)'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPcloudDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Panel 4: Review & Submit
  const renderPanel4 = () => {
    const pocbuildjson = generateJSON();
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>Review & Submit</Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">Customer Information</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Customer Name:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_customername}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Country:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_customercountry}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Contact Name:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_customercontactname}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Contact Phone:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_customerphone}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Contact Email:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_customeremail}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">POC Type:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_poctype}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Tenant Name:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_tenantname}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Sub-Domain:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_tenantsub}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Region:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_tenantregion}</Typography></Grid>
              
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Expiration Date:</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2">{formData.jv_tenantexpdate?.toLocaleDateString()}</Typography></Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">Identity Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(identityOptions).map(([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Chip 
                    label={key.replace('jv_', '').replace(/_/g, ' ')} 
                    color={typeof value === 'boolean' ? (value ? 'success' : 'default') : 'primary'}
                    size="small"
                  />
                  <Typography variant="body2" display="inline" sx={{ ml: 1 }}>
                    {typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">Selected Products ({selectedServices.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedServices.map(service => (
                <Chip key={service.tms_id} label={service.tms_name} color="primary" />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={() => setJsonDialogOpen(true)}
          >
            View Generated JSON
          </Button>
        </Box>

        {/* JSON Preview Dialog */}
        <Dialog open={jsonDialogOpen} onClose={() => setJsonDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Generated POC Request JSON</DialogTitle>
          <DialogContent>
            <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', overflow: 'auto', maxHeight: '70vh' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                {JSON.stringify(pocbuildjson, null, 2)}
              </pre>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(pocbuildjson, null, 2));
              toast.success('JSON copied to clipboard');
            }}>
              Copy to Clipboard
            </Button>
            <Button onClick={() => setJsonDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>CyberArk ISP POC Request</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '400px' }}>
          {activeStep === 0 && renderPanel1()}
          {activeStep === 1 && renderPanel2()}
          {activeStep === 2 && renderPanel3()}
          {activeStep === 3 && renderPanel4()}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              disabled={activeStep === 0 && !validatePanel1()}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              endIcon={<SendIcon />}
              disabled={selectedServices.length === 0}
            >
              Submit POC Request
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
