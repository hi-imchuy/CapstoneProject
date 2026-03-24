import { useState } from 'react'
import Box from '@mui/material/Box'
import ModeSelect from '~/components/ModeSelect/ModeSelect'
import AppsIcon from '@mui/icons-material/Apps'
import trelloLogo from '~/assets/trello.svg'
import Typography from '@mui/material/Typography'
import WorkSpace from './Menu/WorkSpace'
import Recent from './Menu/Recent'
import Starred from './Menu/Starred'
import Templates from './Menu/Templates'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Profiles from './Menu/Profiles'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import { Link } from 'react-router-dom'
// import Notifications from './Notifications/Notifications'
// import AutoCompleteSearchBoard from './SearchBoards/AutoCompleteSearchBoard'

function AppBar() {
  const [searchValue, setSearchValue] = useState('')

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value)
  }

  const handleDeleteSearch = () => {
    setSearchValue('')
  }

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
        <Link to="/boards">
          <Tooltip title="Board List">
            <AppsIcon sx={{ color: 'background.default', verticalAlign: 'middle' }} />
          </Tooltip>
        </Link>
        <Link to='/'>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              component="img"
              src={trelloLogo}
              alt="Trello"
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
              Trello
            </Typography>
          </Box>
        </Link>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <WorkSpace />
          <Recent />
          <Starred />
          <Templates />
          <Button
            sx={{ color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }}
            startIcon={<LibraryAddIcon />}
          >
            Create
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

        <Tooltip title="Help">
          <HelpOutlineIcon sx={{ cursor: 'pointer', color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white') }} />
        </Tooltip>

        <Profiles />
      </Box>
    </Box>
  )
}

export default AppBar
