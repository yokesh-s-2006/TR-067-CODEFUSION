import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();
const users: any[] = []; // Mock DB - replace with MongoDB

router.post('/register', async (req: any, res: any) => {
  try {
    const { name, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = { 
      id: Date.now().toString(), 
      name, 
      email, 
      password: hashedPassword 
    };
    
    users.push(user);
    
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: { id: user.id, name, email }
    });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = users.find((u: any) => u.email === email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email }
    });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
});

export default router;
