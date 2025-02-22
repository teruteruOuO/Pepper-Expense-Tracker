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


export default router;