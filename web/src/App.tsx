import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ApiProvider } from './contexts/ApiContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import ActivateAccount from './pages/ActivateAccount'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DownloadApp from './pages/DownloadApp'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ApiProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="activate" element={<ActivateAccount />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="download" element={<DownloadApp />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ApiProvider>
  )
}

export default App
