import * as userModel from '../models/userModel.js';
import ValidationError from '../utils/ValidationError.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET  = process.env.JWT_SECRET  || 'remedios_dev_secret_2024';
const JWT_EXPIRES = '8h';

const doesUserExist = async (email) => {
    const existing = await userModel.findUserByEmail(email);
    if (existing.length > 0) {
        return { result: true, user: existing[0] };
    }
    return { result: false, user: undefined };
}

const validateFields = async (data) => {
    const firstName = String(data.firstName ?? '').trim();
    const lastName  = String(data.lastName  ?? '').trim();
    const email     = String(data.email     ?? '').trim().toLowerCase();
    const username  = String(data.username  ?? '').trim().toLowerCase();
    const password  = String(data.password  ?? '');

    if (!firstName || !lastName || !email || !username || !password) {
        throw new ValidationError('First name, last name, email, username and password are required!', 400);
    }

    if (!validator.isEmail(email)) {
        throw new ValidationError('Improper email format. Please provide a valid email address!', 400);
    }

    if (username.length < 3) {
        throw new ValidationError('Username must be at least 3 characters!', 400);
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
        throw new ValidationError('Username may only contain letters, numbers, and underscores!', 400);
    }

    if (!validator.isStrongPassword(password, {
        minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0
    })) {
        throw new ValidationError(
            'Password must be at least 6 characters and include uppercase, lowercase, and a number!',
            400
        );
    }

    const existingEmail = await doesUserExist(email);
    if (existingEmail.result) {
        throw new ValidationError('An account with this email already exists!', 400);
    }

    const existingUsername = await userModel.findUserByUsername(username);
    if (existingUsername.length > 0) {
        throw new ValidationError('Username is already taken!', 400);
    }

    const salt           = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    return { firstName, lastName, email, username, hashedPassword };
}


export const createAccount = async (data) => {
    const { firstName, lastName, email, username, hashedPassword } = await validateFields(data);

    const result = await userModel.insert(firstName, lastName, email, username, hashedPassword, 'customer');

    if (!result || result <= 0) {
        throw new Error('Unable to create account. Please try again later.');
    }

    return 'Account created successfully!';
}


export const createAdminAccount = async (data) => {
    const { firstName, lastName, email, username, hashedPassword } = await validateFields(data);

    const result = await userModel.insert(firstName, lastName, email, username, hashedPassword, 'admin');

    if (!result || result <= 0) {
        throw new Error('Unable to create admin account. Please try again later.');
    }

    return 'Admin account created successfully!';
}


export const login = async (data) => {
    const email    = String(data.email    ?? '').trim().toLowerCase();
    const password = String(data.password ?? '');

    if (!email || !password) {
        throw new ValidationError('Email and password are required!', 400);
    }

    const existing = await doesUserExist(email);

    if (!existing.result) {
        throw new ValidationError('An account with this email does not exist!', 400);
    }

    const isCorrectPassword = await bcrypt.compare(password, existing.user.password);

    if (!isCorrectPassword) {
        throw new ValidationError('Incorrect password!', 400);
    }

    const user    = existing.user;
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
}


export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
}
