import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import user from './routes/user.js';
import page from './routes/page.js';
import account from './routes/account.js';
import currency from './routes/currency.js';
import savings from './routes/savings.js';
import transaction from './routes/transaction.js';
import budget from './routes/budget.js';
import category from './routes/category.js';
import dashboard from './routes/dashboard.js';

// Allow hidden backend variables (from .env) to be used in the application
dotenv.config();

// Auto-starts the scheduler
import './jobs/schedule.js'; 

// Create an instance of an express application
const app = express();

// Add cors header to the server (Allow allows certain websites to use this backend server)
const corsOption = {
    origin: process.env.FRONTEND_URL || 'https://localhost:3000',
    credentials: true
}
app.use(cors(corsOption));

// Setup and access request body
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Setup middleware routes
app.use('/api/user', user);
app.use('/api/page', page);
app.use('/api/account', account);
app.use('/api/currency', currency);
app.use('/api/savings', savings);
app.use('/api/transaction', transaction);
app.use('/api/budget', budget);
app.use('/api/category', category);
app.use('/api/dashboard', dashboard);

// Start backend server operation
app.listen(process.env.APP_PORT, () => {
    console.log(`Server listening on port ${process.env.SERVER_URL}${process.env.APP_PORT}`)
});
