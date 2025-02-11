import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import generateCode from '../utilities/generate-code.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// GET route for retrieving the user's profile (not too sensitive information)
router.get('/profile/:username', authorizeToken, async (req, res) => {
    try {
        // Initialize variables
        let selectQuery;
        let resultQuery;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        const databaseUserInformation = {
            name: {
                first: "",
                initial: null,
                last: "",
            },
            currency: {
                code: "",
                name: "",
            },
            location: {
                address: "",
                city: "",
                state: "",
                zip: ""
            }
        }
        Logger.log('Initializing /api/user/profile GET route');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return
        }

        // Request the database server for the user's profile information
        selectQuery = "SELECT user_first_name, user_initial, user_last_name, c.currency_code, currency_name, user_address, user_city, user_state, user_zip FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, tokenInformation.username);
        if (resultQuery.length !== 1) {
            Logger.error('Error: User accessing the resource does not exist. (This must not happen)');
            res.status(400).json({ message: "User accessing the resource does not exist"});
            return;
        }

        // Store the retrieved database information here
        Logger.log('Below is the result of the database query: ');
        Logger.log(resultQuery[0]);
        databaseUserInformation.name.first = resultQuery[0].user_first_name;
        databaseUserInformation.name.inital = resultQuery[0].user_initial;
        databaseUserInformation.name.last = resultQuery[0].user_last_name;
        databaseUserInformation.currency.code = resultQuery[0].currency_code;
        databaseUserInformation.currency.name = resultQuery[0].currency_name;
        databaseUserInformation.location.address = resultQuery[0].user_address;
        databaseUserInformation.location.city = resultQuery[0].user_city;
        databaseUserInformation.location.state = resultQuery[0].user_state;
        databaseUserInformation.location.zip = resultQuery[0].user_zip;

        // Respond back to the Frontend by providing the retrieved database information
        res.status(200).json({ 
            message: "Successfully retrieved the user's basic information.",
            user: {
                name: {
                    first: databaseUserInformation.name.first,
                    initial: databaseUserInformation.name.initial,
                    last: databaseUserInformation.name.last
                },
                currency: {
                    code: databaseUserInformation.currency.code,
                    name: databaseUserInformation.currency.name
                },
                location: {
                    address: databaseUserInformation.location.address,
                    city: databaseUserInformation.location.city,
                    state: databaseUserInformation.location.state,
                    zip: databaseUserInformation.location.zip
                }
            }
        });
        return;

        
    } catch (err) {
        Logger.error("Error: A server error occured while retrieving the user's basic information");
        Logger.error(err);
        res.status(500).json({ message: "A server error occured while retrieving the user's basic information. Please try again later" });
        return;
    }
});

// Update the user's profile information
router.put('/profile/:username', authorizeToken, async (req, res) => {
    try {
        // Initialize variables
        let updateQuery;
        let resultQuery;
        const tokenInformation = req.user;
        let decoded;
        let updatedToken;
        let token = req.cookies['token'];
        const usernameFromParameter = req.params.username;
        let {
            name: { first, initial, last },
            location: { address, city, state, zip },
            currency_code } = req.body;
        Logger.log('Initializing /api/user/profile PUT route');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return
        }

        // If any required attributes are missing, throw an error
        if ( !first || !last || !address || !city || !state || !zip || !currency_code) {
            Logger.error('Error: User is missing any of the required data: first and last names, address name, city, state, and location, and currency preference');
            res.status(400).json({ message: 'You are missing any of the required data: first and last names, address name, city, state, and location, and currency preference'});
            return;
        }

        // Ensure all data are in lowercase and do not contain unwanted and excessive whitespaces (except password, which is hashed)
        // Only Zip and Currency_code are unneutralized
        first = first.replace(/\s+/g, ' ').trim().toLowerCase();
        last = last.replace(/\s+/g, ' ').trim().toLowerCase();
        initial = typeof initial === 'string' ? initial.replace(/\s+/g, ' ').trim().toLowerCase() : null;
        address = address.replace(/\s+/g, ' ').trim().toLowerCase();
        city = city.replace(/\s+/g, ' ').trim().toLowerCase();
        state = state.replace(/\s+/g, ' ').trim().toUpperCase();

        // Update processed data to the database
        updateQuery = "UPDATE user SET user_first_name = ?, user_initial = ?, user_last_name = ?, user_address = ?, user_city = ?, user_state = ?, user_zip = ?, currency_code = ? WHERE user_username = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [
            first,
            initial,
            last,
            address,
            city,
            state,
            zip,
            currency_code,
            tokenInformation.username
        ]);
        Logger.log(updateQuery);
        Logger.log('Successfully updated user profile information.');

        // Re creating a token
        // Decode the existing token (without verifying signature to avoid expiration issues)
        decoded = jwt.decode(token);

        // Remove the `exp` field to prevent conflicts
        if (decoded.exp) {
            delete decoded.exp;
        }

        // Update only the first_name while keeping other data intact
        decoded.first_name = first;

        // Re-sign the token with the updated `first_name`
        updatedToken = jwt.sign(decoded, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set the new token as an httpOnly cookie
        res.cookie('token', updatedToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });
        Logger.log('Update token (first name)');

        res.status(200).json({ 
            message: 'Profile and Token (first name) update success',
            profile_details: {
                first: first,
                currency_code: currency_code
            }
        });
        return;

    } catch (err) {
        Logger.error(`Error: A server error occured while attempting to update the user's profile information.`);
        Logger.error(err);

        if (err instanceof Error) {
            // Constraint error messages directly from the database

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

        res.status(500).json({ message: 'A server error occured while attempting to update your profile.'});
        return;
    }
});

// Update the user's password
router.put('/change-password/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        let passwordMatch;
        let { old_password, new_password } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        Logger.log('Initializing /api/user/change-password PUT route.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if either old or new password keys are not in the body request
        if (!old_password || !new_password) {
            Logger.error('Error: Old or New password keys are missing in the body request');
            res.status(400).json({ message: "You must provide both the old and new password before you can update your password." });
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

        // Retrieve the current password
        selectQuery = "SELECT user_password AS current_password FROM user WHERE user_username = ?;";
        Logger.log(selectQuery)
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error('Error: Cannot find a user instance with the provided username');
            res.status(404).json({ message: `User ${usernameFromParameter} does not exist.`});
            return;
        }
        Logger.log('Successfully retrieved the password from the database');

        // Compare plain text password from the body request to the hashed database password
        passwordMatch = await bcrypt.compare(old_password, resultQuery[0].current_password);
        if (!passwordMatch) {
            Logger.error(`Error: The current password provided by the user does not match the password from the database.`);
            res.status(400).json({ message: 'The current password you provided is incorrect. Try again.' });
            return;
        }
        Logger.log('Provided old password and database password successfully match.');

        // Hash the new password
        new_password = await bcrypt.hash(new_password, 10);
        Logger.log('Successfully hashed the new password');

        // Update the password with the new password in the database.
        updateQuery = "UPDATE user SET user_password = ? WHERE user_username = ?;";
        Logger.log(updateQuery);
        resultQuery = await executeWriteQuery(updateQuery, [new_password, usernameFromParameter]);

        Logger.log('Successfully updated the password of the user.');
        res.status(200).json({ message: 'Successfully updated your password.' });
        return;

    } catch (err) {
        Logger.error(`A server error occured while trying to update the user's password in /api/user/change-password.`);
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while attempting to update your password. Please try again later.' });
        return;

    }
});

// Update the user's username
router.put('/change-username/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        let passwordMatch;
        let updatedToken;
        let token = req.cookies['token'];
        let decoded;
        let { current_password, new_username } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initializing /api/user/change-username PUT route.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if either new username or current password keys are not in the body request
        if (!current_password || !new_username) {
            Logger.error('Error: New username and current password keys are missing in the body request');
            res.status(400).json({ message: "You must provide your current password and new username before you can update your password." });
            return;
        }

        // Throw an error if a username has white spaces
        if (/\s/.test(new_username)) {
            Logger.error('Error: User provided a username with white spaces');
            res.status(400).json({ message: 'You must not include white spaces or special characters in your username'});
            return;
        }

        // Neutralize the username
        new_username = new_username.replace(/\s+/g, ' ').trim().toLowerCase();

        // Retrieve the current password
        selectQuery = "SELECT user_password AS current_password FROM user WHERE user_username = ?;";
        Logger.log(selectQuery)
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error('Error: Cannot find a user instance with the provided username');
            res.status(404).json({ message: `User ${usernameFromParameter} does not exist.`});
            return;
        }
        Logger.log('Successfully retrieved the password from the database');

        // Compare plain text password from the body request to the hashed database password
        passwordMatch = await bcrypt.compare(current_password, resultQuery[0].current_password);
        if (!passwordMatch) {
            Logger.error(`Error: The current password provided by the user does not match the password from the database.`);
            res.status(400).json({ message: 'The current password you provided is incorrect. Try again.' });
            return;
        }
        Logger.log('Provided current password and database password successfully match.');

        // Proceed to update the user's username
        updateQuery = "UPDATE user SET user_username = ? WHERE user_username = ?;";
        Logger.log(updateQuery);
        resultQuery = await executeWriteQuery(updateQuery, [new_username, usernameFromParameter]);
        Logger.log(resultQuery);
        Logger.log(`Successfully updated the user's username.`);

        // Re creating a token
        // Decode the existing token (without verifying signature to avoid expiration issues)
        decoded = jwt.decode(token);

        // Remove the `exp` field to prevent conflicts
        if (decoded.exp) {
            delete decoded.exp;
        }

        // Update only the username while keeping other data intact
        decoded.username = new_username;

        // Re-sign the token with the updated `username`
        updatedToken = jwt.sign(decoded, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set the new token as an httpOnly cookie
        res.cookie('token', updatedToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });
        Logger.log('Update token (username)');

        res.status(200).json({ 
            message: 'Successfully updated your username along with your new token',
            new_username: new_username
        });
        return;


    } catch (err) {
        Logger.error(`A server error occured while trying to update the user's username in /api/user/change-username.`);
        Logger.error(err);

        if (err instanceof Error) {
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

        }

        res.status(500).json({ message: 'A server error occured while attempting to update your username. Please try again later.' });
        return;

    }
});

// Send a code to the user's new email before being able to update it
router.post('/change-email/send-code/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let queries;
        let resultQuery;
        const oneTimeCode = generateCode(6);
        let userId;
        let { new_email } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
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
            subject: "Verification Code for Email Change",
            text: `Your code is: ${oneTimeCode}. Remember that this code will expire in 10 minutes.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        Logger.log('Initializing /api/user/change-email/send-code.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if new_email key is not in the body request
        if (!new_email) {
            Logger.error('Error: New email is missing in the body request');
            res.status(400).json({ message: "You must provide your new email before we can send you a one time code." });
            return;
        }

        // Neutralize the email
        new_email = new_email.replace(/\s+/g, ' ').trim().toLowerCase();
        Logger.log(`New email is neutralized to all lowercase: ${new_email}`);

        // Throw an error if the new email already exists in the database
        selectQuery = "SELECT user_email AS email FROM user WHERE user_email = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [new_email]);
        Logger.log(resultQuery);
        if (resultQuery.length >= 1) {
            Logger.error(`Error: email ${new_email} already exists in the database. Unable to proceed.`);
            res.status(400).json({ message: `The new email you provided, ${new_email}, is already taken. Please try again with another email.`});
            return;
        }

        // Retrieve the user's id 
        selectQuery = "SELECT user_id FROM user WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: user with username ${usernameFromParameter} does not exist.`);
            res.status(400).json({ message: `Unable to find user with the username ${usernameFromParameter}`});
            return;
        }
        userId = resultQuery[0].user_id;

        // Deletes all current one time code for the user while making a new one as well
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
        for (let query_instace of queries) {
            Logger.log(query_instace.query);
        }
        Logger.log('Transaction result: ');
        Logger.log(resultQuery);
        Logger.log(`Successfully deleted codes for user #${userId} while making a new one`);

        // Send the one time code to the user's email
        mailOptions.to = new_email;
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Logger.error('Error: An error occured while sending the code to the user');
                Logger.error(error);
                res.status(500).json({ message: 'A server error occured while sending the one time code to your email. Please try again' });
                return;

            } else {
                Logger.log('Successfully sent the code to the new email');
                res.status(200).json({ 
                    message: `Successfully sent the code to ${new_email}, check your email for the code (You might have to check in your spam folder if possible)`,
                    new_email: new_email  
                });
                return;
            }
        });

    } catch (err) {
        Logger.error(`A server error occured while trying to send code to the user's new email in /api/user/change-email/send-code.`);
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while attempting to send you a code to your new email. Please try again later.' });
        return;

    }
});

// Verify the code and change the user's email
router.put('/change-email/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let queries
        let resultQuery;
        let databaseResult;
        let { new_email, one_time_code } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initializing /api/user/change-email.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if new_email key is not in the body request
        if (!new_email || !one_time_code) {
            Logger.error('Error: New email or one time code are missing in the body request');
            res.status(400).json({ message: "You must provide your new email and the one time code before we can update your email." });
            return;
        }

        // Retrieve user's id and Compare the one time code from the database to the one time code provided by the user
        // Retrieve the current inuse code from the database associated with the user's email
        selectQuery = `SELECT u.user_id, code_description AS code, code_start_date, code_expiration_date FROM user u JOIN one_time_code ot ON u.user_id = ot.user_id WHERE user_username = ? AND code_status = ? AND code_description = ? AND NOW() < code_expiration_date;`;
        Logger.log('Starting query...');
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter, 'inuse', one_time_code]);

        // Throw an error if there are no results
        if (!resultQuery || resultQuery.length === 0) {
            Logger.error('Error: The code provided by the user either does not exist or have already expired');
            res.status(404).json({ message: 'The code you provided does not exist or have already expired. Resend a new one and try again.'});
            return;
        }

        databaseResult = resultQuery[0];
        Logger.log('Code information: ');
        Logger.log(databaseResult);

        // Throw an error if the user code does not match the database code
        if (one_time_code !== databaseResult.code) {
            Logger.error(`Error: Code provided by the user does not match the code from the database under the user's email (${one_time_code} =/= ${databaseResult.code}).`);
            res.status(400).json({ message: 'The code you provided is incorrect, try again or resend a new code to your new email.'});
            return;
        }

        // Deletes all current one time code for the user while updating the user's email
        queries = [
            {
                query: "DELETE FROM one_time_code WHERE user_id = ?;",
                params: [databaseResult.user_id]
            },
            {
                query: 'UPDATE user SET user_email = ? WHERE user_username = ?;',
                params: [new_email, usernameFromParameter]
            }
        ]
        Logger.log('Executing transaction...');
        resultQuery = await executeTransaction(queries);
        for (let query_instace of queries) {
            Logger.log(query_instace.query);
        }
        Logger.log('Transaction result: ');
        Logger.log(resultQuery);
        Logger.log(`Successfully deleted codes for user #${databaseResult.user_id} while updating their email.`);

        res.status(200).json({ message: 'Change email success!' });
        return;
        
    } catch (err) {
        Logger.error(`Error: A server error occured while trying to change the user's email in /api/user/change-email route.`);
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

        res.status(500).json({ message: 'A server error occured while attempting to change your email. Contact the developer for fix or try again later' });
        return;
    }
});

// Retrieve the user's email
router.get('/email/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initializing /api/user/change-email.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Retrieve the user's current email
        selectQuery = "SELECT user_email FROM user WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error('Error: User does not exist');
            res.status(400).json({ message: "Unable to find your current email because your username is nonexistent" });
            return;
        }
        Logger.log(`Successfully retrieved the user's current email`);
        Logger.log(resultQuery[0].user_email);

        res.status(200).json({ message: `Succesfully retrieved your email.`, current_email: resultQuery[0].user_email });
        return;

    } catch (err) {
        Logger.error(`An error occured while retrieving the user's current email.`);
        Logger.error(err);
        res.status(500).json({ message: `Unable to retrieve your current email. Try again later.`});
        return;
    }
});

// Retrieve the user's notification status
router.get('/notification/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initializing /api/notification GET route.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Retrieve the user's notification status
        selectQuery = "SELECT user_notification AS notification FROM user WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error('Error: User does not exist');
            res.status(400).json({ message: "Unable to find your notification status because your username does not exist." });
            return;
        }
        Logger.log(`Successfully retrieved the user's notification status`);
        Logger.log(resultQuery[0].notification);

        res.status(200).json({ message: `Succesfully retrieved your notification status.`, notification: resultQuery[0].notification });
        return;

    } catch (err) {
        Logger.error(`An error occured while retrieving the user's notification status.`);
        Logger.error(err);
        res.status(500).json({ message: `Unable to retrieve your notification status. Try again later.`});
        return;
    }
});

// Change the user's notification status
router.put('/notification/:username', authorizeToken, async (req , res) => {
    try {
        let updateQuery;
        let resultQuery;
        let { notification } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initializing /api/notification PUT route.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if notification is not in the request body
        if (notification === undefined) {
            Logger.error(`Error: User does not have a notification key in its request body.`);
            res.status(400).json({ message: 'You must send a notification key before you can continue.'});
            return;
        }

        // Update the user's notification status
        updateQuery = "UPDATE user SET user_notification = ? WHERE user_username = ?;";
        resultQuery = await executeWriteQuery(updateQuery, [notification, usernameFromParameter]);

        Logger.log(`Successfully changed the user's notification status to ${notification}`);
        res.status(200).json({ message: "Successfully updated your notification status.", notification });
        return;


    } catch (err) {
        Logger.error(`An error occured while changing the user's notification status.`);
        Logger.error(err);
        res.status(500).json({ message: `Unable to change your notification status. Try again later.`});
        return;
    }
});

// Send a one time code for the user during an account deletion process
router.post('/delete-account/send-code/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let queries;
        const oneTimeCode = generateCode(6);
        let passwordMatch;
        let databaseResult;
        let { current_password } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
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
            subject: "Verification Code for Account Deletion.",
            text: `Your code is: ${oneTimeCode}. Remember that this code will expire in 10 minutes.`

        }
        let transporter = nodemailer.createTransport(myEmail);
        Logger.log('Initializing /api/user/delete-account/send-code.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if current_password key is not in the body request
        if (!current_password) {
            Logger.error('Error: Current password is missing in the body request');
            res.status(400).json({ message: "You must provide your current password before we can send you a one time code." });
            return;
        }

        // Request the Database server for the user's id, current hashed password, and email.
        selectQuery = "SELECT user_id AS id, user_password AS password, user_email AS email FROM user WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: account details for user ${usernameFromParameter} do not exist.`);
            res.status(404).json({ message: 'Your account details are unfortunately not recorded.'});
            return;
        }
        databaseResult = resultQuery[0];
        Logger.log(`Successfully retrieved the user's account details.`);
        Logger.log(databaseResult);

        // Compare the current password provided by the user and the password stored in the database
        passwordMatch = await bcrypt.compare(current_password, databaseResult.password);
        if (!passwordMatch) {
            Logger.error(`Error: The current password provided by the user does not match the password from the database.`);
            res.status(400).json({ message: 'The current password you provided is incorrect. Try again.' });
            return;
        }
        Logger.log('Provided current password and database password successfully match.');

        // Deletes all current one time code for the user while making a new one as well
        queries = [
            {
                query: "DELETE FROM one_time_code WHERE user_id = ?;",
                params: [databaseResult.id]
            },
            {
                query: 'INSERT INTO one_time_code (user_id, code_description, code_status) VALUES (?, ?, ?);',
                params: [databaseResult.id, oneTimeCode, 'inuse']
            }
        ]
        Logger.log('Executing transaction...');
        resultQuery = await executeTransaction(queries);
        for (let query_instace of queries) {
            Logger.log(query_instace.query);
        }
        Logger.log('Transaction result: ');
        Logger.log(resultQuery);
        Logger.log(`Successfully deleted codes for user #${databaseResult.id} while making a new one`);

        // Send the one time code to the user's email.
        mailOptions.to = databaseResult.email;
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                Logger.error('Error: An error occured while sending the code to the user');
                Logger.error(error);
                res.status(500).json({ message: 'A server error occured while sending the one time code to your email. Please try again' });
                return;

            } else {
                Logger.log('Successfully sent the code to the new email');
                res.status(200).json({ message: `Successfully sent the code to ${databaseResult.email}, check your email for the code (You might have to check in your spam folder if possible)` });
                return;
            }
        });


    } catch (err) {
        Logger.error(`Error: A server error occured while sending a code to the user's email during the account deletion process.`);
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while sending a code to your email.'});
        return;

    }
});

// Delete the user's account
router.delete('/delete-account/:username', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let deleteQuery;
        let databaseResult;
        let { one_time_code } = req.body;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/user/delete-account');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if one_time_code key is not in the body request
        if (!one_time_code) {
            Logger.error('Error: one time code is missing in the body request');
            res.status(400).json({ message: "You must provide the one time code before we can delete your account." });
            return;
        }

        // Retrieve user's id and Compare the one time code from the database to the one time code provided by the user
        // Retrieve the current inuse code from the database associated with the user's email
        selectQuery = `SELECT u.user_id, code_description AS code, code_start_date, code_expiration_date FROM user u JOIN one_time_code ot ON u.user_id = ot.user_id WHERE user_username = ? AND code_status = ? AND code_description = ? AND NOW() < code_expiration_date;`;
        Logger.log('Starting query...');
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter, 'inuse', one_time_code]);

        // Throw an error if there are no results
        if (!resultQuery || resultQuery.length === 0) {
            Logger.error('Error: The code provided by the user either does not exist or have already expired');
            res.status(404).json({ message: 'The code you provided does not exist or have already expired. Resend a new one or try again.'});
            return;
        }

        databaseResult = resultQuery[0];
        Logger.log('Code information: ');
        Logger.log(databaseResult);

        // Throw an error if the user code does not match the database code
        if (one_time_code !== databaseResult.code) {
            Logger.error(`Error: Code provided by the user does not match the code from the database under the user's email (${one_time_code} =/= ${databaseResult.code}).`);
            res.status(400).json({ message: 'The code you provided is incorrect, try again or resend a new code to your new email.'});
            return;
        }

        // Request the database server to delete the user's account.
        deleteQuery = "DELETE FROM user WHERE user_id = ?;";
        Logger.log(deleteQuery);
        resultQuery = await executeWriteQuery(deleteQuery, [databaseResult.user_id]);
        Logger.log(`Successfully deleted user #${databaseResult.user_id}'s account.`);
        Logger.log(deleteQuery);
        
        // Clear the user's token to log them out
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });
        
        res.status(200).json({ message: `Successfully deleted ${usernameFromParameter}'s account.` });
        return;
        
    } catch (err) {
        Logger.error(`Error: A server error occured while attempting to delete the user's account.`);
        Logger.error(err);
        res.status(500).json({ message: 'A server error occured while trying to delete your account.'});
        return;
    }
});

export default router;