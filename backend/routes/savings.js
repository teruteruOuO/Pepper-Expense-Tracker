import express from 'express';
import jwt from 'jsonwebtoken';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';

const router = express.Router();

// Retrieve all of the user's savings instances
router.get('/:username/:currency_code', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let userSavings = [];
        let currency = {
            dollar_to_currency: 0,
            sign: ""
        };
        const userCurrencyCode = req.params.currency_code;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/savings/:username/:currency_code GET ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if the user has no preferred currency
        Logger.log(`User's preferred currency: ${userCurrencyCode}`);
        if (!userCurrencyCode) {
            Logger.error('Error: User must have a preferred currency');
            res.status(400).json({ message: "You must have a preferred currency." });
            return;
        }

        // Retrieve the user's preferred currency
        selectQuery = "SELECT * FROM currency WHERE currency_code = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userCurrencyCode]);
        if (resultQuery.length !== 1) {
            Logger.error('Error: User provided an invalid currency');
            res.status(400).json({ message: "You gave an invalid currency." });
            return;
        }
        currency.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        currency.sign = resultQuery[0].currency_sign;

        // Retrieve all of the user's savings.
        selectQuery = "SELECT savings_sequence, savings_name, savings_description, savings_current_amount, savings_target_amount, savings_deadline_date FROM savings s JOIN user u ON s.user_id = u.user_id WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length >= 1) {
            userSavings = resultQuery.map(saving => {
                return {
                    sequence: Number(saving.savings_sequence),
                    name: saving.savings_name,
                    description: saving.savings_description,
                    current_amount: Number((saving.savings_current_amount * currency.dollar_to_currency).toFixed(2)),
                    target_amount: Number((saving.savings_target_amount * currency.dollar_to_currency).toFixed(2)),
                    deadline: new Date(saving.savings_deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    progress: Number(saving.savings_current_amount) / Number(saving.savings_target_amount) * 100
                }
            });
        } else {
            userSavings = null;

        }

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s saving instances!`);
        if (userSavings) {
            userSavings.forEach(saving => Logger.log(saving));
        }
        res.status(200).json({
            message: `Successfully retrieved your savings`,
            savings: userSavings,
            currency_sign: currency.sign
        });
        return;


    } catch (err) {
        Logger.error(`A server error occured while retrieving all of the user's savings instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving all of your savings. Please try again later.`});
        return;
    }
});

export default router;
