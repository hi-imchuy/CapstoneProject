// import { useState } from 'react'
import Box from '@mui/material/Box'
import ModeSelect from '~/components/ModeSelect/ModeSelect'
import AppsIcon from '@mui/icons-material/Apps'
import trelloLogo from '~/assets/trello.svg'
import Typography from '@mui/material/Typography'
// import WorkSpace from './Menu/WorkSpace'
// import Recent from './Menu/Recent'
// import Starred from './Menu/Starred'
// import Templates from './Menu/Templates'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Profiles from './Menu/Profiles'
import SearchIcon from '@mui/icons-material/Search'
import { Link } from 'react-router-dom'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/user/userSlice'
// import Notifications from './Notifications/Notifications'
// import AutoCompleteSearchBoard from './SearchBoards/AutoCompleteSearchBoard'

function AppBar() {
  // const [searchValue, setSearchValue] = useState('')

  // const handleSearchChange = (event) => {
  //   setSearchValue(event.target.value)
  // }

  // const handleDeleteSearch = () => {
  //   setSearchValue('')
  // }

  const currentUser = useSelector(selectCurrentUser)

  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.trello.appBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 2,
      overflowX: 'auto',
      '&::-webkit-scrollbar-track': { m: 2 },
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'white' : '#2C3E50'),
      // color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link to="/">
        </Link>
        <Link to='/'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              component="img"
              src={trelloLogo}
              alt="Main"
              sx={{
                width: 20,
                height: 20,
                filter: (theme) => (theme.palette.mode === 'dark' ? 'none' : 'brightness(0) invert(1)')
              }}
            />
            <Typography component="span" sx={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
            }}>
              Trang chủ
            </Typography>
          </Box>
        </Link>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {/* <WorkSpace />
          <Recent />
          <Starred />
          <Templates /> */}
          <Button
            component={Link}
            to='/skin-detection'
            sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }}
            startIcon={<SearchIcon />}
          >
            Nhận diện bệnh
          </Button>
          <Button
            component={Link}
            to='/chat/ai'
            sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }}
            startIcon={<SmartToyIcon />}
          >
            Chat với AI
          </Button>
          <Button
            component={Link}
            to='/chat/doctor'
            sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }}
            startIcon={<QuestionAnswerIcon />}
          >
            {currentUser?.role === 'patient' ? 'Chat với Bác Sĩ' : 'Chat với Bệnh Nhân'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Tìm kiếm nhanh 1 hoặc nhiều board */}
        {/* <AutoCompleteSearchBoard /> */}

        {/* Dark light system mode */}
        <ModeSelect />

        {/* Xử lý hiển thị các thông báo */}
        {/* <Notifications /> */}

        <Tooltip
          title={
            <>
              Sinh viên thực hiện: Châu Hoàng Huy
              <br />
              Hỗ trợ xây dựng dữ liệu: Mỹ Huyền
            </>
          }
        >
          <HelpOutlineIcon sx={{ cursor: 'pointer', color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }} />
        </Tooltip>

        <Profiles />
      </Box>
    </Box>
  )
}

export default AppBar
