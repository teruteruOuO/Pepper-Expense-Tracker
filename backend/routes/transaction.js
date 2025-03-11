import express from 'express';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import { convertFromInputDateTimeToMySQLTimestamp, convertMySQLTimestampToHTMLDatetime } from '../utilities/format-date.js';

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
        selectQuery = "SELECT transaction_sequence, transaction_name, transaction_description, transaction_amount, transaction_type, transaction_date, transaction_resolved, category_name, budget_name FROM transaction t LEFT JOIN user u ON t.user_id = u.user_id LEFT JOIN budget b ON t.budget_id = b.budget_id LEFT JOIN category c ON t.category_id = c.category_id WHERE user_username = ? ORDER BY transaction_date DESC;";
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
                    resolved: Number(transaction.transaction_resolved),
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

        // Return the current count of the user's transaction then add 1 for sequence
        selectQuery = "SELECT transaction_sequence AS current_transaction_num FROM transaction WHERE user_id = ? ORDER BY transaction_sequence DESC LIMIT 1;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [userID]);
        console.log(resultQuery);
        if (resultQuery.length > 1) {
            Logger.error(`Error: User ${userID} was deleted or stopped existing while the process of adding transaction instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        // If there is no result, that means there are no transaction record yet; so begin with 1
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

        console.log(date);

        // Insert the inputs to the database
        insertQuery = "INSERT INTO transaction VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
        Logger.log(insertQuery);
        resultQuery = await executeWriteQuery(insertQuery, [userID, transactionCurrentCount, name, description, amount, type, date, category, budget, 0]);
        Logger.log(`Successfully added the user's transaction information to the database.`);
        Logger.log(resultQuery);

        res.status(201).json({ message: `Successfully added your transaction, ${name}, to your account!`});
        return;

        
    } catch (err) {
        Logger.error(`Error: A server error occured while adding a transaction instance to the user's account.`);
        Logger.error(err);

        if (err.sqlMessage) {
            // Constraint error messages directly from the database (Trigger from before_insert_transaction)
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

            // Throw an error if the transaction's amount is at most 0
            if (err.sqlMessage.includes('transaction_amount_check')) {
                Logger.error(`Error: User's transaction amount is less than or equal to 0`);
                res.status(400).json({ message: `Transaction amount must not be less than or equal to 0.` });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while adding a transaction information to your account. Please try again later.`});
        return;

    }
});

// Retrieve all the transaction information for a particular transaction instance from the user
router.get('/:username/instance/:sequence', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let transactionInformation = {
            transaction: {
                sequence: Number(),
                name: "",
                description: "",
                amount: Number(),
                type: "",
                date: new Date(),
                resolved: null
            },
            category: {
                id: Number(),
                name: ""
            },
            budget: {
                id: null,
                name: ""
            }
        }
        let dollar_to_currency = Number();
        let userId = Number();
        const transactionSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initalizing /api/transaction/:username/instance/:sequence GET ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no transaction sequence in the request parameter
        Logger.log(`User's transaction sequence: ${transactionSequence}`);
        if (!transactionSequence) {
            Logger.error('Error: User must provide a transaction instance');
            res.status(400).json({ message: "You must provide a transaction instance." });
            return;
        }

        // Retrieve the user's id and currency settings' dollar to currency
        selectQuery = "SELECT user_id, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        Logger.log(resultQuery);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Unable to find ${usernameFromParameter}'s dollar to currency`);
            res.status(404).json({ message: "Ensure you're using a valid currency. Please return to the accounts page and choose a valid currency." });
            return;
        }
        dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        userId = Number(resultQuery[0].user_id);

        // Retrieve user's transaction instance's information (amount is converted to the user's preferred currency)
        selectQuery = "SELECT transaction_sequence, transaction_name, transaction_description, transaction_amount, transaction_type, transaction_date, transaction_resolved, c.category_id, category_name, b.budget_id, budget_name FROM transaction t LEFT JOIN category c ON t.category_id = c.category_id LEFT JOIN budget b ON t.budget_id = b.budget_id WHERE transaction_sequence = ? AND t.user_id = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [transactionSequence, userId]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Unable to find transaction instance for ${transactionSequence} by ${usernameFromParameter}`);
            res.status(404).json({ message: "Unable to retrieve the transaction instance for you as it may not exist. Only click or refer to the ones that exist in the Transaction Page." });
            return;
        }
        Logger.log(resultQuery);
        transactionInformation.transaction.sequence = Number(resultQuery[0].transaction_sequence);
        transactionInformation.transaction.name = resultQuery[0].transaction_name;
        transactionInformation.transaction.description = resultQuery[0].transaction_description;
        transactionInformation.transaction.amount = Number((Number(resultQuery[0].transaction_amount) * dollar_to_currency).toFixed(2));
        transactionInformation.transaction.type = resultQuery[0].transaction_type;
        transactionInformation.transaction.date = convertMySQLTimestampToHTMLDatetime(resultQuery[0].transaction_date);
        transactionInformation.transaction.resolved = Number(resultQuery[0].transaction_resolved);
        transactionInformation.category.id = Number(resultQuery[0].category_id);
        transactionInformation.category.name = resultQuery[0].category_name;
        transactionInformation.budget.id = resultQuery[0].budget_id ? Number(resultQuery[0].budget_id) : null;
        transactionInformation.budget.name = resultQuery[0].budget_name;
        Logger.log('Processed inputs:');
        Logger.log(transactionInformation);

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s transaction instance #${transactionInformation.transaction.sequence}`);
        res.status(200).json({
            message: `Successfully retrieved your transaction instance information.`,
            transaction_information: transactionInformation
        });
        return;

    } catch (err) {
        Logger.error(`Error: A server error occured while retrieving the transaction instance's information for the user.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieiving the transaction instance's information. Please try again later...` });
        return;
    }
});

// Update the transaction instance's information of the user.
router.put('/:username/:sequence', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        const transactionSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        let { 
            transaction: { name, description, amount, type, date },
            category_id, budget_id } = req.body;
        const databaseResult = {
            id: Number(),
            dollar_to_currency: Number()
        }
        Logger.log('Initalizing /api/transaction/:username/:sequence PUT ROUTE.');
        

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no transaction sequence in the request parameter
        Logger.log(`User's transaction sequence: ${transactionSequence}`);
        if (!transactionSequence) {
            Logger.error('Error: User must provide a transaction instance');
            res.status(400).json({ message: "You must provide a transaction instance." });
            return;
        }

        // Throw an error if transaction name, amount, type, date, and category are missing
        if (!name || amount == undefined || !type || !date || !category_id ) {
            Logger.error(`Error: User is missing the required inputs: name, amount, type, date, and category`);
            res.status(400).json({ message: `You are missing the required transaction inputs: name, amount, type, date, and category`});
            return;
        }

        // Retrieve the user's id and currency settings.
        selectQuery = "SELECT user_id, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of updating their transaction #${transactionSequence} is ongoing.`);
            res.status(400).json({ message: `Invalid user` });
            return;
        } 
        databaseResult.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        databaseResult.id = Number(resultQuery[0].user_id);

        // Convert the current and target amounts to USD.
        amount = Number(amount / databaseResult.dollar_to_currency);

        // Neutralize the inputs: remove excessive whitespace and convert the numbers into dollar
        name = name.trim().replace(/\s+/g, ' ');
        description = typeof description === 'string' ? description.replace(/\s+/g, ' ').trim() : null;
        type = type.replace(/\s+/g, ' ').trim().toLowerCase();
        date = convertFromInputDateTimeToMySQLTimestamp(date);
        budget_id = typeof budget_id === 'number' ? budget_id : null;

        // Update transaction instance
        updateQuery = "UPDATE transaction SET transaction_name = ?, transaction_description = ?, transaction_amount = ?, transaction_type = ?, transaction_date = ?, category_id = ?, budget_id = ? WHERE user_id = ? AND transaction_sequence = ?;";
        Logger.log(updateQuery);
        resultQuery = await executeWriteQuery(updateQuery, [
            name,
            description,
            amount,
            type,
            date,
            category_id,
            budget_id,
            databaseResult.id,
            transactionSequence
        ]);
        Logger.log(resultQuery);

        Logger.log(`Successfully updated transaction instance ${name} for ${usernameFromParameter}!`);
        res.status(200).json({ message: `Successfully updated transaction instance ${name}!` });
        return;


    } catch (err) {
        Logger.error(`Error: A server error occured while updating a transaction instance to the user's account.`);
        Logger.error(err);

        if (err.sqlMessage) {
            // Constraint error messages directly from the database (Trigger from before_update_transaction)

            // Throw an error if income is the type but budget is NOT NULL
            if (err.sqlMessage.includes('Cannot associate income types with any budgets')) {
                Logger.error(`Error: User attempted to enter a type of income while budget is NOT NULL`);
                res.status(400).json({ message: `Transaction is not allowed to be part of the budget if it's an income type. Only expense transactions can be part of a budget.` });
                return;
            }

            // Throw an error if the transaction's date is outside of the budget's timeframe
            if (err.sqlMessage.includes('Updated transaction date is outside of budget timeframe.')) {
                Logger.error(`Error: User's date is outside of the budget's timeframe`);
                res.status(400).json({ message: `Transaction's date must be within the budget's timeframe.` });
                return;
            }

            // Throw an error if the transaction's amount is at most 0
            if (err.sqlMessage.includes('transaction_amount_check')) {
                Logger.error(`Error: User's transaction amount is less than or equal to 0`);
                res.status(400).json({ message: `Transaction amount must not be less than or equal to 0.` });
                return;
            }

        }

        res.status(500).json({ message: `A server error occured while updating a transaction information to your account. Please try again later.`});
        return;
    }
});

// Update the transaction instance's resolved attribute
router.put('/expense-resolution/:username/:sequence', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        const transactionSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        let { resolved } = req.body;
        let userId = Number();
        Logger.log('Initalizing /api/transaction/expense-resolution/:username/:sequence PUT ROUTE.');
        

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no transaction sequence in the request parameter
        Logger.log(`User's transaction sequence: ${transactionSequence}`);
        if (!transactionSequence) {
            Logger.error('Error: User must provide a transaction instance');
            res.status(400).json({ message: "You must provide a transaction instance." });
            return;
        }

        // Throw an error if transaction name, amount, type, date, and category are missing
        if (resolved == undefined) {
            Logger.error(`Error: User is missing the transaction resolved input`);
            res.status(400).json({ message: `You are missing the transaction resolved input`});
            return;
        }

        Logger.log(`resolved value is ${resolved}`);
        resolved = resolved === 1 ? 0 : 1;
        Logger.log(`resolved value is NOW ${resolved}`);

        // Retrieve the user's id
        selectQuery = "SELECT user_id FROM user WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of updating their transaction #${transactionSequence}'s resolution status is ongoing.`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        userId = Number(resultQuery[0].user_id);

        // Update transaction_resolved for the user
        updateQuery = "UPDATE transaction SET transaction_resolved = ? WHERE user_id = ? AND transaction_sequence = ?;";
        Logger.log(updateQuery);
        resultQuery = await executeWriteQuery(updateQuery, [resolved, userId, transactionSequence]);
        Logger.log(resultQuery);

        Logger.log(`Successfully updated ${usernameFromParameter}'s transaction #${userId}'s transaction_resolved to ${resolved}.`);
        res.status(200).json({ message: `Successfully updated your transaction's resolution status.` });
        return;

    } catch (err) {
        Logger.error(`Error: A server error occured while attempting to update the transaction_resolved attribute of the transaction instance for the user.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while trying to resolve/unresolve your expense transaction instance. Please try again later...`});
        return;
    }
});

// Delete the transaction instance for the user
router.delete('/:username/:sequence', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let deleteQuery;
        let userId = Number();
        const transactionSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initializing /api/transaction/:username/:sequence DELETE route');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no transaction sequence in the request parameter
        Logger.log(`User's transaction sequence: ${transactionSequence}`);
        if (!transactionSequence) {
            Logger.error('Error: User must provide a transaction instance');
            res.status(400).json({ message: "You must provide a transaction instance." });
            return;
        }

        // Retrieve the user's id
        selectQuery = "SELECT user_id FROM user WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of deleting a transaction instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        Logger.log(resultQuery);
        userId = Number(resultQuery[0].user_id);

        // Delete the transaction instance
        deleteQuery = "DELETE FROM transaction WHERE user_id = ? AND transaction_sequence = ?;";
        Logger.log(deleteQuery);
        resultQuery = await executeWriteQuery(deleteQuery, [userId, transactionSequence]);
        Logger.log(resultQuery);

        Logger.log(`Successfully deleted transaction instance #${transactionSequence} for ${usernameFromParameter}`);
        res.status(200).json({ message: `Successfully deleted this particular transaction for you.`});
        return;
        

    } catch (err) {
        Logger.error(`Error: A server error occured while attempting to delete the transaction instance for the user.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while trying to delete this transaction for you. Please try again later...`});
        return;

    }
});


export default router;