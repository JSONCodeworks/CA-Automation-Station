import { Box, Typography, Card, CardContent, Grid } from '@mui/material'
import { CloudQueue, CloudDone, Computer } from '@mui/icons-material'

export default function ResourcesLanding() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Create Resources
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Select a resource type from the menu to begin deployment
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudQueue sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6">CyberArk ISP</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Deploy CyberArk Identity Security Platform POC environment
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudDone sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Typography variant="h6">CyberArk TestDrive</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Deploy CyberArk TestDrive POV environment for customer demonstrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Computer sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Typography variant="h6">SkyTap Environment</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Deploy virtual lab environment on SkyTap platform
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
