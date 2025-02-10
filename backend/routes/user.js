import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
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

export default router;