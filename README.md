# AnyComplaint 🤖📄

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent web application that helps users draft formal complaints, identifies the correct submission portal, provides filing guidance, and assists with follow-ups using AI. Built with Node.js, Express, EJS, MongoDB, and the Google Gemini API.



---
## ✨ Key Features

* **AI-Powered Complaint Drafting:** Automatically generates a formal complaint letter based on the user's problem description.
* **Intelligent Classification:** Categorizes the complaint (e.g., Consumer, Civic, Cybercrime) and identifies the appropriate government/consumer portal.
* **Interactive Filing Guide:** Provides step-by-step instructions with portal-specific screenshots (manually curated) for submitting the complaint.
* **Context-Aware AI Assistant:** Users can ask questions about specific steps in the guide, and the AI provides answers based on both the step and the original complaint context.
* **Draft Refinement:** Allows users to iteratively refine the AI-generated draft by providing instructions.
* **User Accounts & Dashboard:** Securely saves users' complaints, allowing them to track status and manage their filings.
* **Status Tracking:** Users can manually update the status of their complaints (Draft, Filed, Resolved, etc.).
* **AI Follow-Up Generation:** Creates follow-up letters for complaints awaiting response.
* **Smart Email Reminders:** Automatically emails users to follow up on complaints filed more than 14 days ago.
* **Modern & Responsive UI:** Dark-themed interface built with Bootstrap, ensuring usability across devices.
* **Flash Notifications:** Provides user feedback via pop-up toast messages for actions like login, logout, and status updates.

---
## 🛠️ Technologies Used

* **Backend:** Node.js, Express.js
* **Frontend:** EJS (Embedded JavaScript templates), HTML, CSS, JavaScript
* **Database:** MongoDB with Mongoose
* **AI:** Google Gemini API (`@google/genai`)
* **Authentication:** `express-session`, `connect-mongo`, `bcryptjs`
* **Email:** `nodemailer`
* **Scheduling:** `node-cron`
* **UI Framework:** Bootstrap 5

---
## 🚀 Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    * Create a `.env` file in the root directory.
    * Copy the contents of `example.env` into `.env`.
    * Fill in your specific values for each variable (API keys, database URI, etc.). See `example.env` for details.


---
## ⚙️ Environment Variables (`.env`)

You need to create a `.env` file in the project root and add the following variables:

```env
# Google Gemini API Key (from Google AI Studio)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Server Port
PORT=8080

# MongoDB Connection String (from MongoDB Atlas or local instance)
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING

# Session Secret (a long, random string)
SESSION_SECRET=REPLACE_WITH_A_STRONG_RANDOM_SECRET

# Email Configuration (using Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=YOUR_GMAIL_ADDRESS@gmail.com
EMAIL_PASS=YOUR_16_DIGIT_GMAIL_APP_PASSWORD_NO_SPACES

# Node Environment ('development' or 'production')
NODE_ENV=development

---
## Run Application
    ```bash
    node app.js
    ```

