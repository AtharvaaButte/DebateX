# Debate Platform Backend

Minimal, hackathon-friendly backend for the Debate Platform project.

## Tech Stack
* Node.js + Express
* Firebase Admin (Auth)
* Gemini API (AI opponent and evaluation)
* In-Memory State Mapping (Zero DB overhead for hackathons)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy the example `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Keys & Defaults**
   * Edit `.env` and paste your `GEMINI_API_KEY`.
   * Export your Firebase Admin credentials JSON file and save it in this directory as `serviceAccountKey.json` (or update the filename in `.env`).

4. **Run Server**
   ```bash
   node src/server.js
   ```

## Architecture Notes
* Firebase ID Tokens are strictly required for private endpoints via the `Authorization: Bearer <token>` header.
* In AI mode, Gemini's response turn happens asynchronously when the user submits their argument. The client simply polls `GET /debate/:roomId` to detect if the `currentTurn` has handed back to them and polls `/arguments` to pull the latest AI text.
