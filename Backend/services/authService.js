import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';

const JWT_SECRET        = process.env.JWT_SECRET        || 'remedios_dev_secret_2024';
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || 'REMEDIOS-ADMIN-2024';
const JWT_EXPIRES       = '8h';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (data) => {
  const firstName  = String(data.firstName  ?? '').trim();
  const lastName   = String(data.lastName   ?? '').trim();
  const email      = String(data.email      ?? '').trim().toLowerCase();
  const username   = String(data.username   ?? '').trim().toLowerCase();
  const pwd        = String(data.password   ?? '');
  const role       = String(data.role       ?? 'customer');
  const accessCode = String(data.accessCode ?? '');

  if (!firstName)                        throw new Error('First name is required!');
  if (!lastName)                         throw new Error('Last name is required!');
  if (!email)                            throw new Error('Email is required!');
  if (!EMAIL_RE.test(email))             throw new Error('Enter a valid email address!');
  if (!username)                         throw new Error('Username is required!');
  if (username.length < 3)              throw new Error('Username must be at least 3 characters!');
  if (!/^[a-z0-9_]+$/.test(username))  throw new Error('Username may only contain letters, numbers, and underscores!');
  if (!['admin', 'customer'].includes(role)) throw new Error('Invalid role!');
  if (pwd.length < 6)                    throw new Error('Password must be at least 6 characters!');

  if (role === 'admin') {
    if (!accessCode || accessCode.trim() !== ADMIN_ACCESS_CODE)
      throw new Error('Invalid admin access code!');
  }

  const existingEmail = await userModel.findUserByEmail(email);
  if (existingEmail.length > 0) throw new Error('An account with this email already exists!');

  const existingUsername = await userModel.findUserByUsername(username);
  if (existingUsername.length > 0) throw new Error('Username is already taken!');

  const hash = await bcrypt.hash(pwd, 10);
  return await userModel.insert(firstName, lastName, email, username, hash, role);
};

export const login = async (email, password) => {
  const mail = String(email    ?? '').trim().toLowerCase();
  const pwd  = String(password ?? '');

  if (!mail || !pwd) throw new Error('Email and password are required!');

  const rows = await userModel.findUserByEmail(mail);
  if (rows.length === 0) throw new Error('Invalid email or password!');

  const user  = rows[0];
  const match = await bcrypt.compare(pwd, user.password);
  if (!match) throw new Error('Invalid email or password!');

  const payload = { id: user.account_id, role: user.role };
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return {
    token,
    user: {
      id:        user.account_id,
      firstName: user.first_name,
      lastName:  user.last_name,
      fullName:  `${user.first_name} ${user.last_name}`,
      email:     user.email,
      username:  user.username,
      role:      user.role,
    },
  };
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
