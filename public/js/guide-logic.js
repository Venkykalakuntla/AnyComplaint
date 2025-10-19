// --- DOM Element Selection ---
const chatForm = document.getElementById('chatForm');
const chatHistory = document.getElementById('chatHistory');
const userQuestionInput = document.getElementById('userQuestion');
const submitButton = chatForm.querySelector('button');
const currentStepDisplay = document.getElementById('currentStepDisplay');
const stepCards = document.querySelectorAll('.step-card');

// --- Safely Get Server Data from the hidden div ---
const dataElement = document.getElementById('server-data');
const originalProblem = JSON.parse(dataElement.dataset.originalproblem);

// --- State Variables ---
let currentStepContext = '';
let currentStepNumber = null;

// --- Event Listener for Step Selection ---
stepCards.forEach(card => {
    card.addEventListener('click', () => {
        stepCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        currentStepNumber = card.dataset.stepNumber;
        currentStepContext = card.dataset.context;

        currentStepDisplay.textContent = `Step ${currentStepNumber}`;
        currentStepDisplay.classList.add('active');

        userQuestionInput.disabled = false;
        submitButton.disabled = false;
        userQuestionInput.placeholder = 'Type your question here...';
        userQuestionInput.focus();
    });
});

// --- Event Listener for Form Submission ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = userQuestionInput.value.trim();
    if (!question || !currentStepContext) return;

    appendBubble(question, 'user');
    userQuestionInput.value = '';
    submitButton.disabled = true;
    appendBubble('Thinking...', 'ai', true);

    try {
        const response = await fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stepContext: currentStepContext,
                userQuestion: question,
                originalProblem: originalProblem
            })
        });

        document.querySelector('.thinking')?.remove();

        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        appendBubble(data.answer, 'ai');

    } catch (error) {
        console.error('Fetch error:', error);
        appendBubble('Sorry, there was an error connecting to the AI. Please try again.', 'ai');
    } finally {
        submitButton.disabled = false;
        userQuestionInput.focus();
    }
});

// --- Helper function to display chat messages ---
function appendBubble(text, type, isLoading = false) {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', type);
    if (isLoading) bubble.classList.add('thinking');
    bubble.textContent = text;
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}