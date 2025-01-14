import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import routes
import user from './routes/user.js';

// Allow hidden backend variables (from .env) to be used in the application
dotenv.config();

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

// Start backend server operation
app.listen(process.env.APP_PORT, () => {
    console.log(`Server listening on port ${process.env.SERVER_URL}${process.env.APP_PORT}`)
});
