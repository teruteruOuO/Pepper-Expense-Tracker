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

// Retrieve all of the budget's transaction instances
router.get(`/expense-transactions/:username/:budget_id/:currency_code`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let userTransactions = [];
        let currency = {
            dollar_to_currency: 0,
            sign: ""
        };
        const budgetId = req.params.budget_id;
        const userCurrencyCode = req.params.currency_code;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log('Initalizing /api/budget/expense-transactions/:username/:budget_id/:currency_code GET ROUTE.');

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

        // Throw an error if there's no budget id in the request parameter
        Logger.log(`User's budget id: ${budgetId}`);
        if (!budgetId) {
            Logger.error('Error: User must provide a budget instance');
            res.status(400).json({ message: "You must provide a budget instance." });
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
        selectQuery = "SELECT transaction_sequence, transaction_name, transaction_description, transaction_amount, transaction_type, transaction_date, transaction_resolved, category_name, budget_name FROM transaction t LEFT JOIN user u ON t.user_id = u.user_id LEFT JOIN budget b ON t.budget_id = b.budget_id LEFT JOIN category c ON t.category_id = c.category_id WHERE user_username = ? AND b.budget_id = ? ORDER BY transaction_date DESC;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter, budgetId]);
        if (resultQuery.length >= 1) {
            userTransactions = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    description: transaction.transaction_description,
                    amount: Number((transaction.transaction_amount * currency.dollar_to_currency).toFixed(2)),
                    type: transaction.transaction_type,
                    date: new Date(transaction.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    resolved: Number(transaction.transaction_resolved),
                    category: transaction.category_name,
                    budget: transaction.budget_name
                }
            });

        } else {
            userTransactions = null;

        }

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s transaction instances for budget #${budgetId}!`);
        if (userTransactions) {
            userTransactions.forEach(transaction => Logger.log(transaction));
        }
        res.status(200).json({
            message: `Successfully retrieved your transactions for this budget`,
            transactions: userTransactions,
            currency_sign: currency.sign
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving all of the budget's transaction instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving the budget's transactions. Please try again later.`});
        return;
    }
});

// Retrieve all the budget information for a particular budget instance from the user
router.get('/:username/instance/:budget_id', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let budgetInformation = {
            id: Number(),
            name: '',
            description: '',
            progress: Number(),
            date: {
                start: new Date(),
                end: new Date()
            },
            amount: {
                used: Number(),
                limit: Number()
            }
        }
        let currency = {
            dollar_to_currency: Number(),
            sign: "",
            name: ""
        };
        const budgetId = req.params.budget_id;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initalizing /api/budget/:username/instance/:budget_id GET ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no budget sequence in the request parameter
        Logger.log(`User's budget ID: ${budgetId}`);
        if (!budgetId) {
            Logger.error('Error: User must provide a budget instance');
            res.status(400).json({ message: "You must provide a budget instance." });
            return;
        }

        // Retrieve user's currency setting and the budget instance's information (current and target amounts are converted to the user's preferred currency)
        selectQuery = "SELECT b.*, dollar_to_currency, currency_name, currency_sign FROM user u LEFT JOIN currency c ON c.currency_code = u.currency_code LEFT JOIN budget b ON u.user_id = b.user_id WHERE b.budget_id = ? AND user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [budgetId, usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Unable to find budget instance information for ${budgetId} by ${usernameFromParameter}`);
            res.status(404).json({ message: "Unable to retrieve the budget instance for you as it may not exist. Only click or refer to the ones that exist in the Budget Page." });
            return;
        }
        Logger.log(resultQuery);
        currency.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        currency.sign = resultQuery[0].currency_sign;
        currency.name = resultQuery[0].currency_name;
        budgetInformation.id = Number(resultQuery[0].budget_id);
        budgetInformation.name = resultQuery[0].budget_name;
        budgetInformation.description = resultQuery[0].budget_description;
        budgetInformation.progress = (Number(resultQuery[0].budget_used_amount) / Number(resultQuery[0].budget_amount)) * 100
        budgetInformation.date.start = formatDate(resultQuery[0].budget_start_date);
        budgetInformation.date.end = formatDate(resultQuery[0].budget_end_date);
        budgetInformation.amount.used = Number((Number(resultQuery[0].budget_used_amount) * currency.dollar_to_currency).toFixed(2));
        budgetInformation.amount.limit = Number((Number(resultQuery[0].budget_amount) * currency.dollar_to_currency).toFixed(2));
        Logger.log('Processed inputs:');
        Logger.log(currency);
        Logger.log(budgetInformation);

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s budget instance #${budgetInformation.id}`);
        res.status(200).json({
            message: `Successfully retrieved your budget instance information.`,
            budget: budgetInformation,
            currency: {
                name: currency.name,
                sign: currency.sign
            }
        });
        return;

    } catch (err) {
        Logger.error(`Error: A server error occured while retrieving the budget instance's information for the user.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieiving the budget instance's information. Please try again later...` });
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
        Logger.error(`Error: A server error occured while adding a budget instance to the user's account.`);
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

        res.status(500).json({ message: `A server error occured while adding a budget information to your account. Please try again later.`});
        return;
    }
});

// Update the budget instance's information of the user.
router.put('/:username/:budget_id', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        const budgetId = req.params.budget_id;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        let { 
            name, description, limit_amount,
            date: { start, end } } = req.body;
        const databaseResult = {
            id: Number(),
            dollar_to_currency: Number()
        }
        Logger.log('Initalizing /api/budget/:username/:sequence PUT ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no budget sequence in the request parameter
        Logger.log(`User's budget ID: ${budgetId}`);
        if (!budgetId) {
            Logger.error('Error: User must provide a budget instance');
            res.status(400).json({ message: "You must provide a budget instance." });
            return;
        }

        // Throw an error if budget name, limit amount, start, and end dates are not in the request body
        if (!name || limit_amount == undefined || !start || !end ) {
            Logger.error(`Error: User is missing the required inputs: name, limit amount, start, and end dates`);
            res.status(400).json({ message: `You are missing the required budget inputs: name, limit amount, start, and end dates`});
            return;
        }

        // Retrieve the user's id and currency settings.
        selectQuery = "SELECT user_id, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of updating their budget #${budgetId} is ongoing.`);
            res.status(400).json({ message: `Invalid user` });
            return;
        } 
        databaseResult.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        databaseResult.id = Number(resultQuery[0].user_id);

        // Neutralize the inputs: remove excessive whitespace and convert the numbers into dollar
        name = name.trim().replace(/\s+/g, ' ');
        description = typeof description === 'string' ? description.replace(/\s+/g, ' ').trim() : null;
        limit_amount = Number(limit_amount) / Number(databaseResult.dollar_to_currency);
        start = formatDate(start);
        end = formatDate(end);

        // Update budget instance
        updateQuery = "UPDATE budget SET budget_name = ?, budget_description = ?, budget_amount = ?, budget_start_date = ?, budget_end_date = ? WHERE user_id = ? AND budget_id = ?;";
        Logger.log(updateQuery);
        resultQuery = await executeWriteQuery(updateQuery, [
            name,
            description,
            limit_amount,
            start,
            end,
            databaseResult.id,
            budgetId
        ]);
        Logger.log(resultQuery);

        Logger.log(`Successfully updated budget instance ${name} for ${usernameFromParameter}!`);
        res.status(200).json({ message: `Successfully updated budget instance ${name}!` });
        return;


    } catch (err) {
        Logger.error(`Error: A server error occured while updating a budget instance to the user's account.`);
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

            // Trigger error message
            // Throw an error when the new start or end date results in one of the transaction dates being outside the new budget timeframe
            if (err.sqlMessage.includes('Cannot update budget dates. Transactions exist outside the new timeframe.')) {
                Logger.error(`Error: The user tried to update the budget date but one of the transactions ended up being out of bounds`);
                res.status(400).json({ message: 'Unable to update the budget date. One of the expense transactions exists outside of the potential new budget time frame. Ensure the transaction dates that refer to this budget are adjusted first.' });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while updating a budget information to your account. Please try again later.`});
        return;
    }
});

// Delete the budget instance for the user
router.delete('/:username/:budget_id', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let deleteQuery;
        let userId = Number();
        const budgetId = req.params.budget_id;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initializing /api/budget/:username/:sequence DELETE route');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no budget sequence in the request parameter
        Logger.log(`User's budget ID: ${budgetId}`);
        if (!budgetId) {
            Logger.error('Error: User must provide a budget instance');
            res.status(400).json({ message: "You must provide a budget instance." });
            return;
        }

        // Retrieve the user's id
        selectQuery = "SELECT user_id FROM user WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of deleting a budget instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        Logger.log(resultQuery);
        userId = Number(resultQuery[0].user_id);

        // Delete the budget instance
        deleteQuery = "DELETE FROM budget WHERE user_id = ? AND budget_id = ?;";
        Logger.log(deleteQuery);
        resultQuery = await executeWriteQuery(deleteQuery, [userId, budgetId]);
        Logger.log(resultQuery);

        Logger.log(`Successfully deleted budget instance #${budgetId} for ${usernameFromParameter}`);
        res.status(200).json({ message: `Successfully deleted this particular budget for you.`});
        return;
        

    } catch (err) {
        Logger.error(`Error: A server error occured while attempting to delete the budget instance for the user.`);
        Logger.error(err);

        if (err.sqlMessage) {
            // Trigger error message
            // Throw an error when the budget still has remaining expense transactions
            if (err.sqlMessage.includes('Cannot delete budget. Remove all transactions referring to this budget first.')) {
                Logger.error(`Error: The user tried to delete a budget but the budget is still referred by at least one transactions`);
                res.status(400).json({ message: "Unable to delete the budget. Ensure all transactions do not refer to this budget first. Either delete an expense transaction or make them undependable to this budget." });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while trying to delete this budget for you. Please try again later...`});
        return;

    }
});


export default router;