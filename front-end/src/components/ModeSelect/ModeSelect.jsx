import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeOutLineIcon from '@mui/icons-material/DarkModeOutlined'
import SettingsBrightness from '@mui/icons-material/SettingsBrightness'
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  // eslint-disable-next-line no-unused-vars
  experimental_extendTheme as extendTheme,
  useColorScheme
} from '@mui/material/styles'

function ModeSelect() {
  const { mode, setMode } = useColorScheme()
  const handleChange = (event) => {
    const selectedMode = event.target.value
    setMode(selectedMode)
  }

  return (
    <FormControl
      size='small'
      sx={{
        minWidth: '120px',
        '& .MuiInputLabel-root': {
          color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
        },
        '& .MuiOutlinedInput-root': {
          color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white'),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
          }
        },
        '& .MuiSvgIcon-root': {
          color: (theme) => (theme.palette.mode === 'dark' ? '#2C3E50' : 'white')
        }
      }}
    >
      <InputLabel
        id="label-select-dark-light-mode"
      >
        Mode
      </InputLabel>
      <Select
        labelId="label-select-dark-light-mode"
        id="select-dark-light-mode"
        value={mode}
        label="Mode"
        onChange={handleChange}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#2C3E50'
            }
          },
          MenuListProps: {
            sx: {
              backgroundColor: '#ffffff',
              color: '#2C3E50'
            }
          }
        }}
      >
        <MenuItem value="light" sx={{ color: '#2C3E50' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LightModeIcon fontSize='small' sx={{ color: '#2C3E50' }}/>
            Light
          </Box>
        </MenuItem>
        <MenuItem value="dark" sx={{ color: '#2C3E50' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DarkModeOutLineIcon fontSize='small' sx={{ color: '#2C3E50' }}/>
            Dark
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsBrightness fontSize='small'/> System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  )
}

export default ModeSelect
