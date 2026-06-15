import { createRoot } from 'react-dom/client'
import './index.css'

import { AuthProvider } from './authContext.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import ProjectRoutes from './Routes.tsx'
// import { NotificationProvider } from './context/NotificationContext.tsx'


createRoot(document.getElementById('root')!).render(
    <AuthProvider>
      {/* <NotificationProvider> */}
        <Router>
          <ProjectRoutes />
        </Router>
      {/* </NotificationProvider>  */}
    </AuthProvider>
)
