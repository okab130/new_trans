import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Dashboard from './pages/Dashboard'
import DeliveryOrderList from './pages/DeliveryOrderList'
import Login from './pages/Login'

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/delivery-orders" element={<DeliveryOrderList />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  )
}

export default App
