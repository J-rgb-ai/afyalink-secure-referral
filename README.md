# AFYALINK - Secure e-Referral Health System

AfyaLink is a digital health referral platform enabling healthcare providers to securely refer patients between facilities while protecting patient privacy, data integrity, and confidentiality.

## Project Overview

This system streamlines the patient referral process, ensuring:
- Secure data transmission
- HIPAA-compliant patient handling
- Real-time tracking of referrals
- Simplified communication between healthcare providers

## Tech Stack

This project is built with:
- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Node.js, Express
- **Database**: SQLite (via better-sqlite3)

## Getting Started

### Prerequisites
- Node.js & npm installed

### Installation

1.  Clone the repository:
    ```bash
    git clone <YOUR_GIT_URL>
    cd afyalink-secure-referral
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the Development Server:
    This will start both the backend server (port 3000) and the frontend (port 8080).
    ```bash
    # Start Backend
    npm run server

    # Start Frontend (in a separate terminal)
    npm run dev
    ```

## deployment

Build the application for production:
```bash
npm run build
```
