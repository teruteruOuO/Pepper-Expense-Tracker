import express from 'express';
import jwt from 'jsonwebtoken';
import Logger from '../utilities/logger.js';

const router = express.Router();

// Verify that the user still has the token while going through each authority-needed pages
router.get('/verify-token', async (req, res) => {
    const token = req.cookies['token'];

    // Check if the token exists
    if (!token) {
        Logger.error('User has no token while routing to a page');
        res.status(401).json({ message: 'Unauthorized: Token is missing or the token has expired' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // If token is invalid, then throw an error
        if (err) {
            Logger.error("User has a token that does not match the server's JWT token");
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }

        // If the token is valid, respond with success
        Logger.log('Token is valid');
        return res.status(200).json({ message: 'Token is valid' });
    })
});


export default router;