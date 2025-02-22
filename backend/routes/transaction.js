import express from 'express';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import formatDate from '../utilities/format-date.js';

const router = express.Router();

// Retrieve all of the user's transaction instances
router.get(`/:username/:currency_code`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let userTransactions = [];
        let currency = {
            dollar_to_currency: 0,
            sign: ""
        };
        const userCurrencyCode = req.params.currency_code;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/transaction/:username/:currency_code GET ROUTE.');

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

        // Retrieve all of the user's transactions
        selectQuery = "SELECT transaction_sequence, transaction_name, transaction_description, transaction_amount, transaction_type, transaction_date, category_name, budget_name FROM transaction t LEFT JOIN user u ON t.user_id = u.user_id LEFT JOIN budget b ON t.budget_id = b.budget_id LEFT JOIN category c ON t.category_id = c.category_id WHERE user_username = ? ORDER BY transaction_date DESC;";
        resultQuery = await executeReadQuery(selectQuery, usernameFromParameter);
        if (resultQuery.length >= 1) {
            userTransactions = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    description: transaction.transaction_description,
                    amount: Number((transaction.transaction_amount * currency.dollar_to_currency).toFixed(2)),
                    type: transaction.transaction_type,
                    date: new Date(transaction.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    category: transaction.category_name,
                    budget: transaction.budget_name
                }
            });

        } else {
            userTransactions = null;

        }

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s transaction instances!`);
        if (userTransactions) {
            userTransactions.forEach(transaction => Logger.log(transaction));
        }
        res.status(200).json({
            message: `Successfully retrieved your transactions`,
            transactions: userTransactions,
            currency_sign: currency.sign
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving all of the user's transaction instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving all of your transactions. Please try again later.`});
        return;
    }
});


export default router;