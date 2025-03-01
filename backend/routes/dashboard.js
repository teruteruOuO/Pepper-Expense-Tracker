import express from 'express';
import {executeReadQuery} from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';
import { longDateFormat } from '../utilities/format-date.js';

const router = express.Router();

// Retrieve upcoming deadlines for expense transactions, savings, and budgets
router.get(`/deadlines/:username`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let dueBudgets;
        let dueSavings;
        let dueExpenseTransactions;
        let overdueExpenseTransactions;
        const usernameFromParameter = req.params.username;
        const tokenInformation = req.user;
        Logger.log('Initalizing /api/dashboard/deadlines/:username');

        // If the accessing user does not match the user accessing the route with the same username, then throw an error
        Logger.log(`Token Username: ${tokenInformation.username}`);
        Logger.log(`Parameter Username: ${usernameFromParameter}`);
        if (tokenInformation.username !== usernameFromParameter) {
            Logger.error('Error: User accessing the resource does not match the user in the parameter');
            res.status(403).json({ message: "You are unauthorized to retrieve this information." });
            return;
        }

        // Retrieve budgets due soon for a user
        selectQuery = "SELECT b.budget_id, b.budget_name, DATE_FORMAT(CONVERT_TZ(b.budget_end_date, 'UTC', 'America/Chicago'), '%b %e, %Y') AS budget_end_date, ROUND((b.budget_used_amount / b.budget_amount) * 100, 2) AS budget_progress, DATEDIFF(CONVERT_TZ(b.budget_end_date, 'UTC', 'America/Chicago'), CURDATE()) AS days_until_due FROM user u JOIN budget b ON u.user_id = b.user_id WHERE CONVERT_TZ(b.budget_end_date, 'UTC', 'America/Chicago') BETWEEN CONVERT_TZ(NOW(), 'UTC', 'America/Chicago') AND DATE_ADD(CONVERT_TZ(NOW(), 'UTC', 'America/Chicago'), INTERVAL 30 DAY) AND u.user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like there's no budget that is due soon for ${usernameFromParameter}`);
        } else {
            dueBudgets = resultQuery.map(budget => {
                return {
                    id: Number(budget.budget_id),
                    name: budget.budget_name,
                    end_date: budget.budget_end_date,
                    progress: Number(budget.budget_progress),
                    days_until_due: Number(budget.days_until_due)
                }
            });
            Logger.log(`Budget deadline summary for ${usernameFromParameter}`);
            Logger.log(dueBudgets);
        }

        // Retrieve savings due soon for a user
        selectQuery = "SELECT s.savings_sequence, s.savings_name, DATE_FORMAT(CONVERT_TZ(s.savings_deadline_date, 'UTC', 'America/Chicago'), '%b %e, %Y') AS savings_deadline_date, ROUND((s.savings_current_amount / s.savings_target_amount) * 100, 2) AS savings_progress, DATEDIFF(CONVERT_TZ(s.savings_deadline_date, 'UTC', 'America/Chicago'), CURDATE()) AS days_until_due FROM user u JOIN savings s ON u.user_id = s.user_id WHERE CONVERT_TZ(s.savings_deadline_date, 'UTC', 'America/Chicago') BETWEEN CONVERT_TZ(NOW(), 'UTC', 'America/Chicago') AND DATE_ADD(CONVERT_TZ(NOW(), 'UTC', 'America/Chicago'), INTERVAL 30 DAY) AND u.user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like there's no savings that is due soon for ${usernameFromParameter}`);
        } else {
            dueSavings = resultQuery.map(savings => {
                return {
                    sequence: Number(savings.savings_sequence),
                    name: savings.savings_name,
                    deadline: savings.savings_deadline_date,
                    progress: Number(savings.savings_progress),
                    days_until_due: Number(savings.days_until_due)
                }
            });
            Logger.log(`Savings deadline summary for ${usernameFromParameter}`);
            Logger.log(dueSavings);
        }

        // Retrieve unresolved expense transaction due soon for a user
        selectQuery = "SELECT transaction_sequence, transaction_name, DATE_FORMAT(CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago'), '%b %e, %Y') AS transaction_date, DATEDIFF(CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago'), CURDATE()) AS days_until_due FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago') BETWEEN CONVERT_TZ(NOW(), 'UTC', 'America/Chicago') AND DATE_ADD(CONVERT_TZ(NOW(), 'UTC', 'America/Chicago'), INTERVAL 30 DAY) AND transaction_resolved = 0 AND transaction_type = 'expense' AND user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like there's no expense transaction that is due soon for ${usernameFromParameter}`);
        } else {
            dueExpenseTransactions = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    deadline: transaction.transaction_date,
                    days_until_due: Number(transaction.days_until_due)
                }
            });
            Logger.log(`Expense Transaction deadline summary for ${usernameFromParameter}`);
            Logger.log(dueExpenseTransactions);
        }

        // Retrieve unresolved expense transactions that are overdue for a user
        selectQuery = "SELECT t.transaction_sequence, t.transaction_name, DATE_FORMAT(CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago'), '%b %e, %Y') AS transaction_date, DATEDIFF(CONVERT_TZ(NOW(), 'UTC', 'America/Chicago'), CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago')) AS days_overdue FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE CONVERT_TZ(t.transaction_date, 'UTC', 'America/Chicago') < CONVERT_TZ(NOW(), 'UTC', 'America/Chicago') AND t.transaction_resolved = 0 AND t.transaction_type = 'expense' AND u.user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like there's no expense transaction that is overdue for ${usernameFromParameter}`);
        } else {
            overdueExpenseTransactions = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    deadline: transaction.transaction_date,
                    days_until_due: Number(transaction.days_overdue)
                }
            });
            Logger.log(`Expense Transaction overdue summary for ${usernameFromParameter}`);
            Logger.log(overdueExpenseTransactions);
        }

        
        res.status(200).json({
            message: `Successfully retrieved all deadline summary information for ${usernameFromParameter}`,
            deadline_summary: {
                due_budgets: dueBudgets,
                due_savings: dueSavings,
                due_expense_transactions: dueExpenseTransactions,
                overdue_expense_transactions: overdueExpenseTransactions
            }
        });
        return;

    } catch (err) {
        Logger.error(`Error: A server error occured and unable to retrieve deadlines for a user`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured; therefore, we cannot retrieve your deadline summary for you. Please try again later.`});
        return;
    }
});

export default router;