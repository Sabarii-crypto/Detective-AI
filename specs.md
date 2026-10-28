# AI Mystery Room — Software Specification Sheet

**Version:** 1.1 — MVP Edition  
**Project Type:** AI-powered mystery investigation web application  
**Technology Stack:** MERN + Google Gemini API

---

## 1. Project Overview

### 1.1 Project Description

AI Mystery Room is an AI-powered web application where users solve fictional mysteries generated using Google's Gemini AI.

Players investigate a case, examine clues, question suspects, request hints and identify the culprit based on the evidence they discover.

Each mystery should have a consistent story, a defined culprit, believable suspects, clues and a logical solution.

### 1.2 Project Objective

The primary objective is to build an interactive mystery-solving experience that combines AI-generated storytelling with investigation and logical reasoning.

The application should allow a player to:

1. Generate a new mystery.
2. Read the case description.
3. Explore suspects and clues.
4. Question suspects about the case.
5. Request hints when necessary.
6. Accuse a suspect.
7. View the result and the complete explanation.

### 1.3 Target Users

- People who enjoy detective stories and mystery games.
- Users interested in interactive AI experiences.
- Casual players who enjoy solving puzzles and investigating fictional cases.

---

## 2. Project Scope

### 2.1 Minimum Viable Product (MVP)

The first version will focus on a single-player experience.

The MVP must include:

- A simple and responsive home page.
- AI-generated mysteries using Gemini.
- A case description and list of suspects.
- A basic clue-discovery system.
- Suspect interrogation through a chat interface.
- A limited hint system.
- A suspect accusation system.
- A verdict and solution-reveal screen.

The application should be usable from beginning to end without requiring user registration.

### 2.2 Features Excluded from the MVP

The following features will be considered for future versions:

- User registration and login.
- Saving and resuming games across sessions.
- Complex drag-and-drop evidence board.
- Multiplayer investigations.
- Leaderboards and achievements.
- Voice-based interrogation.
- Advanced AI-powered scoring and analytics.
- Subscription and payment systems.

These features must not delay completion of the core gameplay experience.

---

## 3. Technology Stack

### 3.1 Frontend

- **React.js** — Build the user interface.
- **Vite** — Development server and build tool.
- **TypeScript** — Improve code reliability.
- **Tailwind CSS** — Style the application.
- **React Router** — Navigate between pages.
- **Fetch API or Axios** — Communicate with the backend.

The frontend should have a modern detective-themed design with readable typography, clear navigation and responsive layouts.

### 3.2 Backend

- **Node.js** — JavaScript runtime.
- **Express.js** — Backend API framework.
- **TypeScript** — Type safety for backend code.
- **Google Gemini API** — Generate mysteries and support suspect conversations.

The backend will manage the game state, validate AI-generated content, control hints and determine whether an accusation is correct.

### 3.3 Database

- **MongoDB Atlas** — Cloud database.
- **Mongoose** — MongoDB object modelling.

For the initial version, MongoDB can store generated mysteries and related game data. Persistent storage of individual games is optional until saved games are implemented.

### 3.4 AI Integration

Use the official Google Gen AI SDK compatible with the selected Gemini model.

All Gemini requests must be made through the backend. The Gemini API key must never be exposed in frontend code.

---

## 4. Core Functional Requirements

### FR-01: Home Page

The home page should display:

- Application name and short description.
- A **Start New Mystery** button.
- A brief explanation of how to play.
- A detective or mystery-themed visual design.

Clicking Start New Mystery should begin generating a new case.

### FR-02: Mystery Generation

The backend should request a mystery from Gemini.

Each generated mystery should contain:

- A unique case title.
- A short introduction.
- A crime or mystery description.
- A list of 3–5 suspects.
- A list of approximately 5–8 clues.
- Suspect backgrounds and possible motives.
- A timeline of relevant events.
- A definite culprit.
- A logical explanation of the crime.
- A solution that can be revealed at the end.

The generation prompt should instruct Gemini to create a solvable mystery with consistent facts and no contradictory clues.

The backend must validate the generated response before making it available to the player.

If generation fails or produces invalid data, the backend should retry a limited number of times or return a clear error message.

### FR-03: Case Investigation Page

The investigation page should display:

- Case title and description.
- Current investigation status.
- Suspect list.
- Available clues.
- Buttons for interrogating suspects.
- A button for requesting a hint.
- A button for making an accusation.

Use a simple tab or section layout to organize suspects and clues. A complicated evidence board is not required.

### FR-04: Suspect Profiles

Each suspect should have:

- Name.
- Short background.
- Relationship to the case.
- Possible motive.
- Initial statement.

The application should display relevant information without revealing the culprit immediately.

### FR-05: Clue Discovery

Players should be able to discover and inspect clues.

Each clue should contain:

- Clue title.
- Description.
- Where or how it was discovered.
- Its relevance to the case.

The interface should distinguish discovered clues from undiscovered clues.

The initial implementation may show clues through a simple list of investigation actions rather than a complex exploration map.

Clues must be consistent with the mystery's original solution.

### FR-06: Suspect Interrogation

Players should be able to select a suspect and ask questions through a chat interface.

The backend should send the relevant mystery context and the selected suspect's information to Gemini.

The AI response must:

- Stay in character.
- Answer questions relevant to the case.
- Avoid revealing the complete solution prematurely.
- Remain consistent with established evidence and the suspect's knowledge.
- Avoid inventing facts that change the underlying solution.

The backend must maintain the authoritative mystery facts. Suspect dialogue must not be allowed to rewrite the culprit, timeline or established clues.

### FR-07: Hint System

Players should be able to request hints if they get stuck.

Implement three levels of hints:

1. **Level 1:** A general direction for investigation.
2. **Level 2:** A hint connecting relevant clues.
3. **Level 3:** A strong hint pointing toward the decisive evidence.

Hints should be revealed progressively.

The application should track the number of hints used during the current game. A simple hint penalty may be included in the final score.

Hints must not directly reveal the complete solution unless the player chooses to reveal it.

### FR-08: Accusation System

Players should select one suspect as the alleged culprit and submit their accusation.

Before submitting, the interface should ask the player to confirm the selection.

The backend should compare the accusation with the stored correct culprit.

The application should then display one of two outcomes:

- **Correct accusation:** The player identified the culprit.
- **Incorrect accusation:** The player selected the wrong suspect.

The accusation result must be determined by the backend, not by trusting a frontend value or an unrestricted AI response.

For the MVP, allow one final accusation per game.

### FR-09: Verdict and Solution Reveal

After the accusation, display:

- The result of the investigation.
- The actual culprit.
- The explanation of how the mystery occurred.
- The motive and opportunity.
- The decisive clues.
- An explanation of how the evidence connects.
- A simple performance summary.

Include a **Play Another Mystery** button to start a fresh case.

### FR-10: Basic Scoring

Use a simple, transparent scoring system.

Example:

- Correct accusation: 100 points.
- Each hint used: subtract 10 points.
- Incorrect accusation: 0 points for the current attempt.

The final score cannot be lower than zero.

Scoring should be calculated by the backend. Advanced scoring based on investigation efficiency can be added in a later version.

---

## 5. Non-Functional Requirements

### 5.1 Usability

- The application should be easy to understand for first-time users.
- Important actions must be clearly labelled.
- Loading indicators should appear while a mystery or response is being generated.
- Errors should be displayed in understandable language.
- The interface should work on desktop and mobile screens.

### 5.2 Performance

- Avoid unnecessary Gemini API calls.
- Set request timeouts and reasonable retry limits.
- Validate AI responses before using them.
- Show loading states during long-running requests.

### 5.3 Security

- Store the Gemini API key in backend environment variables.
- Never expose API secrets to the browser.
- Validate incoming request data.
- Apply request-size limits and basic rate limiting.
- Restrict allowed frontend origins through CORS configuration.
- Never trust the frontend to determine the correct culprit or score.
- Avoid returning the hidden solution before the game ends.

### 5.4 Reliability

- Handle Gemini API errors gracefully.
- Handle invalid or incomplete generated mysteries.
- Prevent a failed request from corrupting the current game.
- Keep the mystery's correct solution fixed throughout a game session.

---

## 6. System Architecture

The application will follow a basic client-server architecture.

**Frontend → Express API → Game Logic → Gemini API / MongoDB**

### Frontend Responsibilities

- Render pages and components.
- Display the current case.
- Manage the visible game interface.
- Send investigation actions to the backend.
- Display clues, dialogue, hints and results.

### Backend Responsibilities

- Generate and validate mysteries.
- Manage the authoritative game state.
- Handle suspect interrogation.
- Track clues and hints.
- Validate accusations.
- Calculate scores.
- Control access to the hidden solution.
- Communicate with Gemini and MongoDB.

### Gemini Responsibilities

- Generate mystery content.
- Generate suspect dialogue based on supplied context.
- Assist with contextual hints where appropriate.

Gemini must not be the final authority for the correct answer. The backend should store and enforce the solution.

---

## 7. Suggested Database Structure

Use MongoDB with Mongoose.

### 7.1 Mystery Model

Suggested fields:

- `title`
- `description`
- `suspects`
- `clues`
- `timeline`
- `culpritId`
- `solution`
- `createdAt`

The `culpritId` and complete solution must remain hidden from the player until the game ends.

### 7.2 Game Model

Suggested fields:

- `mysteryId`
- `discoveredClueIds`
- `interrogationHistory`
- `hintsUsed`
- `status`
- `accusedSuspectId`
- `score`
- `startedAt`
- `completedAt`

For the MVP, game state may initially be held in backend memory or a temporary session. If in-memory storage is used, games may be lost when the server restarts. MongoDB-backed game persistence should be added before implementing reliable saved games.

### 7.3 Suspect Structure

Each suspect should include:

- `id`
- `name`
- `background`
- `motive`
- `initialStatement`
- `alibi`
- `knowledge`

### 7.4 Clue Structure

Each clue should include:

- `id`
- `title`
- `description`
- `location`
- `relevance`
- `isDiscoverable`

Use a consistent TypeScript schema and validate AI-generated objects before saving or using them.

---

## 8. API Endpoints

Use REST APIs with JSON request and response bodies.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/mysteries/generate` | Generate a new mystery |
| GET | `/api/games/:gameId` | Retrieve current game state |
| GET | `/api/games/:gameId/suspects` | Retrieve available suspect information |
| POST | `/api/games/:gameId/clues/:clueId/discover` | Discover a clue |
| POST | `/api/games/:gameId/interrogate` | Question a suspect |
| POST | `/api/games/:gameId/hint` | Request the next hint |
| POST | `/api/games/:gameId/accuse` | Submit an accusation |
| GET | `/api/games/:gameId/result` | Retrieve results after completion |

These endpoints are a starting contract. Adjust them as implementation details become clearer, while preserving the same functionality.

All endpoints must validate the game ID, request body and current game status.

The result endpoint must not reveal the solution while the game is still active.

---

## 9. User Interface Pages

### Page 1: Home

Contains the application introduction and Start New Mystery button.

### Page 2: Mystery Loading

Displays a loading indicator and a message while Gemini generates the case.

### Page 3: Investigation

Contains the case description, suspects, clue list, interrogation interface, hint button and accusation action.

### Page 4: Results

Displays the verdict, culprit, solution explanation, score and Play Another Mystery button.

These four views are sufficient for the initial version. Login, profile, dashboard and saved-game pages are not required.

---

## 10. Suggested Project Structure

```text
ai-mystery-room/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── hooks/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── types/
│   │   └── server.ts
│   └── package.json
│
├── .gitignore
├── README.md
└── SPEC.md
```

Keep the project structure simple. Create additional folders only when they are useful.

---

## 11. Development Roadmap

Build the application in small, testable stages.

### Phase 1 — Basic Application

- Set up the React frontend with Vite and TypeScript.
- Set up the Express backend with TypeScript.
- Connect the frontend to the backend.
- Create the home page and basic investigation layout.
- Add a health-check endpoint.

**Completion goal:** The frontend and backend run locally and communicate successfully.

### Phase 2 — Mystery Generation

- Configure the Gemini API securely.
- Create the mystery-generation prompt.
- Define the TypeScript mystery schema.
- Validate generated mysteries.
- Display the generated case, suspects and clues.

**Completion goal:** A user can generate and view a valid mystery.

### Phase 3 — Investigation Gameplay

- Implement game state management.
- Display suspect profiles.
- Implement clue discovery.
- Track discovered clues.
- Add the interrogation interface.

**Completion goal:** A user can investigate a case and discover clues.

### Phase 4 — AI Interactions

- Implement suspect questioning.
- Keep dialogue consistent with the fixed mystery.
- Add progressive hints.
- Handle API failures and loading states.

**Completion goal:** A user can question suspects and request hints without changing the underlying solution.

### Phase 5 — Accusation and Results

- Implement suspect selection.
- Validate the final accusation on the backend.
- Calculate the score.
- Reveal the culprit and explanation.
- Add the Play Another Mystery action.

**Completion goal:** A complete mystery can be played from beginning to end.

### Phase 6 — Testing and Deployment

- Test mystery generation and validation.
- Test clue discovery and hint progression.
- Test correct and incorrect accusations.
- Test error handling and API-key security.
- Deploy the frontend and backend.
- Configure environment variables and MongoDB Atlas.

**Completion goal:** The MVP is deployed and playable.

### Phase 7 — Future Improvements

Only after the core application works:

- User authentication.
- Persistent game saving and resuming.
- Evidence board.
- Investigation history.
- Advanced scoring.
- Achievements and leaderboards.
- Multiplayer gameplay.
- Additional mystery categories and difficulty levels.

---

## 12. Testing Requirements

Test the following scenarios:

1. A mystery is generated successfully.
2. Invalid AI-generated content is rejected.
3. A player can view suspects and clues.
4. Discovering a clue updates the game state.
5. Interrogation responses remain consistent with the case.
6. Hints are revealed in the correct order.
7. Hint usage is tracked correctly.
8. A correct accusation produces a successful result.
9. An incorrect accusation produces the appropriate result.
10. The hidden solution cannot be retrieved before the game ends.
11. Gemini API failures produce a useful error message.
12. Starting another mystery does not reuse the previous game's state.

Automated tests should cover important backend logic, particularly solution protection, hint limits, scoring and accusation validation.

---

## 13. Definition of Done

The MVP is complete when:

- The application runs locally and can be deployed.
- A user can generate a mystery using Gemini.
- The mystery contains consistent suspects, clues and a fixed solution.
- The user can investigate clues and question suspects.
- The user can request hints.
- The user can submit an accusation.
- The backend correctly determines the outcome.
- The solution is revealed after the game ends.
- The user can start another mystery.
- Important errors are handled gracefully.
- API keys and the hidden solution are protected from the frontend.

---

## 14. Key Implementation Principles

1. **Build the core game first.** Do not start with authentication, multiplayer or advanced features.
2. **Keep the AI output structured.** Use schemas and validation rather than relying on free-form text alone.
3. **Keep the truth on the backend.** The culprit, timeline and decisive evidence must remain fixed.
4. **Use simple UI components.** A clue list and suspect cards are enough for the first version.
5. **Test every phase before moving forward.** Avoid building all features at once.
6. **Keep the project maintainable.** Separate API routes, business logic, database models and UI components.
7. **Add complexity only when needed.** Future features should extend a working MVP rather than delay it.

---

## Final Project Goal

Deliver a working, single-player AI mystery game built with React, Node.js, Express, MongoDB and Gemini.

A player must be able to start a new case, inspect clues, interrogate suspects, request hints, make an accusation and discover the complete solution.

**The priority is a complete and reliable mystery-solving experience—not the largest possible feature set.**