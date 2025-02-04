import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authorizeToken  from '../utilities/authorize-token.js';
import { executeWriteQuery, executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// GET route for retrieving the user's first and last name, initial, email, notification, and currency setting
router.get('/get-basic-information/:username', authorizeToken, async (req, res) => {
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
            settings: {
                currency_code: "",
                currency_name: "",
                notification: ""
            },
            email: ""
        }
        Logger.log('Initializing /api/user/get-basic-information route');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return
        }

        // Request the database server for the user's basic information
        selectQuery = "SELECT user_first_name, user_last_name, user_initial, user_email, user_notification, c.currency_code, currency_name FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
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
        databaseUserInformation.settings.notification = Number(resultQuery[0].user_notification);
        databaseUserInformation.settings.currency_code = resultQuery[0].currency_code;
        databaseUserInformation.settings.currency_name = resultQuery[0].currency_name;
        databaseUserInformation.email = resultQuery[0].user_email;

        // Respond back to the Frontend by providing the retrieved database information
        res.status(200).json({ 
            message: "Successfully retrieved the user's basic information.",
            user: {
                name: {
                    first: databaseUserInformation.name.first,
                    initial: databaseUserInformation.name.initial,
                    last: databaseUserInformation.name.last
                },
                settings: {
                    currency_code: databaseUserInformation.settings.currency_code,
                    currency_name: databaseUserInformation.settings.currency_name,
                    notification: databaseUserInformation.settings.notification
                },
                email: databaseUserInformation.email
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

export default router;