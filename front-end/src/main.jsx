import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import theme from './theme.js'

// Cấu hình react toastify
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Cấu hình MUI Dialog
import { ConfirmProvider } from 'material-ui-confirm'

import { ThemeProvider } from '@mui/material/styles'

// Cấu hình Redux Store
import { Provider } from 'react-redux'
import { store } from './redux/store'

// cấu hình react-router-dom với BrowserRouter
import { BrowserRouter } from 'react-router-dom'

// Cấu hình Redux-Persist
import { PersistGate } from 'redux-persist/integration/react'

import { persistStore } from 'redux-persist'
const persistor = persistStore(store)

// Kỹ thuật InjectStore để sử dụng biến redux store ở ngoài phạm vi component
import { injectStore } from './utils/authorizeAxios'
injectStore(store)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <BrowserRouter basename='/'>
          <ThemeProvider theme={theme}>
            <ConfirmProvider
              defaultOptions={{
                allowClose: false,
                dialogProps: { maxWidth: 'xs' },
                confirmationButtonProps: { color: 'secondary', variant: 'outlined' },
                cancellationButtonProps: { color: 'inherit' },
                buttonOrder: ['confirm', 'cancel']
              }}>
              <GlobalStyles styles={{ a: { textDecoration: 'none' } }} />
              <CssBaseline />
              <App />
              <ToastContainer theme='colored' position='bottom-left' />
            </ConfirmProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
