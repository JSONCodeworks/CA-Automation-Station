import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Save,
  Refresh,
  Image as ImageIcon,
  Edit
} from '@mui/icons-material'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function AppConfiguration() {
  const [config, setConfig] = useState({
    app_title: '',
    app_logo: '',
    welcome_message: '',
    sso_enabled: false,
    slack_enabled: false,
    theme: 'dark'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await api.get('/config')
      const configData = {}
      
      response.data.config.forEach(item => {
        if (item.config_key === 'sso_enabled' || item.config_key === 'slack_enabled') {
          configData[item.config_key] = item.config_value === 'true'
        } else {
          configData[item.config_key] = item.config_value
        }
      })
      
      setConfig(configData)
    } catch (error) {
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key, value) => {
    setSaving(true)
    try {
      await api.put(`/config/${key}`, { value: value.toString() })
      toast.success(`${key.replace(/_/g, ' ')} updated successfully`)
      loadConfig()
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to update ${key}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(config).map(([key, value]) =>
        api.put(`/config/${key}`, { value: value.toString() })
      )
      await Promise.all(updates)
      toast.success('All settings saved successfully')
      loadConfig()
    } catch (error) {
      toast.error('Failed to save some settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => {
    setConfig({ ...config, [key]: value })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography>Loading configuration...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            App Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customize application title, logo, and general settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadConfig}
            disabled={saving}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes to the app title and logo will take effect after the page is refreshed.
      </Alert>

      <Grid container spacing={3}>
        {/* Branding Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Branding & Appearance
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Application Title"
                    value={config.app_title || ''}
                    onChange={(e) => handleChange('app_title', e.target.value)}
                    helperText="Displayed in the top bar and browser title"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => handleSave('app_title', config.app_title)}
                          disabled={saving}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Welcome Message"
                    value={config.welcome_message || ''}
                    onChange={(e) => handleChange('welcome_message', e.target.value)}
                    helperText="Shown on the dashboard landing page"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => handleSave('welcome_message', config.welcome_message)}
                          disabled={saving}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Application Logo
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        URL or path to logo image
                      </Typography>
                    </Box>
                    <Avatar
                      src={config.app_logo}
                      variant="rounded"
                      sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
                    >
                      <ImageIcon />
                    </Avatar>
                  </Box>
                  <TextField
                    fullWidth
                    label="Logo URL"
                    value={config.app_logo || ''}
                    onChange={(e) => handleChange('app_logo', e.target.value)}
                    helperText="Enter a URL or path (e.g., /assets/logo.png)"
                    sx={{ mt: 2 }}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          onClick={() => handleSave('app_logo', config.app_logo)}
                          disabled={saving}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Theme"
                    value={config.theme || 'dark'}
                    onChange={(e) => handleChange('theme', e.target.value)}
                    SelectProps={{ native: true }}
                    helperText="Application color theme"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Integrations Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Integrations
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        CyberArk SSO
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable single sign-on authentication
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.sso_enabled || false}
                          onChange={(e) => {
                            handleChange('sso_enabled', e.target.checked)
                            handleSave('sso_enabled', e.target.checked)
                          }}
                          disabled={saving}
                        />
                      }
                      label=""
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Slack Integration
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable Slack notifications
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.slack_enabled || false}
                          onChange={(e) => {
                            handleChange('slack_enabled', e.target.checked)
                            handleSave('slack_enabled', e.target.checked)
                          }}
                          disabled={saving}
                        />
                      }
                      label=""
                    />
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <strong>Note:</strong> Integrations require additional configuration in the backend .env file.
                Toggling these switches only enables/disables the features in the UI.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Application Version
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    1.0.0
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Database
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    MSSQL - Connected
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Environment
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Development
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    API Status
                  </Typography>
                  <Typography variant="body1" fontWeight={500} color="success.main">
                    ● Online
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
