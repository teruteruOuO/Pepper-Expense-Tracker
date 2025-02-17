import express from 'express';
import { executeWriteQuery, executeReadQuery, executeTransaction } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import formateDate from '../utilities/format-date.js';

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

// Add a savings instance to the user's account
router.post(`/:username`, authorizeToken, async (req, res) => {
    try {
        let userID = Number();
        let savingsCurrentCount = Number();
        let selectQuery;
        let resultQuery;
        let insertQuery;
        let dollar_to_currency = Number();
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        let { name, 
            description, 
            deadline, 
            amount: { current, target } } = req.body;
        Logger.log('Initalizing /api/savings/:username PUT ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if savings name, deadline, current, and target amounts are not in the request body
        if (!name || !deadline || target == undefined || current == undefined ) {
            Logger.error(`Error: User is missing the required inputs: name, deadline, and current and target amounts.`);
            res.status(400).json({ message: `You are missing the required savings inputs: name, deadline, current, and target amounts`});
            return;
        }

        // Return the user's id and currency settings
        selectQuery = "SELECT user_id, user_username, c. currency_code, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;"
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of adding savings instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        userID = Number(resultQuery[0].user_id);
        dollar_to_currency = Number(resultQuery[0].dollar_to_currency);

        // Return the current count of the user's savings then add 1 for sequence
        selectQuery = "SELECT savings_sequence AS current_savings_num FROM savings WHERE user_id = ? ORDER BY savings_sequence DESC LIMIT 1;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [userID]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${userID} was deleted or stopped existing while the process of adding savings instance is ongoing`);
            res.status(400).json({ message: `Invalid user` });
            return;
        }
        savingsCurrentCount = Number(resultQuery[0].current_savings_num) + 1;

        // Neutralize the inputs: remove excessive whitespace and convert the numbers into dollar
        name = name.trim().replace(/\s+/g, ' ');
        description = typeof description === 'string' ? description.replace(/\s+/g, ' ').trim() : null;
        deadline = formateDate(deadline);
        current = Number(current) / Number(dollar_to_currency);
        target = Number(target) / Number(dollar_to_currency);

        // Insert the inputs to the database
        insertQuery = "INSERT INTO savings VALUES (?, ?, ?, ?, ?, ?, ?);";
        Logger.log(insertQuery);
        resultQuery = await executeWriteQuery(insertQuery, [userID, savingsCurrentCount, name, description, target, current, deadline]);
        Logger.log(`Successfully added the user's savings to the database.`);
        Logger.log(resultQuery);

        res.status(201).json({ message: `Successfully added your savings, ${name}, to your account!`});
        return;

        
    } catch (err) {
        Logger.error(`Error: A server error occured while adding a savings instance to the user's account.`);
        Logger.error(err);

        if (err instanceof Error) {
            // Constraint error messages directly from the database

            // Throw an error when target amount <= 0
            if (err.sqlMessage.includes('chk_target_amount')) {
                Logger.error(`Error: The user provided a target amount with a value of 0`);
                res.status(400).json({ message: 'Your target amount MUST not be less than or equal to 0.' });
                return;
            }

            // Throw an error when current amount < 0
            if (err.sqlMessage.includes('chk_current_amount')) {
                Logger.error(`Error: The user provided a current amount with a value of less than 0`);
                res.status(400).json({ message: 'Your current amount MUST not be less than 0.' });
                return;
            }

        }

        res.status(500).json({ message: `A server error occured while adding a savings information to your account. Please try again later.`});
        return;
    }
});

// Retrieve a user's savings current and target amounts
router.get(`/:username/instance/:sequence`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let savingsAmount = {
            current: Number(),
            target: Number(),
            progress: Number(),
            sequence: Number()
        }
        let currency = {
            dollar_to_currency: Number(),
            sign: "",
            name: ""
        };
        const savingsSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initalizing /:username/:currency_code/:sequence GET ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no savings sequence in the request parameter
        Logger.log(`User's savings sequence: ${savingsSequence}`);
        if (!savingsSequence) {
            Logger.error('Error: User must provide a savings instance');
            res.status(400).json({ message: "You must provide a savings instance." });
            return;
        }

        // Retrieve user's currency setting and the savings instance's target and current amounts
        selectQuery = "SELECT savings_sequence, savings_current_amount, savings_target_amount, dollar_to_currency, currency_name, currency_sign FROM user u JOIN savings s ON s.user_id = u.user_id JOIN currency c ON c.currency_code = u.currency_code WHERE savings_sequence = ? AND user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [savingsSequence, usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: Unable to find current and target amount information for ${savingsSequence} by ${usernameFromParameter}`);
            res.status(400).json({ message: "Unable to retrieve the savings instance for you as it may not exist. Only click or refer to the ones that exist in the Savings Page." });
            return;
        }
        Logger.log(resultQuery);
        currency.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        currency.sign = resultQuery[0].currency_sign;
        currency.name = resultQuery[0].currency_name;
        savingsAmount.target = Number((Number(resultQuery[0].savings_target_amount) * currency.dollar_to_currency).toFixed(2));
        savingsAmount.current = Number((Number(resultQuery[0].savings_current_amount) * currency.dollar_to_currency).toFixed(2));;
        savingsAmount.sequence = Number(resultQuery[0].savings_sequence);
        savingsAmount.progress = (Number(resultQuery[0].savings_current_amount) / Number(resultQuery[0].savings_target_amount)) * 100;
        Logger.log('Processed inputs:');
        Logger.log(currency);
        Logger.log(savingsAmount);

        Logger.log(`Successfully retrieved ${usernameFromParameter}'s saving instance #${savingsAmount.sequence}`);
        res.status(200).json({
            message: `Successfully retrieve your savings instance information.`,
            savings_amount: {
                current: savingsAmount.current,
                target: savingsAmount.target,
                progress: savingsAmount.progress,
                sequence: savingsAmount.sequence
            },
            currency: {
                name: currency.name,
                sign: currency.sign
            }
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving the user savings instances.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving this certain savings information. Please try again later.`});
        return;
    }
});

// Update the user savings instance's current amount
router.post('/update-current-amount/:username/:sequence', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let updateQuery;
        let resultQuery;
        let updatedCurrentAmount = Number();
        let convertedUpdatedCurrentAmount = Number();
        const savingsSequence = req.params.sequence;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        let { current_amount, input, operation } = req.body;
        const databaseResult = {
            id: Number(),
            dollar_to_currency: Number()
        }
        Logger.log('Initalizing /update-current-amount/:username/:sequence POST ROUTE.');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Throw an error if there's no savings sequence in the request parameter
        Logger.log(`User's savings sequence: ${savingsSequence}`);
        if (!savingsSequence) {
            Logger.error('Error: User must provide a savings instance');
            res.status(400).json({ message: "You must provide a savings instance." });
            return;
        }

        // Throw an error if current amount, input value, and operation are not in the request body.
        if (current_amount == undefined || !input || !operation) {
            Logger.error('Error: User is missing the current amount, input value, and operation in the request body.');
            res.status(403).json({ message: "You must provide the current amount, input value, and operation before you can continue to use this process." });
            return;
        }

        // Begin operation
        if (operation === 'add') {
            updatedCurrentAmount = current_amount + input;
        } else {
            updatedCurrentAmount = current_amount - input;
        }
        
        // Retrieve the user's id and currency settings.
        selectQuery = "SELECT user_id, dollar_to_currency FROM user u JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ?;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User ${usernameFromParameter} was deleted or stopped existing while the process of updating their savings #${savingsSequence} is ongoing.`);
            res.status(400).json({ message: `Invalid user` });
            return;
        } 
        databaseResult.dollar_to_currency = Number(resultQuery[0].dollar_to_currency);
        databaseResult.id = Number(resultQuery[0].user_id);

        // Converted the updated current amount to USD before inserting
        convertedUpdatedCurrentAmount = updatedCurrentAmount / databaseResult.dollar_to_currency;

        // Update current amount
        updateQuery = "UPDATE savings SET savings_current_amount = ? WHERE user_id = ? AND savings_sequence = ?;";
        Logger.log(updateQuery)
        resultQuery = await executeWriteQuery(updateQuery, [convertedUpdatedCurrentAmount, databaseResult.id, savingsSequence]);
        Logger.log(resultQuery);

        Logger.log(`Successfully updated  ${usernameFromParameter}s #${savingsSequence} savings.`);
        res.status(200).json({ message: `Successfully updated your saving's current amount!`});
        return;

    } catch (err) {
        Logger.error(`A server error occured while updating the user savings instances' current amount.`);
        Logger.error(err);

        if (err instanceof Error) {
            // Constraint error messages directly from the database
            // Throw an error when current amount < 0
            if (err.sqlMessage.includes('chk_current_amount')) {
                Logger.error(`Error: The user provided a current amount with a value of less than 0`);
                res.status(400).json({ message: 'Your current amount MUST not be less than 0. You may have subtracted too much that the current amount resulted with a negative amount. Try again.' });
                return;
            }
        }

        res.status(500).json({ message: `A server error occured while trying to add/deduct from your current savings. Please try again later...`});
        return;

    }
});

export default router;
