import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CrmProvider } from './context/CrmContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import DialogHost from './components/DialogHost.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CrmProvider>
        <ToastProvider>
          <DialogHost>
            <App />
          </DialogHost>
        </ToastProvider>
      </CrmProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
