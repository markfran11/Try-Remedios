import * as userController from '../controllers/userController.js';
import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const userRoute = express.Router();

userRoute.post('/register', userController.createAccount);   // customer only
userRoute.post('/login',    userController.login);

userRoute.get('/verify', requireAuth, userController.verifyToken);

userRoute.post('/admin/create', userController.createAdminAccount);

export default userRoute;
