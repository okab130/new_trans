import { Router } from 'express';

const router = Router();

// 仮の認証エンドポイント
router.post('/login', (req, res) => {
  const { loginId, password } = req.body;
  
  // 本来はデータベースで検証
  if (loginId && password) {
    res.json({
      token: 'dummy-jwt-token',
      user: {
        id: 'user-1',
        loginId,
        name: '配車担当者',
        role: 'DISPATCHER',
      },
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
