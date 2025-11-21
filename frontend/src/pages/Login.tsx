import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import api from '@/services/api'

export default function Login() {
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/auth/login', { loginId, password })
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (error) {
      alert('ログインに失敗しました')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mb: 2 }}>
              <LocalShippingIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              トラック配送管理システム
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="ログインID"
              autoFocus
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormControlLabel
              control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="ログイン状態を保持する"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              ログイン
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                パスワードを忘れた方はこちら
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
