import express from 'express';
import {executeReadQuery} from '../utilities/pool.js';
import Logger from '../utilities/logger.js';
import authorizeToken from '../utilities/authorize-token.js';

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
        selectQuery = "SELECT b.budget_id, b.budget_name, DATE_FORMAT(budget_end_date, '%b %e, %Y') AS budget_end_date, ROUND((b.budget_used_amount / b.budget_amount) * 100, 2) AS budget_progress, DATEDIFF(budget_end_date, CURDATE()) AS days_until_due FROM user u JOIN budget b ON u.user_id = b.user_id WHERE budget_end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND u.user_username = ?;";
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
        selectQuery = "SELECT savings_sequence, savings_name, DATE_FORMAT(savings_deadline_date, '%b %e, %Y') AS savings_deadline_date, ROUND((savings_current_amount / savings_target_amount) * 100, 2) AS savings_progress, DATEDIFF(savings_deadline_date, CURDATE()) AS days_until_due FROM user u JOIN savings s ON u.user_id = s.user_id WHERE savings_deadline_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND u.user_username = ?;";
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
        selectQuery = "SELECT transaction_sequence, transaction_name, DATE_FORMAT(transaction_date, '%b %e, %Y') AS transaction_date, DATEDIFF(transaction_date, CURDATE()) AS days_until_due FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE transaction_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND transaction_resolved = 0 AND transaction_type = 'expense' AND user_username = ?;";
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
        selectQuery = "SELECT t.transaction_sequence, t.transaction_name, DATE_FORMAT(transaction_date,'%b %e, %Y') AS transaction_date, DATEDIFF(NOW(), transaction_date) AS days_overdue FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE transaction_date < NOW()AND t.transaction_resolved = 0 AND t.transaction_type = 'expense' AND u.user_username = ?;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like there's no expense transaction that is overdue for ${usernameFromParameter}`);
        } else {
            overdueExpenseTransactions = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    deadline: transaction.transaction_date,
                    days_overdue: Number(transaction.days_overdue)
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

// Retrieve monthly summary for a user
router.get(`/monthly-summary/:username`, authorizeToken, async (req, res) => {
    try {
        let selectQuery;
        let resultQuery;
        let monthlyIncomeAndExpenseTotal;
        let monthlyCategoryExpense;
        let topThreeExpense;
        let totalExpensePerDay;
        let totalIncomePerDay;
        let dayOfMonthList;
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

        // Retrieve the total income and expense for the current month for the user
        selectQuery = "SELECT transaction_type, ROUND(SUM((transaction_amount * dollar_to_currency)), 2) AS total_amount FROM user u JOIN transaction t ON u.user_id = t.user_id JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ? AND MONTH(transaction_date) = MONTH(CURRENT_DATE) AND YEAR(transaction_date) = YEAR(CURRENT_DATE) GROUP BY transaction_type;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like ${usernameFromParameter} hasn't recorded any expense or income transactions for this month`);
        } else {
            monthlyIncomeAndExpenseTotal = resultQuery.map(type => {
                return {
                    type: type.transaction_type,
                    total_amount: Number(type.total_amount)
                }
            });
            Logger.log(`${usernameFromParameter} has income or expense transactions recorded for this month!`);
            Logger.log(monthlyIncomeAndExpenseTotal);
        }

        // Retrieve the expense spending by category for the current month for the user
        selectQuery = "SELECT ca.category_name, ROUND(SUM((transaction_amount * dollar_to_currency)), 2) AS total_amount FROM user u LEFT JOIN transaction t ON u.user_id = t.user_id LEFT JOIN currency c ON u.currency_code = c.currency_code LEFT JOIN category ca ON t.category_id = ca.category_id WHERE user_username = ? AND transaction_type = 'expense' AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE) AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE) GROUP BY ca.category_id;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like ${usernameFromParameter} hasn't recorded any expense transactions for this month`);
        } else {
            monthlyCategoryExpense = resultQuery.map(category => {
                return {
                    name: category.category_name,
                    total_amount: Number(category.total_amount)
                }
            });
            Logger.log(`${usernameFromParameter} has expense transactions recorded for this month!`);
            Logger.log(monthlyCategoryExpense);
        }

        // Retrieve the top 3 largest expenses for the current month for a user
        selectQuery = "SELECT transaction_sequence, transaction_name, ROUND((transaction_amount * dollar_to_currency), 2) AS transaction_amount, DATE_FORMAT(t.transaction_date, '%b %e, %Y') AS transaction_date FROM user u LEFT JOIN transaction t ON u.user_id = t.user_id LEFT JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ? AND transaction_type = 'expense' AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE) AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE) ORDER BY transaction_amount DESC LIMIT 3;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like ${usernameFromParameter} hasn't recorded any expense transactions for this month`);
        } else {
            topThreeExpense = resultQuery.map(transaction => {
                return {
                    sequence: Number(transaction.transaction_sequence),
                    name: transaction.transaction_name,
                    amount: Number(transaction.transaction_amount),
                    date: transaction.transaction_date
                }
            });
            Logger.log(`${usernameFromParameter} has expense transactions recorded for this month!`);
            Logger.log(topThreeExpense);
        }

        // Retrieve total resolved expenses for each day for the current month for the user
        selectQuery = "WITH RECURSIVE days AS ( SELECT 1 AS day_number UNION ALL SELECT day_number + 1 FROM days WHERE day_number < DAY(LAST_DAY(CURRENT_DATE)) ) SELECT DAY(t.transaction_date) AS day_of_month, ROUND(SUM(transaction_amount * dollar_to_currency), 2) AS expense_transaction_amount_for_the_day FROM user u LEFT JOIN transaction t ON u.user_id = t.user_id LEFT JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ? AND transaction_type = 'expense' AND transaction_resolved = 1 AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE) AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE) GROUP BY day_of_month ORDER BY day_of_month;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like ${usernameFromParameter} hasn't recorded any resolved expense transactions for this month`);
        } else {
            totalExpensePerDay = resultQuery.map(transaction => {
                return {
                    day: Number(transaction.day_of_month),
                    total_expense_amount: Number(transaction.expense_transaction_amount_for_the_day)
                }
            });
            Logger.log(`${usernameFromParameter} has resolved expense transactions recorded for this month!`);
            Logger.log(totalExpensePerDay);
        }

        // Retrieve total income for each day for the current month for the user
        selectQuery = "WITH RECURSIVE days AS ( SELECT 1 AS day_number UNION ALL SELECT day_number + 1 FROM days WHERE day_number < DAY(LAST_DAY(CURRENT_DATE)) ) SELECT DAY(t.transaction_date) AS day_of_month, ROUND(SUM(transaction_amount * dollar_to_currency), 2) AS income_transaction_amount_for_the_day FROM user u LEFT JOIN transaction t ON u.user_id = t.user_id LEFT JOIN currency c ON u.currency_code = c.currency_code WHERE user_username = ? AND transaction_type = 'income' AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE) AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE) GROUP BY day_of_month ORDER BY day_of_month;";
        resultQuery = await executeReadQuery(selectQuery, [usernameFromParameter]);
        if (!resultQuery.length) {
            Logger.log(`Seems like ${usernameFromParameter} hasn't recorded any income transactions for this month`);
        } else {
            totalIncomePerDay = resultQuery.map(transaction => {
                return {
                    day: Number(transaction.day_of_month),
                    total_income_amount: Number(transaction.income_transaction_amount_for_the_day)
                }
            });
            Logger.log(`${usernameFromParameter} has income transactions recorded for this month!`);
            Logger.log(totalIncomePerDay);
        }

        // If total expense or income per day have items, then retrieve the list of days for the current month
        if (totalExpensePerDay || totalIncomePerDay) {
            selectQuery = "WITH RECURSIVE days AS ( SELECT 1 AS day_number UNION ALL SELECT day_number + 1 FROM days WHERE day_number < DAY(LAST_DAY(CURRENT_DATE)) ) SELECT day_number FROM days;";
            resultQuery = await executeReadQuery(selectQuery);
            dayOfMonthList = resultQuery.map(day => Number(day.day_number));
        }

        res.status(200).json({
            message: `Successfully retrieved ${usernameFromParameter}'s monthly summary`,
            monthly_summary: {
                income_and_expense_pie: monthlyIncomeAndExpenseTotal,
                expense_by_category: monthlyCategoryExpense,
                top_three_expenses: topThreeExpense,
            },
            run_chart: {
                expenses_per_day: totalExpensePerDay,
                income_per_day: totalIncomePerDay,
                day_list: dayOfMonthList
            } 
        });


    } catch (err) {
        Logger.error(`Error: A server error occured and unable to retrieve monthly summary for a user`);
        Logger.error(err);
        res.status(500).json({ message: `A server error occured; therefore, we cannot retrieve your monthly summary for you. Please try again later.`});
        return;
    }
});

export default router;