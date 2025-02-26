import cron from 'node-cron';
import dotenv from 'dotenv';
import { executeReadQuery } from '../utilities/pool.js';
import nodemailer from 'nodemailer';

dotenv.config();
console.log("Scheduler initialized...");

// Create a cron datetime manager
function create_cron_datetime(seconds, minute, hour, dayOfMonth, month, dayOfWeek) {
    return `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

cron.schedule(
    create_cron_datetime(40, 52, 18, '*', '*', '*'),
    async () => {
        try {
            let selectQuery;
            let resultQuery;
            let budgetsDueSoon = [];
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
                from: `"Ube's Expense Tracker" <${process.env.NODEMAILER_EMAIL}>`,
                to: "",
                subject: "Budgets Due Soon",
                text: ``
    
            }
            let transporter = nodemailer.createTransport(myEmail);

            // Retrieve budgets due soon for each user
            selectQuery = `SELECT user_username, user_email, budget_id, budget_name, budget_end_date, ((budget_used_amount / budget_amount) * 100) AS budget_progress FROM user u JOIN budget b ON u.user_id = b.user_id WHERE budget_end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) AND user_notification = 1 ORDER BY user_username;`;
            resultQuery = await executeReadQuery(selectQuery);
            if (!resultQuery.length) {
                console.log(`There are no budgets that are due soon for any user`);
                return;
            }
            resultQuery.forEach(user => {
                // Check if the email already exists in budgetsDueSoon
                let existingEntry = budgetsDueSoon.find(entry => entry.email === user.user_email);
            
                let newBudget = {
                    id: user.budget_id,
                    name: user.budget_name,
                    end: user.budget_end_date,
                    progress: user.budget_progress
                };
            
                if (existingEntry) {
                    // If the email exists, add the budget to the existing budget array
                    existingEntry.budget.push(newBudget);

                } else {
                    // If the email does not exist, create a new entry
                    budgetsDueSoon.push({
                        email: user.user_email,
                        budget: [newBudget]
                    });
                }
            });

            budgetsDueSoon.forEach(item => {
                console.log(item.email);
                console.log(item.budget)
            });


        } catch (err) {
            console.log(`An error occured while sending a scheduled email to users.`);
            console.error(err);
        }
});


