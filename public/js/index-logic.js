const form = document.getElementById('complaintForm');
const submitBtn = document.getElementById('submitBtn');

if (form) {
    form.addEventListener('submit', () => {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Analyzing & Generating...';
        submitBtn.setAttribute('aria-busy', 'true');
    });
}