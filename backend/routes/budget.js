import express from 'express';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import { formatDate } from '../utilities/format-date.js';

const router = express.Router();

// Retrieve budget name and id for the user (transaction exclusive)
router.get(`/get-name/:username`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let budgetList = [];
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/budget/get-name/:username GET ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Retrieve the user's budgets
        selectQuery = "SELECT budget_id, budget_name FROM user u JOIN budget b ON u.user_id = b.user_id WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        Logger.log(resultQuery);
        if (resultQuery.length >= 1) {
            budgetList = resultQuery.map(budget => {
                return {
                    id: Number(budget.budget_id),
                    name: budget.budget_name
                }
            });

        } else {
            budgetList = null;

        }

        Logger.log(`Budget list:`);
        Logger.log(budgetList);
        Logger.log(`Successfully retrieved ${usernameFromParameter}'s budget list`);
        res.status(200).json({
            message: `Successfully retrieved your budget list.`,
            budget: budgetList
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving all of the user's budget instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving all of your budgets. Please try again later.`});
        return;
    }
});

// Retrieve all of the user's budget instances
router.get(`/:username/:currency_code`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let userBudgets = [];
        let currency = {
            dollar_to_currency: 0,
            sign: ""
        };
        const userCurrencyCode = req.params.currency_code;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/budget/:username/:currency_code GET ROUTE.');

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
        selectQuery = "SELECT b.budget_id, budget_name, budget_description, budget_used_amount, budget_amount, budget_start_date, budget_end_date FROM budget b JOIN user u ON b.user_id = u.user_id WHERE user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, usernameFromParameter);
        if (resultQuery.length >= 1) {
            userBudgets = resultQuery.map(budget => {
                return {
                    id: Number(budget.budget_id),
                    name: budget.budget_name,
                    description: budget.budget_description,
                    progress: Number(budget.budget_used_amount) / Number(budget.budget_amount) * 100,
                    amount: {
                        used: Number((budget.budget_used_amount * currency.dollar_to_currency).toFixed(2)),
                        limit: Number((budget.budget_amount * currency.dollar_to_currency).toFixed(2))
                    },
                    date: {
                        start: new Date(budget.budget_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        end: new Date(budget.budget_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    }
                }
            });

        } else {
            userBudgets = null;

        }

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s budget instances!`);
        if (userBudgets) {
            userBudgets.forEach(budget => Logger.log(budget));
        }
        res.status(200).json({
            message: `Successfully retrieved your budgets`,
            budgets: userBudgets,
            currency_sign: currency.sign
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving all of the user's budget instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving all of your budgets. Please try again later.`});
        return;
    }
});

// Add a budget instance to the user's account
router.post(`/:username`, authorizeToken, async (req, res) => {
    try {
        let userID = Number();
        let selectQuery;
        let resultQuery;
        let insertQuery;
        let dollar_to_currency = Number();
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        let { name, 
            description, 
            limit_amount, 
            date: { start, end } } = req.body;
        Logger.log('Initalizing /api/budget/:username PUT ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if budget name, limit amount, start, and end dates are not in the request body
        if (!name || limit_amount == undefined || !start || !end ) {
            Logger.error(`Error: User is missing the required inputs: name, limit amount, start, and end dates`);
            res.status(400).json({ message: `You are missing the required budget inputs: name, limit amount, start, and end dates`});
            return;
        }

        // Return the user's id and currency settings
        selectQuery = "SELECT user_id, user_username, c. currency_code, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;"
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of adding budget instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        userID = Number(resultQuery[0].user_id);
        dollar_to_currency = Number(resultQuery[0].dollar_to_currency);

        // Neutralize the inputs: remove excessive whitespace and convert the numbers into dollar
        name = name.trim().replace(/\s+/g, ' ');
        description = typeof description === 'string' ? description.replace(/\s+/g, ' ').trim() : null;
        limit_amount = Number(limit_amount) / Number(dollar_to_currency);
        start = formatDate(start);
        end = formatDate(end);

        // Insert the inputs to the database
        insertQuery = "INSERT INTO budget (user_id, budget_name, budget_description, budget_amount, budget_start_date, budget_end_date) VALUES (?, ?, ?, ?, ?, ?);";
        Logger.log(insertQuery);
        resultQuery = await executeWriteQuery(insertQuery, [userID, name, description, limit_amount, start, end]);
        Logger.log(`Successfully added the user's budget to the database.`);
        Logger.log(resultQuery);

        res.status(201).json({ message: `Successfully added your budget, ${name}, to your account!`});
        return;

        
    } catch (err) {
        Logger.error(`Error: A server error occured while adding a savings instance to the user's account.`);
        Logger.error(err);

        if (err.sqlMessage) {
            // Constraint error messages directly from the database
            // Throw an error when start date > end date
            if (err.sqlMessage.includes('chk_budget_dates')) {
                Logger.error(`Error: The user provided an invalid date`);
                res.status(400).json({ message: 'Start date must take place before the end date.' });
                return;
            }

            // Throw an error when budget amount (limit amount) is 0
            if (err.sqlMessage.includes('chk_budget_amount')) {
                Logger.error(`Error: The user provided an invalid limit amount`);
                res.status(400).json({ message: 'Limit amount MUST not be less than or equal to 0' });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while adding a savings information to your account. Please try again later.`});
        return;
    }
});


export default router;