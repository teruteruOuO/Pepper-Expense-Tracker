import express from 'express';
import { executeReadQuery } from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';

const router = express.Router();

// Retrieve all categories
router.get(`/`, authorizeToken, async(req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        const tokenInformation = req.user;
        Logger.log('Initalizing /api/category ROUTE.');

        // Retrieve all categories
        selectQuery = "SELECT category_id, category_name, category_type FROM category;";
        Logger.log(selectQuery);
        resultQuery = await executeReadQuery(selectQuery);
        Logger.log(resultQuery);

        Logger.log(`Successfully retrieved category names`);
        res.status(200).json({
            message: `Successfully retrieved categories for ${tokenInformation.username}`,
            category: resultQuery
        });
        return;

    } catch (err) {
        Logger.error(`A server error occured while retrieving category names.`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured while retrieving category names. Please try again later.`});
        return;
        
    }
});


export default router;