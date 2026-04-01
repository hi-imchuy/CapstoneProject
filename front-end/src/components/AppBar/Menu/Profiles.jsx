import React from 'react'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Settings from '@mui/icons-material/Settings'
import Logout from '@mui/icons-material/Logout'
import { useDispatch, useSelector } from 'react-redux'
import { selectCurrentUser, logoutUserAPI } from '~/redux/user/userSlice'
import { useConfirm } from 'material-ui-confirm'
import { Link } from 'react-router-dom'
import { Button } from '@mui/material'

function Profiles() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const confirmLogout = useConfirm()
  const handleLogout = () => {
    confirmLogout({
      title: 'Log out your account?',
      confirmationText: 'Logout',
      cancellationText: 'Cancel',
      dialogProps: {
        sx: {
          '& .MuiDialog-paper': {
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'
          }
        }
      },
      titleProps: {
        sx: {
          color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
        }
      },
      cancellationButtonProps: {
        sx: {
          color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
        }
      }
    }).then(() => {
      dispatch(logoutUserAPI())
    }).catch(() => {})
  }

  return (
    (currentUser === null ?
    <Link to='/login'>
      <Button
        variant='contained'
        sx={{
          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#ffffff' : '#2C3E50',
          color: (theme) => theme.palette.mode === 'light' ? '#2C3E50' : '#ffffff',
          '&:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f0f0f0' : '#1f2b3c'
          }
        }}>
        Login
      </Button>
    </Link>
    
    : <Box>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ padding: 0 }}
          aria-controls={open ? 'account-menu-profiles' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar sx={{ width: 36, height: 36 }}
            alt='Chauhuyne'
            src={currentUser?.avatar} />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu-profiles"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#ffffff',
              color: '#2C3E50'
            }
          },
          list: {
            'aria-labelledby': 'basic-button-profiles',
            sx: {
              bgcolor: '#ffffff',
              color: '#2C3E50',
              '& .MuiListItemIcon-root': {
                color: '#2C3E50'
              }
            }
          }
        }}
      >
        <Link to="/settings/account" style={{ color: 'inherit' }}>
          <MenuItem sx={{
            '&:hover': { color: 'success.light' }
          }}>
            <Avatar
              sx={{ width: 28, height: 28, mr: 2 }}
              src={currentUser?.avatar}
            /> Profile
          </MenuItem>
        </Link>
        <Divider />
        <MenuItem>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Add another account
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{
          '&:hover': { color: 'warning.dark', '& .logout-icon': { color: 'warning.dark' } }
        }}>
          <ListItemIcon>
            <Logout className='logout-icon' fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>)
  )
}

export default Profiles
