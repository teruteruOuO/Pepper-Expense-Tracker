import express from 'express';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import { convertFromInputDateTimeToMySQLTimestamp } from '../utilities/format-date.js';

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

// Add a transaction instance to the user's account
router.post(`/:username`, authorizeToken, async (req, res) => {
    try {
        let userID = Number();
        let transactionCurrentCount = Number();
        let selectQuery;
        let resultQuery;
        let insertQuery;
        let dollar_to_currency = Number();
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        let { name, description, amount, type, date, category, budget } = req.body;
        Logger.log('Initalizing /api/transaction/:username PUT ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if transaction name, amount, type, date, and category are missing
        if (!name || amount == undefined || !type || !date || !category ) {
            Logger.error(`Error: User is missing the required inputs: name, amount, type, date, and category`);
            res.status(400).json({ message: `You are missing the required transaction inputs: name, amount, type, date, and category`});
            return;
        }

        // Return the user's id and currency settings
        selectQuery = "SELECT user_id, user_username, c. currency_code, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;"
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of adding transaction instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        userID = Number(resultQuery[0].user_id);
        dollar_to_currency = Number(resultQuery[0].dollar_to_currency);

        // Return the current count of the user's savings then add 1 for sequence
        selectQuery = "SELECT transaction_sequence AS current_transaction_num FROM transaction WHERE user_id = ? ORDER BY transaction_sequence DESC LIMIT 1;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [userID]);
        console.log(resultQuery);
        if (resultQuery.length > 1) {
            Logger.error(`Error: User ${userID} was deleted or stopped existing while the process of adding transaction instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        // If there is no result, that means there are no savings record yet; so begin with 1
        if (resultQuery.length === 0) {
            transactionCurrentCount = 1;
        } else {
            transactionCurrentCount = Number(resultQuery[0].current_transaction_num) + 1;
        }
        
        // Neutralize the inputs: remove excessive whitespace and convert the numbers into dollar
        name = name.trim().replace(/\s+/g, ' ');
        description = typeof description === 'string' ? description.replace(/\s+/g, ' ').trim() : null;
        amount = Number(amount) / Number(dollar_to_currency);
        type = type.replace(/\s+/g, ' ').trim().toLowerCase();
        date = convertFromInputDateTimeToMySQLTimestamp(date);
        budget = typeof budget === 'number' ? budget : null;

        // Insert the inputs to the database
        insertQuery = "INSERT INTO transaction VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
        Logger.log(insertQuery);
        resultQuery = await executeWriteQuery(insertQuery, [userID, transactionCurrentCount, name, description, amount, type, date, category, budget]);
        Logger.log(`Successfully added the user's transaction information to the database.`);
        Logger.log(resultQuery);

        res.status(201).json({ message: `Successfully added your transaction, ${name}, to your account!`});
        return;

        
    } catch (err) {
        Logger.error(`Error: A server error occured while adding a transaction instance to the user's account.`);
        Logger.error(err);

        if (err.sqlMessage) {
            // Trigger errors
            // Throw an error if income is the type but budget is NOT NULL
            if (err.sqlMessage.includes('Income transactions cannot be associated with a budget.')) {
                Logger.error(`Error: User attempted to enter a type of income while budget is NOT NULL`);
                res.status(400).json({ message: `Transaction is not allowed to be part of the budget if it's an income type. Only expense transactions can be a part of a budget.` });
                return;
            }

            // Throw an error if the transaction's date is outside of the budget's timeframe
            if (err.sqlMessage.includes('Transaction date is outside of budget timeframe.')) {
                Logger.error(`Error: User's date is outside of the budget's timeframe`);
                res.status(400).json({ message: `Transaction's date must be within the budget's timeframe.` });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while adding a savings information to your account. Please try again later.`});
        return;

    }
});


export default router;