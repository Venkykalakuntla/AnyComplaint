// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';  

const router = express.Router();

// Show registration form
router.get('/register', (req, res) => {
    res.render('register');
});

// Handle registration
router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error_msg', 'User with this email already exists. Please log in instead.');
            return res.redirect('/register');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        req.flash('success_msg', 'Registration successful! You can now log in.');
        res.redirect('/login');
    } catch (err) {
        console.error('Error registering user:', err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/register');  
    }
});

// Show login form
router.get('/login', (req, res) => {
    res.render('login');
});

// Handle login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid credentials.');
            return res.redirect('/login');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid credentials.');
            return res.redirect('/login');
        }
        req.session.userId = user._id;
        req.flash('success_msg', 'You are now logged in.');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error logging in:', err);
        req.flash('error_msg', 'An error occurred during login.');
        res.redirect('/login');
    }
});

// Handle logout
router.get('/logout', (req, res, next) => {
    req.flash('success_msg', 'You have been logged out successfully.'); 
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            
            req.flash('error_msg', 'Could not log out properly, but session data is cleared.');
        }
        res.clearCookie('connect.sid');
        return res.redirect('/login');  
    });
});


export default router;