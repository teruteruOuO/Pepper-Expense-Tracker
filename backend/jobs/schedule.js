import cron from 'node-cron';
import dotenv from 'dotenv';
import { executeReadQuery } from '../utilities/pool.js';
import nodemailer from 'nodemailer';
import { longDateFormat } from '../utilities/format-date.js';
import Logger from '../utilities/logger.js';

dotenv.config();
console.log("Scheduler initialized...");

// Create a cron datetime manager
function create_cron_datetime(seconds, minute, hour, dayOfMonth, month, dayOfWeek) {
    return `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

cron.schedule(
    create_cron_datetime(0, 0, 1, '*', '*', '*'),
    async () => {
        try {
            let selectQuery;
            let resultQuery;
            let userReports = [];
            const myEmail = {
                service: "gmail",
                auth: {
                    user: process.env.NODEMAILER_EMAIL,
                    pass: process.env.NODEMAILER_PASSWORD
                },
                pool: true, // Use connection pooling
                tls: { rejectUnauthorized: false } // Bypass certificate issues
            };
            
            let mailOptions = {
                from: `"Pepper's Expense Tracker" <${process.env.NODEMAILER_EMAIL}>`,
                to: "",
                subject: "Daily Email Report",
                html: ``
            }
            let transporter = nodemailer.createTransport(myEmail);

            // Retrieve budgets due soon for each user
            selectQuery = `SELECT user_username, user_email, budget_id, budget_name, budget_end_date, ROUND((budget_used_amount / budget_amount) * 100, 2) AS budget_progress, DATEDIFF(budget_end_date, CURDATE()) AS days_until_due FROM user u JOIN budget b ON u.user_id = b.user_id WHERE budget_end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND user_notification = 1 ORDER BY user_username;`;
            resultQuery = await executeReadQuery(selectQuery);
            if (!resultQuery.length) {
                Logger.log(`There are no budgets that are due soon for any user`);

            } else {
                resultQuery.forEach(user => {
                    // Check if the email already exists in userReports
                    let existingEntry = userReports.find(entry => entry.email === user.user_email);
                
                    let newBudget = {
                        id: user.budget_id,
                        name: user.budget_name,
                        end: longDateFormat(user.budget_end_date),
                        progress: `${user.budget_progress}%`,
                        days_until_due: user.days_until_due
                    };
                
                    if (existingEntry) {
                        // If the email exists, add the budget to the existing budget array
                        existingEntry.budgets.push(newBudget);
    
                    } else {
                        // If the email does not exist, create a new entry
                        userReports.push({
                            email: user.user_email,
                            username: user.user_username,
                            budgets: [newBudget]
                        });
                    }
                });
            }

            // Retrieve savings due soon for each user
            selectQuery = "SELECT user_username, user_email, savings_sequence, savings_name, savings_deadline_date, ROUND((savings_current_amount / savings_target_amount) * 100, 2) AS savings_progress, DATEDIFF(savings_deadline_date, CURDATE()) AS days_until_due FROM user u JOIN savings s ON u.user_id = s.user_id WHERE savings_deadline_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND user_notification = 1 ORDER BY user_username;";
            resultQuery = await executeReadQuery(selectQuery);
            if (!resultQuery.length) {
                Logger.log(`There are no savings that are due soon for any user`);
            } else {
                resultQuery.forEach(user => {
                    // Check if the email already exists in userReports
                    let existingEntry = userReports.find(entry => entry.email === user.user_email);
                
                    let newSavings = {
                        sequence: user.savings_sequence,
                        name: user.savings_name,
                        end: longDateFormat(user.savings_deadline_date),
                        progress: `${user.savings_progress}%`,
                        days_until_due: user.days_until_due
                    };
                
                    if (existingEntry) {
                        // If the email exists, add the savings to the existing savings array
                        // Ensure `savings` array exists before pushing
                        if (!existingEntry.savings) {
                            existingEntry.savings = []; // Initialize savings if undefined
                        }
                        existingEntry.savings.push(newSavings);
    
                    } else {
                        // If the email does not exist, create a new entry
                        userReports.push({
                            email: user.user_email,
                            username: user.user_username,
                            savings: [newSavings]
                        });
                    }
                });
            }

            // Retrieve unresolved expense transactions due soon for each user
            selectQuery = "SELECT user_username, user_email, transaction_sequence, transaction_name, transaction_date,  DATEDIFF(transaction_date, CURDATE()) AS days_until_due FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE transaction_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY) AND transaction_resolved = 0 AND transaction_type = 'expense' AND user_notification = 1 ORDER BY user_username;";
            resultQuery = await executeReadQuery(selectQuery);
            if (!resultQuery.length) {
                Logger.log(`There are no expense transactions that are due soon for any user`);
            } else {
                resultQuery.forEach(user => {
                    // Check if the email already exists in userReports
                    let existingEntry = userReports.find(entry => entry.email === user.user_email);
                
                    let newUpcomingExpenseTransaction = {
                        sequence: user.transaction_sequence,
                        name: user.transaction_name,
                        date: longDateFormat(user.transaction_date),
                        days_until_due: user.days_until_due
                    };
                
                    if (existingEntry) {
                        // If the email exists, add the expense transaction to the existing expense transaction array
                        // Ensure `upcoming_transactions` array exists before pushing
                        if (!existingEntry.upcoming_transactions) {
                            existingEntry.upcoming_transactions = []; // Initialize upcoming_transactions if undefined
                        }
                        existingEntry.upcoming_transactions.push(newUpcomingExpenseTransaction);
    
                    } else {
                        // If the email does not exist, create a new entry
                        userReports.push({
                            email: user.user_email,
                            username: user.user_username,
                            upcoming_transactions: [newUpcomingExpenseTransaction]
                        });
                    }
                });
            }

            // Retrieve unresolved expense transactions that are overdue for each user
            selectQuery = "SELECT user_username, user_email, transaction_sequence, transaction_name, transaction_date, DATEDIFF(NOW(), transaction_date) AS days_overdue FROM user u JOIN transaction t ON u.user_id = t.user_id WHERE transaction_date < NOW() AND transaction_resolved = 0 AND transaction_type = 'expense' AND user_notification = 1 ORDER BY user_username;";
            resultQuery = await executeReadQuery(selectQuery);
            if (!resultQuery.length) {
                Logger.log(`There are no expense transactions that are overdue for any user`);
            } else {
                resultQuery.forEach(user => {
                    // Check if the email already exists in userReports
                    let existingEntry = userReports.find(entry => entry.email === user.user_email);
                
                    let newOverdueExpenseTransaction = {
                        sequence: user.transaction_sequence,
                        name: user.transaction_name,
                        date: longDateFormat(user.transaction_date),
                        days_overdue: user.days_overdue
                    };
                
                    if (existingEntry) {
                        // If the email exists, add the expense transaction to the existing expense transaction array
                        // Ensure `overdue_transactions` array exists before pushing
                        if (!existingEntry.overdue_transactions) {
                            existingEntry.overdue_transactions = []; // Initialize overdue_transactions if undefined
                        }
                        existingEntry.overdue_transactions.push(newOverdueExpenseTransaction);
    
                    } else {
                        // If the email does not exist, create a new entry
                        userReports.push({
                            email: user.user_email,
                            username: user.user_username,
                            overdue_transactions: [newOverdueExpenseTransaction]
                        });
                    }
                });
            }

            // Email reports to each user
            userReports.forEach(user => {
                mailOptions.to = user.email;
                mailOptions.html = `<h1>Daily Summary Reports</h1><br/><br/>`;

                // Upcoming Budgets Format
                if (user.budgets) {
                    mailOptions.html += `<h2>Budgets Due Soon</h2>`
                    mailOptions.html += `
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr>
                                        <th style="background-color:rgb(255, 193, 193);">Budget Name</th>
                                        <th style="background-color:rgb(255, 193, 193);">End Date</th>
                                        <th style="background-color:rgb(255, 193, 193);">Progress</th>
                                        <th style="background-color:rgb(255, 193, 193);">Days Until Due</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                    user.budgets.forEach(budget => {
                        mailOptions.html += `<tr>
                                                <td>${budget.name}</td>
                                                <td>${budget.end}</td>
                                                <td>${budget.progress}</td>
                                                <td>${budget.days_until_due}</td>
                                            </tr>`;
                    });

                    mailOptions.html += `</tbody></table><br/><br/><br/>`;
                }

                // Upcoming Savings Format
                if (user.savings) {
                    mailOptions.html += `<h2>Savings Due Soon</h2>`
                    mailOptions.html += `
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr>
                                        <th style="background-color:rgb(255, 193, 193);">Savings Name</th>
                                        <th style="background-color:rgb(255, 193, 193);">End Date</th>
                                        <th style="background-color:rgb(255, 193, 193);">Progress</th>
                                        <th style="background-color:rgb(255, 193, 193);">Days Until Due</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                    user.savings.forEach(savings => {
                        mailOptions.html += `<tr>
                                                <td>${savings.name}</td>
                                                <td>${savings.end}</td>
                                                <td>${savings.progress}</td>
                                                <td>${savings.days_until_due}</td>
                                            </tr>`;
                    });

                    mailOptions.html += `</tbody></table><br/><br/><br/>`;
                }

                // Upcoming Expense Transactions Format
                if (user.upcoming_transactions) {
                    mailOptions.html += `<h2>Transactions Due Soon</h2>`
                    mailOptions.html += `
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr>
                                        <th style="background-color:rgb(255, 193, 193);">Expense Transaction Name</th>
                                        <th style="background-color:rgb(255, 193, 193);">Due Date</th>
                                        <th style="background-color:rgb(255, 193, 193);">Days Until Due</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                    user.upcoming_transactions.forEach(transaction => {
                        mailOptions.html += `<tr>
                                                <td>${transaction.name}</td>
                                                <td>${transaction.date}</td>
                                                <td>${transaction.days_until_due}</td>
                                            </tr>`;
                    });

                    mailOptions.html += `</tbody></table><br/><br/><br/>`;
                }

                // Overdue Expense Transactions Format
                if (user.overdue_transactions) {
                    mailOptions.html += `<h2>Overdue Transactions</h2>`
                    mailOptions.html += `
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr>
                                        <th style="background-color:rgb(255, 193, 193);">Expense Transaction Name</th>
                                        <th style="background-color:rgb(255, 193, 193);">Due Date</th>
                                        <th style="background-color:rgb(255, 193, 193);">Days Overdue</th>
                                    </tr>
                                </thead>
                                <tbody>`;

                    user.overdue_transactions.forEach(transaction => {
                        mailOptions.html += `<tr>
                                                <td>${transaction.name}</td>
                                                <td>${transaction.date}</td>
                                                <td>${transaction.days_overdue}</td>
                                            </tr>`;
                    });

                    mailOptions.html += `</tbody></table><br/><br/><br/>`;
                }

                // Send reporting email to each user
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        Logger.error(`Error: An error occured while sending a summary report to ${user.username}`);
                        Logger.error(error);

                    } else {
                        Logger.log(`Successfully sent the summary report email to ${user.username}`);
                    }
                });
                
            });
            

        } catch (err) {
            Logger.log(`An error occured while sending a scheduled email to users.`);
            Logger.error(err);
        }
});


