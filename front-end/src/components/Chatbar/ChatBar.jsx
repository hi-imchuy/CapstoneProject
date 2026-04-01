import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import InfoIcon from '@mui/icons-material/Info'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { useConfirm } from 'material-ui-confirm'

function ChatBar({ theirname, canClearMessages = false, onClearMessages }) {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const confirmClearMessages = useConfirm()

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClearMessages = () => {
    handleClose()
    if (!canClearMessages || !onClearMessages) return

    confirmClearMessages({
      title: 'Xoa toan bo tin nhan?',
      description: 'Tat ca tin nhan va hinh anh trong cuoc tro chuyen nay se bi xoa han o ca hai phia. Cuoc tro chuyen van duoc giu lai.',
      confirmationText: 'Xoa het',
      cancellationText: 'Huy'
    }).then(() => {
      onClearMessages()
    }).catch(() => {})
  }

  return(
    <Box sx={{
      width: '100%',
      height: (theme) => theme.trello.chatBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 3,
      overflowX: 'auto',
      '&::-webkit-scrollbar-track': { m: 2 },
      bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#162130' : '#34495e'),
    }}>
      <Typography sx={{
        color: (theme) => (theme.palette.mode === 'dark' ? '#f8fafc' : 'white'),
        fontWeight: 700
      }}>
        {theirname}
      </Typography>

      <Box>
        <Tooltip title="Tuy chon cuoc tro chuyen">
          <span>
            <IconButton
              onClick={handleClick}
              disabled={!canClearMessages}
              size='small'
              sx={{
                color: (theme) => (theme.palette.mode === 'dark' ? '#cbd5e1' : 'white')
              }}
            >
              <InfoIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Menu
          id="chatbar-menu"
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
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {theirname}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleClearMessages}
            sx={{
              '&:hover': {
                color: 'error.main',
                '& .clear-messages-icon': {
                  color: 'error.main'
                }
              }
            }}
          >
            <ListItemIcon>
              <DeleteSweepIcon className='clear-messages-icon' fontSize='small' />
            </ListItemIcon>
            Xoa toan bo tin nhan
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

export default ChatBar
