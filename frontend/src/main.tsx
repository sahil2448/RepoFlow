import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import { AuthProvider } from './authContext.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import ProjectRoutes from './Routes.tsx'

createRoot(document.getElementById('root')!).render(
    <AuthProvider>
      <Router>
        <ProjectRoutes />
      </Router>
    </AuthProvider>
)
