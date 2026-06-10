import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import AppBar from '~/components/AppBar/AppBar'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import mainImg from '~/assets/main/main-img.png'

const quickStats = [
  { value: 'Nhận diện và Chatbot', label: 'Nhanh - Chính xác' },
  { value: '24/7', label: 'Sẵn sàng hỗ trợ' },
  { value: 'Chat với bác sĩ', label: 'Trao đổi trực tiếp' }
]

function Main() {
  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#07111f' : '#f4f7fb'
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 5 }}>
        <AppBar />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 30%), radial-gradient(circle at 85% 20%, rgba(99, 102, 241, 0.18), transparent 22%), linear-gradient(180deg, #07111f 0%, #0b1728 100%)'
            : 'radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 28%), radial-gradient(circle at 85% 18%, rgba(59, 130, 246, 0.12), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: 120,
          left: { xs: -120, md: -60 },
          width: 280,
          height: 280,
          borderRadius: '50%',
          filter: 'blur(30px)',
          opacity: 0.5,
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.32), rgba(59, 130, 246, 0.08))'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          right: -80,
          bottom: 40,
          width: 260,
          height: 260,
          borderRadius: '50%',
          filter: 'blur(34px)',
          opacity: 0.45,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.20), rgba(59, 130, 246, 0.10))'
        }}
      />

      <Box
        sx={{
          position: 'relative',
          minHeight: (theme) => `calc(100vh - ${theme.trello.appBarHeight})`,
          display: 'flex',
          alignItems: 'center',
          zIndex: 1,
          px: { xs: 2, md: 4 },
          py: { xs: 2, md: 3 }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1240,
            mx: 'auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 3, md: 4 },
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              zIndex: 1
            }}
          >
            <Chip
              icon={<AutoAwesomeRoundedIcon />}
              label='Nền tảng hỗ trợ da liễu thông minh'
              sx={{
                width: 'fit-content',
                px: 1,
                height: 38,
                fontWeight: 700,
                borderRadius: '999px',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.88)',
                color: (theme) => theme.palette.mode === 'dark' ? '#dbeafe' : '#0f172a',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.18)' : '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.10)'
              }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography
                sx={{
                  fontSize: { xs: '2rem', sm: '2.45rem', lg: '3rem' },
                  lineHeight: 1.18,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  maxWidth: 680,
                  color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a'
                }}
              >
                Hệ thống nhận diện bệnh da liễu bằng hình ảnh kết hợp chatbot tư vấn.
              </Typography>

              <Typography
                sx={{
                  fontSize: { xs: '0.96rem', md: '1rem' },
                  lineHeight: 1.7,
                  fontWeight: 700,
                  maxWidth: 600,
                  color: (theme) => theme.palette.mode === 'dark' ? 'rgba(226, 232, 240, 0.78)' : '#475569'
                }}
              >
                Trải nghiệm tư vấn da liễu thông minh, giúp người dùng nhận diện vấn đề qua hình ảnh và nhận hỗ trợ từ chatbot AI một cách nhanh chóng, rõ ràng.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  minWidth: 180,
                  height: 52,
                  px: 3,
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#38bdf8' : '#0f172a',
                  color: (theme) => theme.palette.mode === 'dark' ? '#06121f' : '#f8fafc',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 0 0 1px rgba(125, 211, 252, 0.24), 0 18px 40px rgba(14, 165, 233, 0.34), 0 0 32px rgba(56, 189, 248, 0.26)'
                    : '0 18px 40px rgba(15, 23, 42, 0.25)',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#67e8f9' : '#111c31',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 0 0 1px rgba(186, 230, 253, 0.28), 0 22px 48px rgba(14, 165, 233, 0.42), 0 0 38px rgba(103, 232, 249, 0.30)'
                      : '0 22px 45px rgba(15, 23, 42, 0.28)'
                  }
                }}
              >
                Bắt đầu ngay
              </Button>

              <Button
                variant="outlined"
                sx={{
                  minWidth: 180,
                  height: 52,
                  px: 3,
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderWidth: '1.5px',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(125, 211, 252, 0.42)' : 'rgba(15, 23, 42, 0.12)',
                  color: (theme) => theme.palette.mode === 'dark' ? '#f0f9ff' : '#0f172a',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 14px 34px rgba(8, 47, 73, 0.30), inset 0 0 0 1px rgba(186, 230, 253, 0.06)'
                    : 'none',
                  '&:hover': {
                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(186, 230, 253, 0.68)' : 'rgba(15, 23, 42, 0.24)',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.82)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 18px 40px rgba(8, 47, 73, 0.36), 0 0 28px rgba(56, 189, 248, 0.16)'
                      : 'none'
                  }
                }}
              >
                Khám phá tính năng
              </Button>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                gap: 1.5,
                maxWidth: 720
              }}
            >
              {quickStats.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 1.6,
                    borderRadius: '18px',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.56)' : 'rgba(255, 255, 255, 0.78)',
                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(148, 163, 184, 0.18)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.1rem',
                      lineHeight: 1.18,
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: (theme) => theme.palette.mode === 'dark' ? '#f8fafc' : '#0f172a'
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: '0.92rem',
                      lineHeight: 1.35,
                      fontWeight: 700,
                      letterSpacing: '-0.015em',
                      color: (theme) => theme.palette.mode === 'dark' ? 'rgba(226, 232, 240, 0.72)' : '#64748b'
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: 330, md: 500 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: { xs: '10% 2% 0', md: '8% 4% 0' },
                borderRadius: '30px',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.62)',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.14)' : '1px solid rgba(148, 163, 184, 0.18)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 30px 80px rgba(15, 23, 42, 0.16)'
              }}
            />

            <Box
              component="img"
              src={mainImg}
              alt="Skin disease assistant"
              sx={{
                position: 'relative',
                width: { xs: '95%', md: '100%' },
                maxWidth: 500,
                objectFit: 'contain',
                filter: 'drop-shadow(0 30px 50px rgba(15, 23, 42, 0.18))'
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: { xs: 12, md: 30 },
                left: { xs: 8, md: -12 },
                maxWidth: 205,
                p: 1.6,
                borderRadius: '18px',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(8, 15, 29, 0.82)' : 'rgba(255, 255, 255, 0.92)',
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#0f172a',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(148, 163, 184, 0.20)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                backdropFilter: 'blur(14px)'
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                Hỗ trợ chẩn đoán
              </Typography>
              <Typography sx={{ mt: 0.8, fontSize: '0.95rem', lineHeight: 1.6 }}>
                Kết hợp phân tích hình ảnh với hỏi đáp tư vấn trong một luồng trải nghiệm liền mạch.
              </Typography>
            </Box>

            <Box
              sx={{
                position: 'absolute',
                right: { xs: 8, md: -18 },
                bottom: { xs: 18, md: 36 },
                maxWidth: 220,
                p: 1.8,
                borderRadius: '18px',
                bgcolor: '#0f172a',
                color: '#f8fafc',
                boxShadow: '0 24px 48px rgba(15, 23, 42, 0.24)'
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#7dd3fc' }}>
                Giao diện thân thiện
              </Typography>
              <Typography sx={{ mt: 0.8, fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 }}>
                Dễ dàng sử dụng, thao tác thuận tiện cho cả bệnh nhân và bác sĩ
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  )
}

export default Main
