import { Box, Container, Grid, Paper, Typography } from '@mui/material'

export default function Dashboard() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        ダッシュボード
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary" gutterBottom>
              配送予定
            </Typography>
            <Typography variant="h3" component="div">
              45
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary" gutterBottom>
              配送完了
            </Typography>
            <Typography variant="h3" component="div" color="success.main">
              32
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary" gutterBottom>
              配送中
            </Typography>
            <Typography variant="h3" component="div" color="primary.main">
              8
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, bgcolor: '#fff3e0' }}>
            <Typography color="text.secondary" gutterBottom>
              問題
            </Typography>
            <Typography variant="h3" component="div" color="warning.main">
              2
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          配送進捗状況
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            本日の配送完了率
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, height: 30, bgcolor: '#e0e0e0', borderRadius: 15, overflow: 'hidden' }}>
              <Box sx={{ 
                width: '71%', 
                height: '100%', 
                bgcolor: 'primary.main', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                71%
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
