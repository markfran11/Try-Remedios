import { verifyToken } from '../services/userService.js';

export const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        req.user = verifyToken(header.slice(7));
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
}
