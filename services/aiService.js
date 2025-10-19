import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to call the AI and parse its JSON response safely.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to call the AI with retries and exponential backoff
async function callAI(prompt) {
    let retries = 3;  
    let delay = 1000;  

    for (let i = 0; i < retries; i++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
            let cleaned = rawText.trim().replace(/^```json\n?/, "").replace(/```$/, "");
            return JSON.parse(cleaned);  

        } catch (error) {
            // Check if the error is the specific 503 overload error
            if (error.status === 503 && i < retries - 1) {
                console.log(`Model overloaded. Retrying in ${delay / 1000}s... (Attempt ${i + 1})`);
                await sleep(delay);
                delay *= 2; 
            } else {
                console.error("AI call failed after multiple retries or for a non-retryable reason:", error);
                throw new Error("Failed to get a valid response from the AI after multiple attempts.");
            }
        }
    }
}

/**
 * Calls Gemini in a two-step process to get a complete complaint package.
 */
export async function classifyAndGenerate(problemDescription) {
    // --- STEP 1: ANALYSIS ---
    // This prompt now asks for a unique portal_id.
    const analysisPrompt = `
        You are an expert complaint analyst. Analyze the user's problem to determine the correct category and the official government portal for filing this complaint.
        
        Provide a short, unique, hyphen-separated identifier for the portal (e.g., "national-consumer-helpline", "pg-portal-gov-in").

        Classify the complaint into one of these categories:
        Corruption, Civic Issue, Police Misconduct, RTI Issue, Consumer Complaint, Cybercrime, Financial Issue, Housing/Land Grabbing, General Issue.

        Return valid JSON ONLY in the following format:
        {
            "category": "The most appropriate category",
            "portal": "The official URL of the complaint portal",
            "portal_id": "A unique identifier for the portal (e.g., national-consumer-helpline)",
            "summary": "A brief, one-sentence summary of the user's core problem."
        }

        User's Problem: "${problemDescription}"
    `;

    console.log("--- Sending Analysis Prompt to AI ---");
    const analysisResult = await callAI(analysisPrompt);
    console.log("--- Received Analysis Result:", analysisResult);

    // --- STEP 2: GENERATION ---
    // This prompt now asks for a structured guide with image names.
    const generationPrompt = `
        You are an expert assistant for writing formal complaints. Your task is to generate a complete complaint package.

        The complaint has been analyzed:
        - Category: "${analysisResult.category}"
        - It should be filed on this portal: "${analysisResult.portal}"
        - The unique portal ID is: "${analysisResult.portal_id}"

        Based on the original problem description, perform the following actions:
        1. Draft a formal, well-structured complaint letter.
        2. List the specific documents the user will likely need.
        3. Provide a clear, step-by-step guide for filing on the "${analysisResult.portal}" website. Each step must have a unique number.

        Return valid JSON ONLY in the following format:
        {
            "complaintDraft": "The full text of the formal complaint letter.",
            "documents": "A well-formatted checklist of necessary documents, grouped into logical categories like 'Core Evidence', 'Personal Identification', and 'Supporting Evidence' using markdown-style headings and bullet points.",
            "guide": [
                {
                    "step_number": 1,
                    "instruction": "Detailed instruction for this step.",
                     
                },
                {
                    "step_number": 2,
                    "instruction": "Detailed instruction for the next step.",
                    
                }
            ]
        }

        Original User Problem: "${problemDescription}"
    `;

    console.log("--- Sending Generation Prompt to AI ---");
    const generationResult = await callAI(generationPrompt);
    console.log("--- Received Generation Result ---");

    // --- FINAL STEP: COMBINE AND RETURN ---
    // Combine results, ensuring portal_id is included for the next steps.
    return {
        category: analysisResult.category,
        portal: analysisResult.portal,
        portal_id: analysisResult.portal_id,
        complaintDraft: generationResult.complaintDraft,
        documents: generationResult.documents,
        guide: generationResult.guide,
    };
}

/**
 * Refines an existing complaint draft based on user instructions.
 */
export async function refineComplaint(originalProblem, originalDraft, instruction) {
    const prompt = `
        You are an expert writing assistant. Your task is to revise a complaint draft based on a user's instruction.

        Full context of the original problem:
        "${originalProblem}"

        Here is the current draft that needs to be revised:
        --- DRAFT START ---
        ${originalDraft}
        --- DRAFT END ---

        Here is the user's instruction for how to change the draft:
        "${instruction}"

        Revise the draft according to the instruction. Return ONLY the full, new, revised complaint text in a valid JSON object.

        Return valid JSON ONLY in the following format:
        {
            "newDraft": "The complete and revised complaint text."
        }
    `;

    console.log("--- Sending Refinement Prompt to AI ---");
    const response = await callAI(prompt);
    console.log("--- Received Refined Draft ---");
    
    return response.newDraft;
}

/**
 * Answers a user's question about a specific step in the guide.
 */
export async function getClarification(stepContext, userQuestion, originalProblem) {
    // THIS IS THE NEW, MORE CONTEXT-AWARE PROMPT
    const prompt = `
        You are a helpful AI assistant. A user is filling out a complaint and has a question.
        Your primary goal is to provide a helpful, specific answer by using the full context of their original problem.

        --- FULL COMPLAINT CONTEXT ---
        "${originalProblem}"
        ---------------------------------

        The user is currently on a specific step in the filing guide with the following instruction:
        --- CURRENT STEP INSTRUCTION ---
        "${stepContext}"
        ---------------------------------

        Now, answer the user's question based on ALL of the information above. If their question is general (e.g., "what should I do next?"), you can ignore the step context. If it's specific, relate your answer back to their original problem.

        USER'S QUESTION: "${userQuestion}"
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request. Please try rephrasing your question.";
}

/**
 * Generates a follow-up letter based on an original complaint.
 */
export async function generateFollowUp(originalComplaint) {
    // Calculate the number of days since the complaint was created
    const filedDate = new Date(originalComplaint.createdAt);
    const today = new Date();
    const daysSinceFiling = Math.round((today - filedDate) / (1000 * 60 * 60 * 24));

    const prompt = `
        You are an expert assistant for writing official correspondence. A user needs to follow up on a complaint they filed previously.

        Here is the full text of their original complaint:
        --- ORIGINAL COMPLAINT ---
        ${originalComplaint.complaintDraft}
        --------------------------

        The complaint was filed on ${filedDate.toLocaleDateString('en-IN')} (approximately ${daysSinceFiling} days ago).

        Your task is to draft a polite but firm follow-up letter. The letter should:
        1.  Briefly reference the original complaint's subject and filing date.
        2.  State that a response has not yet been received.
        3.  Politely request a status update on the investigation or action taken.
        4.  Maintain a formal and respectful tone.

        Return valid JSON ONLY in the following format:
        {
            "followUpDraft": "The full text of the formal follow-up letter."
        }
    `;

    console.log("--- Sending Follow-Up Generation Prompt to AI ---");
    return await callAI(prompt);
}