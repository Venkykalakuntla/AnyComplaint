// --- Auto-growing Textarea Logic ---
const refineTextarea = document.getElementById('refineInstruction');

if (refineTextarea) {
    refineTextarea.addEventListener('input', () => {
         refineTextarea.style.height = 'auto';
         refineTextarea.style.height = `${refineTextarea.scrollHeight}px`;
    });
}


// --- Copy to Clipboard Functionality ---
function copyDraft() {
    const textToCopy = document.getElementById('complaintTextArea').innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Complaint draft copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Could not copy text. Please try again or copy manually.');
    });
}

// --- Loading State for Refine Button ---
const refineForm = document.getElementById('refineForm');
const refineBtn = document.getElementById('refineBtn');

if (refineForm) {
    refineForm.addEventListener('submit', () => {
        refineBtn.disabled = true;
        refineBtn.innerHTML = 'Refining...';
        refineBtn.setAttribute('aria-busy', 'true');
    });
}
