import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'connect-flash';

// --- Service Imports --- (Keep only reminder service here)
import { startReminderService } from './services/reminderService.js';

// --- Router Imports ---
import indexRouter from './routes/index.js';
import authRouter from './routes/auth.js';
import complaintRouter from './routes/complaints.js';

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Middleware --- 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Session Configuration ---
app.use(session({
    secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- Flash Middleware ---
app.use(flash());

// --- Middleware to pass user & flash messages to views ---
app.use((req, res, next) => {
    res.locals.user = req.session.userId;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// --- MOUNT ROUTERS ---
app.use('/', indexRouter);  
app.use('/', authRouter);  
app.use('/', complaintRouter);  
 

// --- ERROR HANDLING MIDDLEWARE --- 
// Catch 404s
app.use((req, res, next) => {
    const error = new Error('Not Found'); error.status = 404; next(error);
});
// General error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV === 'development' ? err : {};
    const status = err.status || 500;
    res.status(status);
    res.render('error', {
        message: err.message, error: res.locals.error, process: process
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startReminderService();
});