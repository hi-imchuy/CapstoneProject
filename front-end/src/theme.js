import { createTheme } from '@mui/material/styles'

const APP_BAR_HEIGHT = '58px'
// const BOARD_BAR_HEIGHT = '60px'
const BOARD_BAR_HEIGHT = '0px'
const BOARD_CONTENT_HEIGHT = `calc(100vh - ${APP_BAR_HEIGHT} - ${BOARD_BAR_HEIGHT})`
const COLUMN_HEADER_HEIGHT = '50px'
const COLUMN_FOOTER_HEIGHT = '56px'

// Create a theme instance.
const theme = createTheme({
  trello: {
    appBarHeight: APP_BAR_HEIGHT,
    boardHeaderHeight: BOARD_BAR_HEIGHT,
    boardContentHeight: BOARD_CONTENT_HEIGHT,
    columnHeaderHeight: COLUMN_HEADER_HEIGHT,
    columnFooterHeight: COLUMN_FOOTER_HEIGHT
  },
  palette: {
    primary: {
      main: '#2C3E50'
    }
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2C3E50' },
        background: {
          default: '#f5f6fa',
          paper: '#ffffff',
        },
        text: {
          primary: '#ffffff'
        }
      }
    },
    dark: {
      palette: {
        primary: { main: '#2C3E50' },
        background: {
          default: '#2C3E50',
          paper: '#34495e',
        },
        text: {
          primary: '#2C3E50'
        }
      }
    }
  },
  components:{
    MuiCssBaseline:{
      styleOverrides:{
        body: {
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '*::-webkit-scrollbar-thumb': {
            // backgroundColor: '#dcdde1',
            borderRadius: '4px'
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'white'
          }
        }
      }
    },
    MuiButton:{
      styleOverrides:{
        root:{
          textTransform: 'none',
          borderWidth: '0.5px',
          '&:hover': { borderWidth: '0.5px' }
        }
      }
    },
    MuiInputLabel:{
      styleOverrides:{
        root: { fontSize: '0.875rem' }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-body1': { fontSize: '0.875rem' }
        }
      }
    },
    MuiOutlinedInput:{
      styleOverrides:{
        root: {
          fontSize: '0.875rem',
          '& fieldset': { borderWidth: '0.5px !important' },
          '&:hover fieldset': { borderWidth: '1px !important' },
          '&.Mui-focused fieldset': { borderWidth: '1px !important' }
        }
      }
    }
  }
})

export default theme
