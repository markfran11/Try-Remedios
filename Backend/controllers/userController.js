import * as userService from '../services/userService.js';

export const createAccount = async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const data = { firstName, lastName, username, email, password };

    try {
        const result = await userService.createAccount(data);
        res.status(201).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const createAdminAccount = async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const data = { firstName, lastName, username, email, password };

    try {
        const result = await userService.createAdminAccount(data);
        res.status(201).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    const data = { email, password };

    try {
        const result = await userService.login(data);
        // result = { token, user } — returned flat so the frontend can read directly
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

export const verifyToken = (req, res) => {
    // requireAuth middleware already validated the token and set req.user
    res.status(200).json({ valid: true, user: req.user });
}
