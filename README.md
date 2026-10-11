# Smart Internship Opportunity Matcher
### A NoSQL-Based Personalized Internship Recommendation and Skill-Gap Analysis System

## 1. Problem statement
Students struggle to find internships that fit their skills, eligibility, interests, location and duration preferences. Portals offer keyword search and never explain *why* an internship suits a student or *what is missing*. This system stores profiles, internships, applications and recommendations as MongoDB documents, computes an explainable weighted compatibility score, detects skill gaps and proposes learning paths. See `docs/problem-statement.md`.

## 2. Objectives
Model nested, variable data with MongoDB; compute transparent compatibility scores; explain every recommendation; detect and classify skill gaps; support the full lifecycle (browse → apply → track → analytics) for students, companies and admins; demonstrate CRUD, query operators, aggregation, indexing and text search. See `docs/objectives.md`.

## 4. Technology stack
React 18, Vite, Tailwind CSS 3, React Router 6, Axios, Recharts, Framer Motion, React Hot Toast, React Icons · Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, Helmet, express-rate-limit · MongoDB / Atlas · Jest + Supertest.

cd backend
npm install
copy .env.example .env
:: edit .env (MONGODB_URI, JWT_SECRET)
npm run seed
npm run dev

:: new terminal
cd frontend
npm install
copy .env.example .env
npm run dev
```
Frontend: http://localhost:5173 · API: http://localhost:5000/api/health

## 12. Environment variables
`backend/.env`
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_internship_matcher
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
RECOMMENDATION_ENGINE=rule-based
MONGODB_URI_TEST=            # optional, for npm test
```
`frontend/.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_FILES_URL=http://localhost:5000
```
No secrets are in source control (`.env` is git-ignored).

## 15. Demo credentials
| Role | Email | Password | Persona |
|---|---|---|---|
| Student | student@example.com | Student@123 | Java + Spring Boot + MongoDB |
| Student | student2@example.com | Student@123 | React + Node + MongoDB (MERN) |
| Student | student3@example.com | Student@123 | Python + ML + Pandas |
| Student | student4@example.com | Student@123 | UI/UX + Figma |
| Student | student5..student30@example.com | Student@123 | generated |
| Company | company@example.com (ABC Technologies), company2..company10@example.com | Company@123 | |
| Admin | admin@example.com | Admin@123 | |

## 18. Future scope
Learned ranking model (see `MLRecommendationEngine`), embeddings for semantic skill matching, PDF/DOCX resume parsing, e-mail/push notifications, collaborative filtering from `activityhistories`, sharding by `studentId`. See `docs/future-scope.md`.

## 19. Limitations
* Rule-based scoring; the skill-relationship graph (`utils/skillUtils.js`) is hand-curated and incomplete.
* Resume parsing is keyword-based on plain text only.
* JWT is stored in `localStorage` (simple, but exposed to XSS); there are no refresh tokens or e-mail verification.
* Any internship change marks cached recommendations stale for all students, so the next view re-scores everything for that student (O(internships) per student); fine for a mini-project, not for millions of documents.
* Notifications are in-app only and polled every 60 s.
* Integration tests require a MongoDB instance; the author's environment could only run the pure unit tests.
