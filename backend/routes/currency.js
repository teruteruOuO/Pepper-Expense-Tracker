import express from 'express';
import { executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        Logger.log('Initializing /api/currency');

        // Retrieve currency options
        selectQuery = "SELECT currency_code AS code, currency_name AS name FROM currency;";
        resultQuery = await executeReadQuery(selectQuery);
        Logger.log(resultQuery);

        Logger.log('Successfully retrieved currency options');
        res.status(200).json({ message: 'Successfully retrieved currency options.', currency: resultQuery });
        return;

    } catch (err) {
        Logger.error('Error: A server error occured while retrieving currency options');
        Logger.error(err)
        res.status(500).json({ message: 'A server error occured while retrieving currency options. Please try again later.'});
        return;
    }
});

// Retrieve a user's preferred currency
router.get('/:username/:currency_code', authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let currency = {
            name: "",
            sign: ""
        }
        const userCurrencyCode = req.params.currency_code;
        const tokenInformation = req.user;
        const usernameFromParameter = req.params.username;
        Logger.log(`Initializing /api/currency/:username/:currency_code ROUTE`);

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

        // Retrieve the user's currency option
        selectQuery = "SELECT currency_name, currency_sign FROM currency WHERE currency_code = ?;";
        resultQuery = await executeReadQuery(selectQuery, [userCurrencyCode]);
        if (resultQuery.length !== 1) {
            Logger.error(`Error: User's preferred currency is invalid`);
            res.status(400).json({ message: "You must have a valid currency option." });
            return;
        }
        currency.name = resultQuery[0].currency_name;
        currency.sign = resultQuery[0].currency_sign;

        Logger.log(`Successfult retrieved ${usernameFromParameter}'s currency option.`);
        res.status(200).json({
            message: 'Successfully retrieved your currency option',
            currency: {
                name: currency.name,
                sign: currency.sign
            }
        });
        return;
        

    } catch (err) {
        Logger.error(`Error: A server error occured while retrieving the user's preferred currency setting.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving your preferred currency option.`});
        return;
    }
});

export default router;
