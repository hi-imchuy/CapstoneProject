import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

function PageLoadingSpinner({ caption }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', gap: 2 }}>
      <CircularProgress />
      <Typography>{caption}</Typography>
    </Box>
  )
}

export default PageLoadingSpinner