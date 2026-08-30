import { createRoot } from 'react-dom/client'
import './index.css'

import { AuthProvider } from './authContext.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import ProjectRoutes from './Routes.tsx'
// import { NotificationProvider } from './context/NotificationContext.tsx'

const storedTheme = localStorage.getItem('repoflow-theme')
const initialTheme = storedTheme === 'light' || storedTheme === 'dark'
  ? storedTheme
  : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

document.documentElement.classList.toggle('dark', initialTheme === 'dark')

createRoot(document.getElementById('root')!).render(
    <AuthProvider>
      {/* <NotificationProvider> */}
        <Router>
          <ProjectRoutes />
        </Router>
      {/* </NotificationProvider>  */}
    </AuthProvider>
)
