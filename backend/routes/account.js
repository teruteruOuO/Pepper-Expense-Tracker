import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeWriteQuery, executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Sign up route
router.post('/sign-up', async (req, res) => {
    try {
        // Initialize variables
        const token = req.cookies['token'] ? true : false;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        let insertQuery = "";
        let resultQuery;
        let {
            credentials: { username, password },
            name: { first, initial, last },
            email } = req.body;
        Logger.log('Initalizing /api/user/sign-up route');

        /* This section validates incoming data before processing them */
        // Verify that the user signing-up is not logged in
        if (token) {
            Logger.error('Error: A token exists while signing-up, meaning a logged-in user is attempting to make an account');
            res.status(403).json({ message: 'You must be logged out before signing-up' });
            return;
        }

        // If any required attributes are missing, throw an error
        if ( !username || !password || !first || !last || !email ) {
            Logger.error('Error: User is missing any of the required data: username, password, first and last names, and email');
            res.status(400).json({ message: 'You are missing any of the required data: username, password, first and last names, and email '});
            return;
        }

        // Throw an error if a username has white spaces
        if (/\s/.test(first)) {
            Logger.error('Error: User provided a username with white spaces');
            res.status(400).json({ message: 'You must not include white spaces in your username'});
            return;
        }

        /* Throw an error if password does not meet the requirements:
            - Contains at least one uppercase letter
            - Contains at least one lowercase letter
            - Contains at least one number
            - Contains at least one special character
        */
        if (!passwordRegex.test(password)) {
            Logger.error('Error: User provided a week password');
            res.status(400).json({ message: 'Your password must contain at least one upper case and lowercase letters, one number, and one special character'});
            return;
        }

        /* Begin processing data */
        // Hash user password
        password = await bcrypt.hash(password, 10);
        Logger.log('Successfully hashed user password');

        // Ensure all data are in lowercase and do not contain unwanted and excessive whitespaces (except password, which is hashed)
        username = username.replace(/\s+/g, ' ').trim().toLowerCase();
        first = first.replace(/\s+/g, ' ').trim().toLowerCase();
        last = last.replace(/\s+/g, ' ').trim().toLowerCase();
        email = email.replace(/\s+/g, ' ').trim().toLowerCase();
        initial = typeof initial === 'string' ? initial.replace(/\s+/g, ' ').trim().toLowerCase() : null;
    
        // Insert processed data to the database
        insertQuery = 'INSERT INTO user (user_username, user_password, user_first_name, user_last_name, user_initial, user_email) VALUES (?, ?, ?, ?, ?, ?);';
        resultQuery = await executeWriteQuery(insertQuery, [username, password, first, last, initial, email]);
        Logger.log('Successfully inserted processed user sign-up information to the database');
        Logger.log(resultQuery);
        res.status(201).json({ message: 'Sign-up Success' });
        return;

    } catch (err) {
        Logger.error('An error occured in api/account/sign-up');
        Logger.error(err);

        if (err instanceof Error) {
            // Constraint error messages directly from the database

            // Throw an error when there is no @ and . in the respected location of their email string
            if (err.sqlMessage.includes('user_email_check')) {
                Logger.error('Error: User provided an invalid email format');
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }

            // Throw an error for a duplicated email entry
            if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_email')) {
                Logger.error('Error: User provided an email that already exists in the database');
                res.status(409).json({ message: 'Email is already taken' });
                return;
            }

            // Throw an error for a duplicated username entry
            if (err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('user_username')) {
                Logger.error('Error: User provided a username that already exists in the database');
                res.status(409).json({ message: 'Username is already taken' });
                return;
            }

            // Throw an error if username consists of white spaces
            if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" && err.sqlMessage.includes('user_username_check')) {
                Logger.error('Error: User provided a username with white spaces');
                res.status(400).json({ message: 'Your username must not have a white space' });
                return;
            }

            // Throw an error if initial is at least an alphabet long
            if (err.code.includes('ER_DATA_TOO_LONG') && err.sqlMessage.includes('user_initial')) {
                Logger.error('Error: User initial is too long; must be 1 letter only');
                res.status(400).json({ message: 'Your initial must only be a single alphabet' });
                return;
            }
    
            if (err.code.includes('ER_CHECK_CONSTRAINT_VIOLATED') && err.sqlMessage.includes('user_initial_check')) {
                Logger.error('Error: User initial is too long; must be 1 letter only');
                res.status(400).json({ message: 'Your initial must only be a single alphabet' });
                return;
            }
        }

        res.status(500).json({ message: 'A server error occured while signing up. Check console for more information.' });
        return;
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        // Initialize variables
        let selectQuery;
        let resultQuery;
        let { username, password } = req.body;
        let databaseCredentials;
        let isPasswordValid;
        let token;
        const isLoggedIn = req.cookies['token'] ? true : false;
        Logger.log('Initalizing /api/user/login route');


        /* This section validates incoming data provided by the user */
        // If user is logged in while logging in, then throw an error
        if (isLoggedIn) {
            Logger.error('Error: A user is attempting to login while already logged in with a valid token');
            res.status(403).json({ message: 'You must log out before logging in' });
            return;
        }

        // Throw an error if username and password are not in the request body
        if (!username || !password) {
            Logger.error('Error: Username and password fields are missing while logging in');
            res.status(400).json({ message: 'Username and password fields are missing while logging in' });
            return;
        }

        // Find username and password from the database that matches the given user credentials
        username = username.replace(/\s+/g, ' ').trim().toLowerCase();
        selectQuery = "SELECT user_first_name AS first_name, user_username AS username, user_password AS password, user_active AS active, c.currency_code AS currency_code, currency_sign FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [username]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Cannot find an instance of a user with the username ${username}, meaning the provided credentials is most likely wrong`);
            res.status(400).json({ message: "Incorrect credentials" });
            return;
        }
        databaseCredentials = resultQuery[0];

        // If the user instance is not active, then refuse to login and inform the user
        if (databaseCredentials.active !== 1) {
            Logger.error(`Error: User ${username} is disabled, so logging them in is not possible unless user_active is reverted back to 1`);
            res.status(400).json({ message: 'This account is disabled. Contact the administrator to enable the account back on' });
            return;
        }

        // Validate the body password from the database password
        isPasswordValid = await bcrypt.compare(password, databaseCredentials.password);
        Logger.log(`Password validation result: ${isPasswordValid}`);
        databaseCredentials.password = "";
        if (!isPasswordValid) {
            Logger.error('Error: User password from the body does not match the password from the database');
            res.status(400).json({ message: 'Incorrect credentials' });
            return;
        }
        Logger.log('Credentials validation success');


        // Create token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        token = jwt.sign({ username: databaseCredentials.username, first_name: databaseCredentials.first_name }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set an http-only cookie using the provided token
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour in milliseconds
        });

        Logger.log("User is successfully logged in");
        res.status(200).json({ 
            message: 'Login Success',
            user: {
                username: databaseCredentials.username,
                first_name: databaseCredentials.first_name,
                currency_settings: {
                    currency_code: databaseCredentials.currency_code,
                    currency_sign: databaseCredentials.currency_sign
                }
            }
        });
        return;

    } catch (err) {
        console.error('Error: A server error occured in /api/account/login');
        console.error(err);
        res.status(500).json({ message: 'A server error occured while logging in. Check console for more information.' });
        return;
    }
});

// Logout route
router.post('/logout', async (req, res) => {
    Logger.log('Initalizing /api/user/logout route');
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    
    res.status(200).json({ message: 'Logout success' });
    return;
});

export default router;