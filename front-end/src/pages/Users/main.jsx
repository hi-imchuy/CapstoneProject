import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import AppBar from "~/components/AppBar/AppBar"
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import mainImg from '~/assets/main/main-img.png'

function Main() {
  return(
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2C3E50' : '#f5f6fa'
      }}
    >
      <AppBar/>
      <Box
        sx={{
          width: '100%',
          height: (theme) => theme.trello.boardContentHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Box
          sx={{
            maxWidth: '900px',
            maxHeight: '583px',
            p: 3,
            bgcolor: (theme) => theme.palette.mode === 'light' ? '#2C3E50' : '#f5f6fa',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            gap: 20,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
          <Typography
            variant='h4'
            sx={{
              fontWeight: 'bold',
              whiteSpace: 'pre-wrap',
              maxWidth: '65%',
              color: (theme) => theme.palette.mode === 'dark' ? '#2C3E50' : '#f5f6fa'
            }}>
            Hệ Thống Nhận Diện Bệnh Da Liễu Bằng Hình Ảnh Kết Hợp Chatbot Hỏi Đáp Tư Vấn
          </Typography>
          <Typography
            variant='h6'
            sx={{maxWidth: '50%', color: (theme) => theme.palette.mode === 'dark' ? '#2C3E50' : '#f5f6fa'}}
          >
            Tích hợp trí tuệ nhân tạo, đồ thị tri thức để nhận diện bệnh da liễu bằng hình ảnh và chatbot hỏi đáp tư vấn
          </Typography>
          </Box>

          <Button
            variant='contained'
            sx={{
              backgroundColor: (theme) => theme.palette.mode === 'light' ? '#ffffff' : '#2C3E50',
              color: (theme) => theme.palette.mode === 'light' ? '#2C3E50' : '#ffffff',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f0f0f0' : '#1f2b3c'
              }
            }}
          >
            Bắt đầu ngay
          </Button>

          <Box
            component='img'
            src={mainImg}
            alt='main'
            sx={{
              position: 'absolute',
              right: 0,
              bottom: -10,
              width: '52%',
              maxWidth: 540,
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        </Box>
      </Box>
    </Container>
  )
}

export default Main
