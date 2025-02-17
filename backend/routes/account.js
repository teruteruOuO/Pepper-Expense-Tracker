import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import nodemailer from 'nodemailer';
import generateCode from '../utilities/generate-code.js';

const router = express.Router();

// Sign up route
router.put('/sign-up/:email', async (req, res) => {
    try {
        // Initialize variables
        const token = req.cookies['token'] ? true : false;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        let updateQuery;
        let resultQuery;
        let { email } = req.params
        let {
            credentials: { username, password },
            name: { first, initial, last },
            location: { address, city, state, zip },
            currency_code } = req.body;
        Logger.log('Initalizing /api/user/sign-up route');

        /* This section validates incoming data before processing them */
        // Verify that the user signing-up is not logged in
        if (token) {
            Logger.error('Error: A token exists while signing-up, meaning a logged-in user is attempting to make an account');
            res.status(403).json({ message: 'You must be logged out before signing-up' });
            return;
        }

        // If any required attributes are missing, throw an error
        if ( !username || !password || !first || !last || !email || !address || !city || !state || !zip || !currency_code) {
            Logger.error('Error: User is missing any of the required data: username, password, first and last names, address name, city, state, and location, and currency preference');
            res.status(400).json({ message: 'You are missing any of the required data: username, password, first and last names, address name, city, state, and location, and currency preference'});
            return;
        }

        // Throw an error if a username has white spaces
        if (/\s/.test(username)) {
            Logger.error('Error: User provided a username with white spaces');
            res.status(400).json({ message: 'You must not include white spaces or special characters in your username'});
            return;
        }

        /* Throw an error if password does not meet the requirements:
            - Contains at least one uppercase letter
            - Contains at least one lowercase letter
            - Contains at least one number
            - Contains at least one special character
        */
        if (!passwordRegex.test(password)) {
            Logger.error('Error: User provided a weak password');
            res.status(400).json({ message: 'Your password must contain at least one upper case and lowercase letters, one number, and one special character'});
            return;
        }

        /* Begin processing data */
        // Hash user password
        password = await bcrypt.hash(password, 10);
        Logger.log('Successfully hashed user password');

        // Ensure all data are in lowercase and do not contain unwanted and excessive whitespaces (except password, which is hashed)
        // Only State, Zip, Currency_code, and Password are unneutralized
        username = username.replace(/\s+/g, ' ').trim().toLowerCase();
        first = first.replace(/\s+/g, ' ').trim().toLowerCase();
        last = last.replace(/\s+/g, ' ').trim().toLowerCase();
        initial = typeof initial === 'string' ? initial.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        address = address.replace(/\s+/g, ' ').trim().toLowerCase();
        city = city.replace(/\s+/g, ' ').trim().toLowerCase();
    
        // Update processed data to the database
        updateQuery = 'UPDATE user SET user_username = ?, user_password = ?, user_first_name = ?, user_initial = ?, user_last_name = ?, currency_code = ?, user_address = ?, user_city = ?, user_state = ?, user_zip = ?, user_email_verified = ? WHERE user_email = ?;';
        resultQuery = await executeWriteQuery(updateQuery, [
            username, 
            password, 
            first,
            initial,
            last,
            currency_code,
            address,
            city,
            state,
            zip,
            1,
            email
        ]);
        Logger.log('Successfully updated user information and officially signed them up to the database.');
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
                res.status(400).json({ message: 'Your username must not have a white space or any special characters' });
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

// Verify Email in Sign up Page (Temporarily store the email in the database server)
router.post('/sign-up/email-verification', async (req , res) => {
    try {
        // Initialize variables
        let queries;
        let resultQuery;
        let { email } = req.body;
        let temporaryCredentials = { username: '', password: '' }
        const oneTimeCode = generateCode(6);
        const token = req.cookies['token'] ? true : false;
        const myEmail = {
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            },
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 5,
            rateLimit: 5,
            tls: { rejectUnauthorized: false } // Bypass certificate issues
        };
        
        let mailOptions = {
            from: `"Ube's Expense Tracker" <${process.env.NODEMAILER_EMAIL}>`,
            to: "",
            subject: "Code for verifying your email",
            text: `Your code is: ${oneTimeCode}. The code will expire in 10 minutes. After that, you must resend a new code again.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        Logger.log('Initializing /api/account/email-verification...');

        /* This section validates the email before inserting it to the database */
        // Verify that the user signing-up is not logged in
        if (token) {
            Logger.error('Error: A token exists while signing-up, meaning a logged-in user is attempting to make an account.');
            res.status(403).json({ message: 'You must be logged out before signing-up.' });
            return;
        }

        // Throw an error if email does not exist in the body payload;
        if (!email) {
            Logger.error("Error: Cannot find email in the request body");
            res.status(400).json({ message: 'Cannot find email in the request body.' });
            return;
        }

        // Neutralize the email
        email = email.replace(/\s+/g, ' ').trim().toLowerCase();
        Logger.log(`Email is neutralized to all lowercase: ${email}`);

        // Create a temporary username and password for the email
        temporaryCredentials.username = `temporary_username${generateCode(5)}`;
        temporaryCredentials.password = `temporary_password${generateCode(5)}`;
        temporaryCredentials.password = await bcrypt.hash(temporaryCredentials.password, 10);
        Logger.log(`Temporary created credentials: ${temporaryCredentials.username} (username) AND ${temporaryCredentials.password} (password)`);

        // Perform a transaction of adding a temporary account with the email and a one-time code instance for the user
        queries = [
            {
                query: 'INSERT INTO user (user_username, user_password, user_first_name, user_last_name, user_email) VALUES (?, ?, ?, ?, ?);',
                params: [temporaryCredentials.username, temporaryCredentials.password, 'temporary', 'temporary', email]
            },
            {
                query: 'SET @user_id = LAST_INSERT_ID();',
                params: []
            }, 
            {
                query: 'INSERT INTO one_time_code (user_id, code_description, code_status) VALUES (@user_id, ?, ?);',
                params: [oneTimeCode, 'inuse']
            }
        ]
        Logger.log('Executing transaction...');
        for (let query_instace of queries) {
            Logger.log(query_instace.query);
        }
        resultQuery = await executeTransaction(queries);
        Logger.log('Transaction result query: ');
        Logger.log(resultQuery);

        // Send the one-time code to the user's email
        mailOptions.to = email;
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Logger.error('Error: An error occured while sending the code to the user');
                Logger.error(error);
                res.status(500).json({ message: 'A server error occured while sending the email to you. Please try again' });
                return;

            } else {
                Logger.log('Successfully sent the email to the user');
                res.status(200).json({ 
                    message: 'Successfully sent the email to you, check your email for the code (You might have to check in your spam folder if possible)',
                    email: email
                });
                return;
            }
        });

    } catch (err) {
        Logger.error('Error: A server error occured while attempting to send a one-time code to the provided email in /api/account/email-verification');
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
        }

        res.status(500).json({ message: 'A server error occured while attempting to verify the email. Contact the developer for fix or try again later' });
        return;
    }
});

// Resend code to user's email during sign-up
router.post('/sign-up/resend-code', async (req, res) => {
    try {
        // Initialize variables
        let selectQuery;
        let resultQuery;
        let queries;
        let userId;
        let { email } = req.body;
        const oneTimeCode = generateCode(6);
        const token = req.cookies['token'] ? true : false;
        const myEmail = {
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            },
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 5,
            rateLimit: 5,
            tls: { rejectUnauthorized: false } // Bypass certificate issues
        };
        
        let mailOptions = {
            from: `"Ube's Expense Tracker" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: "Code for verifying your email",
            text: `Your new code is: ${oneTimeCode}. Remember that this code will expire in 10 minutes.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        Logger.log('Initializing /api/account/resend-code...');

        /* This section validates the email before inserting it to the database */
        // Verify that the user signing-up is not logged in
        if (token) {
            Logger.error('Error: A token exists while signing-up, meaning a logged-in user is attempting to make an account.');
            res.status(403).json({ message: 'You must be logged out before signing-up.' });
            return;
        }

        // Throw an error if email does not exist in the body payload;
        if (!email) {
            Logger.error("Error: Cannot find email in the request body");
            res.status(400).json({ message: 'Cannot find email in the request body.' });
            return;
        }

        // Delete any existing codes for the user and make a new code instance
        selectQuery = "SELECT user_id, user_email FROM user WHERE user_email = ?;";
        resultQuery = await executeReadQuery(selectQuery, [email]); 
        userId = resultQuery ? Number(resultQuery[0].user_id) : null;
        if (!userId) {
            Logger.error('Error: Temporary account may not exist anymore');
            res.status(404).json({ message: 'Email does not exist in the database anymore. Try verifying the email again.'});
            return;
        }
        Logger.log(`The email ${email} is in user row instance number ${userId}`);
        queries = [
            {
                query: "DELETE FROM one_time_code WHERE user_id = ?;",
                params: [userId]
            },
            {
                query: 'INSERT INTO one_time_code (user_id, code_description, code_status) VALUES (?, ?, ?);',
                params: [userId, oneTimeCode, 'inuse']
            }
        ]
        Logger.log('Executing transaction...');
        resultQuery = await executeTransaction(queries);
        for (let query_instance of queries) {
            Logger.log(query_instance.query);
        }
        Logger.log('Transaction result: ');
        Logger.log(resultQuery);
        Logger.log(`Successfully deleted codes for user #${userId}`);

        // Send the new code to the user's email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Logger.error('Error: An error occured while sending the code to the user');
                Logger.error(error);
                res.status(500).json({ message: 'A server error occured while sending the email to you. Please try again' });
                return;

            } else {
                Logger.log('Successfully sent the email to the user');
                res.status(200).json({ 
                    message: `Successfully sent the email to ${email}, check your email for the code (You might have to check in your spam folder if possible)`,
                    email: email
                });
                return;
            }
        });

        
    } catch (err) {
        Logger.error('Error: An error occured while resending a code to the user in /api/account/resend-code');
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while resending a code to the user. Please try again later.'});
        return;
    }
});

// Validate user code input and database code ()
router.post('/validate-code', async (req, res) => {
    try {
        let selectQuery;
        let resultQuery; 
        let deleteQuery;
        let { code, email } = req.body;
        let userCodeInstance;
        Logger.log('Initializing /api/account/validate-code');

        // Throw error if code or email is not in the body request
        if (!code || !email) {
            Logger.error(`Error: code is not in the request body; therefore, the process will not continue`);
            res.status(400).json({ message: 'Code must be in the request body.'});
            return;
        }

        // Retrieve the current inuse code from the database associated with the user's email
        selectQuery = `SELECT u.user_id, code_description AS code, code_start_date, code_expiration_date FROM user u JOIN one_time_code ot ON u.user_id = ot.user_id WHERE user_email = ? AND code_status = ? AND code_description = ? AND NOW() < code_expiration_date;`;
        Logger.log('Starting query...');
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [email, 'inuse', code]);

        // Throw an error if there are no results
        if (!resultQuery || resultQuery.length === 0) {
            Logger.error('Error: The code provided by the user either does not exist or have already expired');
            res.status(404).json({ message: 'The code you provided does not exist or have already expired. Resend a new one and try again.'});
            return;
        }

        userCodeInstance = resultQuery[0];
        Logger.log('Code information: ');
        Logger.log(userCodeInstance);

        // Throw an error if the user code does not match the database code
        if (code !== userCodeInstance.code) {
            Logger.error(`Error: Code provided by the user does not match the code from the database under the user's email (${code} =/= ${userCodeInstance.code}).`);
            res.status(400).json({ message: 'The code you provided is incorrect, try again or resend a new code.'});
            return;
        }

        // If it matches, then proceed to delete all one time codes associated with the user
        deleteQuery = "DELETE FROM one_time_code WHERE user_id = ?;";
        Logger.log(deleteQuery);
        resultQuery = await executeWriteQuery(deleteQuery, [userCodeInstance.user_id]);
        Logger.log('Successfully deleted all one_time_code for the user');
        Logger.log(resultQuery);

        Logger.log('Successfully validate user code')
        res.status(200).json({ message: 'Code validation success.' });
        return;

    } catch (err) {
        console.error(`Error: A server error occured while validating code for the user`);
        console.error(err);
        res.status(500).json({ message: 'A server error occured while validating the code you put. Reload the website and try again or come back later.' });
        return;
    }
})

// Remove the email associated with the temporary user instance if they don't continue signing-up
router.delete('/sign-up/delete-email/:email', async (req, res) => {
    try {
        // Initialize variables
        let deleteQuery;
        let resultQuery;
        let { email } = req.params;
        Logger.log(email)
        Logger.log('Initalizing /api/account/sign-up/delete-email');

        // Throw error if email is not in the body request
        if (!email) {
            Logger.error("Error: User's email does not exist in the body payload and cannot continue with the entire deletion process");
            res.status(400).json({ message: 'User email does not exist' });
            return;
        }

        // Delete the temporary user instance with this email
        deleteQuery = "DELETE FROM user WHERE user_email = ?;";
        Logger.log(deleteQuery);
        resultQuery = await executeWriteQuery(deleteQuery, [email]);
        Logger.log('Successfully deleted user email');
        Logger.log(resultQuery);

        res.status(200).json({ message: 'Successfully deleted user email.'});
        return;

    } catch (err) {
        Logger.error('Error: A server error occured while deleting user instance associated with the temporary user account.');
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while deleting the email.' });
        return;
    }
});

// Send a code to the user's email during Forgot Password process
router.post('/forgot-password/send-code', async (req, res) => {
    try {
        // Initialize variables
        let selectQuery;
        let insertQuery;
        let deleteQuery;
        let resultQuery;
        let databaseResult;
        let code = generateCode(6);
        let { email } = req.body;
        const token = req.cookies['token'];
        const myEmail = {
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            },
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 5,
            rateLimit: 5,
            tls: { rejectUnauthorized: false } // Bypass certificate issues
        };
        
        let mailOptions = {
            from: `"Ube's Expense Tracker" <${process.env.NODEMAILER_EMAIL}>`,
            to: "",
            subject: "Forgot Password Code",
            text: `Your code is: ${code}. The code will expire in 10 minutes. After that, you must resend a new code again.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        Logger.log('Initializing /api/account/forgot-password/send-code');

        // Throw an error if there's an existing valid token
        if (token) {
            Logger.error("Error: A user attempts to use this route while logged in or have an existing valid token.");
            res.status(401).json({ message: 'You must not be logged in while accessing this resource.'});
            return;
        }

        // Throw an error if email does not exist in the body request
        if (!email) {
            Logger.error("Error: Cannot find email in the body request.");
            res.status(401).json({ message: 'You must provide an email before we can send you a code to your email.'});
            return;
        }

        // Neutralize the email
        email = email.replace(/\s+/g, ' ').trim().toLowerCase();
        Logger.log(`Email is neutralized to all lowercase: ${email}`);

        // Verify that the user with the provided email exists in the database
        selectQuery = "SELECT user_id, user_email FROM user WHERE user_email = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User with the email ${email} does not exists in the database.`);
            res.status(400).json({ message: `An account with the email ${email} does not exist in the system.`});
            return;
        }
        databaseResult = resultQuery[0];

        Logger.log(`Successfully retrieved user using the email: ${email}`);
        Logger.log(databaseResult);

        // Request the database server to delete any one time code instances for the user
        deleteQuery = "DELETE FROM one_time_code WHERE user_id = ?;";
        resultQuery = await executeWriteQuery(deleteQuery, [databaseResult.user_id]);
        Logger.log(deleteQuery);
        Logger.log('Successfully deleted all one time code instances for the user.');

        // Request the database server to make a one time code instance for the user
        insertQuery = "INSERT INTO one_time_code (user_id, code_description, code_status) VALUES (?, ?, ?);";
        Logger.log(insertQuery);
        resultQuery = await executeWriteQuery(insertQuery, [databaseResult.user_id, code, 'inuse']);

        // Send the one-time code to the user's email
        mailOptions.to = databaseResult.user_email;
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Logger.error('Error: An error occured while sending the code to the user');
                Logger.error(error);
                res.status(500).json({ message: 'A server error occured while sending the email to you. Please try again' });
                return;

            } else {
                Logger.log('Successfully sent the email to the user');
                res.status(200).json({ 
                    message: `Successfully sent the email to ${databaseResult.user_email}, check your email for the code (You might have to check in your spam folder if possible)`,
                    email: databaseResult.user_email
                });
                return;
            }
        });


    } catch (err) {
        Logger.error("Error: A server error occured while sending a code to the user's email in /api/account/forgot-password/send-code");
        Logger.error(err);
        res.status(500).json({ message: "A server error occured while sending a code to your email. Please try again later."});
        return;
    }
});

// Delete one time code instances for the user each time they discontinue their progress in Forgot Password
router.delete('/forgot-password/delete-codes/:email', async (req, res) => {
    try {
        let selectQuery;
        let deleteQuery;
        let resultQuery;
        let databaseResult;
        const { email } = req.params;
        Logger.log('Initializing /api/account/forgot-password/delete-code');

        // Throw an error if email does not exist in the parameters
        if (!email) {
            Logger.error(`Error: email in the parameters is required to continue to process.`);
            res.status(400).json({ message: 'Email must be present in the parameters to use this resource.' });
            return;
        }

        // Throw an error if there's no user instance with the provided email
        // Verify that the user with the provided email exists in the database
        selectQuery = "SELECT user_id, user_email FROM user WHERE user_email = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User with the email ${email} does not exists in the database.`);
            res.status(400).json({ message: `An account with the email ${email} does not exist in the system.`});
            return;
        }
        databaseResult = resultQuery[0];

        Logger.log(`Successfully retrieved user using the email: ${email}`);
        Logger.log(databaseResult);

        // Request the database server to delete any one time code instances for the user
        deleteQuery = "DELETE FROM one_time_code WHERE user_id = ?;";
        resultQuery = await executeWriteQuery(deleteQuery, [databaseResult.user_id]);
        Logger.log(deleteQuery);
        Logger.log('Successfully deleted all one time code instances for the user.');
        res.status(200).json({ message: `Successfully delete one time code instances for the user with the email ${databaseResult.user_email}`});
        return;

    } catch (err) {
        Logger.error(`Error: An error occured while deleting all one time code instances for the user in /api/account/forgot-password/delete-code`);
        res.status(500).json({ message: 'An error occured while deleting all one time code instances for the user.' });
        return;
    }
});

// Change user's password during the Password Recovery process
router.post('/forgot-password/change-password', async (req, res) => {
    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        let updateQuery;
        let resultQuery;
        let { new_password, email } = req.body;
        Logger.log('Initializing /api/account/forgot-password/change-password');

        // Throw an error if new password or email do not exist in the request body
        if (!new_password || !email) {
            Logger.error(`Error: User is missing either the new password or their email in the request body.`);
            res.status(400).json({ message: 'Your new password and email must be provided before you can change your password.'});
            return;
        }

        /* Throw an error if password does not meet the requirements:
            - Contains at least one uppercase letter
            - Contains at least one lowercase letter
            - Contains at least one number
            - Contains at least one special character
        */
        if (!passwordRegex.test(new_password)) {
            Logger.error('Error: User provided a weak password');
            res.status(400).json({ message: 'Your password must contain at least one upper case and lowercase letters, one number, and one special character'});
            return;
        }

        /* Begin processing data */
        // Hash user password
        new_password = await bcrypt.hash(new_password, 10);
        Logger.log('Successfully hashed user password');

        // Update user's password in the database
        updateQuery = "UPDATE user SET user_password = ? WHERE user_email = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [new_password, email]);

        Logger.log(`Successfully updated the user's password!`);
        res.status(200).json({ message: 'Successfully updated your password.'});
        return;


    } catch (err) { 
        Logger.error(`Error: A server error occured while changing the user's password in /api/account/forgot-password/change-password.`);
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while changing your password. Please try again later.'});
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
        // If user is logged in while logging in, then clear the any tokens
        if (isLoggedIn) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            });
        }

        // Throw an error if username and password are not in the request body
        if (!username || !password) {
            Logger.error('Error: Username and password fields are missing while logging in');
            res.status(400).json({ message: 'Username and password fields are missing while logging in' });
            return;
        }

        // Find username and password from the database that matches the given user credentials
        username = username.replace(/\s+/g, ' ').trim().toLowerCase();
        selectQuery = "SELECT user_first_name AS first_name, user_username AS username, user_password AS password, c.currency_code AS currency_code, currency_sign FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [username]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Cannot find an instance of a user with the username ${username}, meaning the provided credentials is most likely wrong`);
            res.status(400).json({ message: "Incorrect credentials" });
            return;
        }
        databaseCredentials = resultQuery[0];

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
                currency_code: databaseCredentials.currency_code
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