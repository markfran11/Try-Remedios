import * as authService from '../services/authService.js';

export const register = async (req, res) => {
  try {
    const id = await authService.register(req.body);
    res.status(201).json({ success: true, message: id });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (e) {
    res.status(401).json({ error: e.message || 'Login failed' });
  }
};
