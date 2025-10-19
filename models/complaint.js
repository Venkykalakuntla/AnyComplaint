import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalProblem: { type: String, required: true },
    complaintDraft: { type: String, required: true },
    category: { type: String, required: true },
    portal: { type: String, required: true },
    portal_id: { type: String, required: true },
    documents: { type: String, required: true },
    guide: { type: Array, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Filed', 'Awaiting Response', 'Action Taken', 'Resolved', 'Rejected', 'Closed'],
        default: 'Draft'
    }
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;