// routes/complaints.js
import express from 'express';
import Complaint from '../models/complaint.js';  
import { classifyAndGenerate, refineComplaint, getClarification, generateFollowUp } from '../services/aiService.js'; // Adjust path

// Middleware 
const isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        // Set flash message before redirecting
        req.flash('error_msg', 'Please log in to view that resource.');
        return res.redirect('/login');
    }
    next();
};

const router = express.Router();

router.use(isLoggedIn);

// Initial complaint generation
router.post('/submit', async (req, res, next) => {
    const { problem } = req.body;
    try {
        const { category, complaintDraft, documents, guide, portal, portal_id } = await classifyAndGenerate(problem);
        const complaint = new Complaint({
            user: req.session.userId, originalProblem: problem, complaintDraft,
            category, portal, portal_id, documents, guide
        });
        await complaint.save();
        res.render('result', {
            category, complaintText: complaintDraft, documents, guide,
            portal, portal_id, problem, complaintId: complaint._id
        });
    } catch (err) {
        console.error('Error generating complaint:', err);
        next(err);
    }
});

// Refine complaint
router.post('/refine', async (req, res, next) => {
    try {
        const { complaintId, originalProblem, complaintDraft, refineInstruction } = req.body;
        const guide = JSON.parse(req.body.guide);  
        
        const newDraft = await refineComplaint(originalProblem, complaintDraft, refineInstruction);
        const updatedComplaint = await Complaint.findByIdAndUpdate(
            complaintId, { complaintDraft: newDraft }, { new: true }
        ).lean(); // Use .lean() for plain JS object if not modifying further

        if (!updatedComplaint || updatedComplaint.user.toString() !== req.session.userId) {
             const error = new Error("Complaint not found or not authorized."); error.status = 404; throw error;
        }

        res.render('result', {
            category: updatedComplaint.category, portal: updatedComplaint.portal,
            portal_id: updatedComplaint.portal_id, documents: updatedComplaint.documents,
            guide: updatedComplaint.guide, complaintText: updatedComplaint.complaintDraft,
            problem: updatedComplaint.originalProblem, complaintId: updatedComplaint._id
        });
    } catch (err) {
        console.error('Error refining complaint:', err);
        next(err);
    }
});

// Show interactive guide
router.post('/guide', (req, res, next) => {
    try {
        const { documents, portal_id, originalProblem } = req.body;
        const guide = JSON.parse(req.body.guide);
        res.render('guide', {
            guideContent: guide, documentsContent: documents,
            portalId: portal_id, originalProblem: originalProblem
        });
    } catch (err) {
        console.error('Error parsing guide data:', err);
        next(err);
    }
});

// Handle AI chat questions
router.post('/ask-ai', async (req, res, next) => {
    const { stepContext, userQuestion, originalProblem } = req.body;
    if (!userQuestion) return res.status(400).json({ error: 'Question is required.' });

    try {
        const answer = await getClarification(
            stepContext || "General question about the guide.", userQuestion, originalProblem
        );
        res.json({ answer });
    } catch (err) {
        console.error("Error getting clarification from AI:", err);

         res.status(500).json({ error: 'Failed to get an answer from the AI.' });
    }
});

// View dashboard
router.get('/dashboard', async (req, res, next) => {
    try {
        const complaints = await Complaint.find({ user: req.session.userId }).sort({ createdAt: -1 }).lean();
        res.render('dashboard', { complaints });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        next(err);
    }
});

// Update complaint status
router.post('/complaint/status/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        const updated = await Complaint.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId }, { status: status }
        );
        if (!updated) { const error = new Error("Complaint not found or not authorized."); error.status = 404; throw error; }
        req.flash('success_msg', 'Complaint status updated successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error updating status:', err);
        req.flash('error_msg', 'Failed to update status.');
        res.redirect('/dashboard');  
    }
});

// Delete complaint
router.post('/complaint/delete/:id', async (req, res, next) => {
    try {
        const deleted = await Complaint.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
        if (!deleted) { const error = new Error("Complaint not found or not authorized."); error.status = 404; throw error; }
        req.flash('success_msg', 'Complaint deleted successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error deleting complaint:', err);
        req.flash('error_msg', 'Failed to delete complaint.');
        res.redirect('/dashboard');
    }
});

// View single complaint detail
router.get('/complaint/:id', async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({
            _id: req.params.id, user: req.session.userId
        }).lean();
        if (!complaint) {
            const error = new Error('Complaint not found or you do not have permission to view it.'); error.status = 404; throw error;
        }
        res.render('complaint-detail', { complaint });
    } catch (err) {
        console.error('Error fetching complaint details:', err);
        next(err);
    }
});

// Generate follow-up
router.get('/follow-up/:id', async (req, res, next) => {
    try {
        const originalComplaint = await Complaint.findOne({
            _id: req.params.id, user: req.session.userId
        }).lean();  
        if (!originalComplaint) {
            const error = new Error('Complaint not found or not authorized.'); error.status = 404; throw error;
        }
        const { followUpDraft } = await generateFollowUp(originalComplaint);
        res.render('follow-up-detail', {
            originalComplaint, followUpDraft
        });
    } catch (err) {
        console.error('Error generating follow-up:', err);
        next(err);
    }
});

export default router;