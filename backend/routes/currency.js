import express from 'express';
import { executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';

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
})

export default router;
