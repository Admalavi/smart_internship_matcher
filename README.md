# Smart Internship Opportunity Matcher
### A NoSQL-Based Personalized Internship Recommendation and Skill-Gap Analysis System

M.Tech NoSQL Database mini-project. MERN stack with **MongoDB as the only database**.

![Screenshot placeholder: landing page](docs/screenshots/landing.png)
![Screenshot placeholder: student dashboard](docs/screenshots/student-dashboard.png)
![Screenshot placeholder: internship compatibility](docs/screenshots/compatibility.png)
![Screenshot placeholder: application tracker](docs/screenshots/tracker.png)
![Screenshot placeholder: admin analytics](docs/screenshots/admin-analytics.png)

## 1. Problem statement
Students struggle to find internships that fit their skills, eligibility, interests, location and duration preferences. Portals offer keyword search and never explain *why* an internship suits a student or *what is missing*. This system stores profiles, internships, applications and recommendations as MongoDB documents, computes an explainable weighted compatibility score, detects skill gaps and proposes learning paths. See `docs/problem-statement.md`.

## 2. Objectives
Model nested, variable data with MongoDB; compute transparent compatibility scores; explain every recommendation; detect and classify skill gaps; support the full lifecycle (browse → apply → track → analytics) for students, companies and admins; demonstrate CRUD, query operators, aggregation, indexing and text search. See `docs/objectives.md`.

## 3. Features
| Role | Capabilities |
|---|---|
| Student | Profile with skills (proficiency), projects, certifications, preferences; recommendations with match %, explanation and eligibility; skill-gap analysis + learning paths; search/filter/sort; save; apply with eligibility validation; Kanban tracker; notifications and deadline alerts; resume text skill-detection |
| Company | Profile/logo; post internships with dynamic skill rows, eligibility, flexible custom attributes; edit/close/delete; view applicants ranked by match score; candidate details with compatibility; update status |
| Admin | Approve/reject postings; verify companies; manage users; delete content; analytics dashboard (8 charts) and skill analytics |

## 4. Technology stack
React 18, Vite, Tailwind CSS 3, React Router 6, Axios, Recharts, Framer Motion, React Hot Toast, React Icons · Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, Helmet, express-rate-limit · MongoDB / Atlas · Jest + Supertest.

## 5. System architecture
```
React (Vite)  ──Axios──▶  Express routes ─▶ controllers ─▶ services ─▶ Mongoose models ─▶ MongoDB
                              │                              ├ matchingService (pure functions)
                              │                              ├ recommendationService (cache in MongoDB)
                              │                              ├ skillGapService, analyticsService (aggregations)
                              │                              └ notificationService, activityService
                              └ middleware: auth (JWT), role guard, upload, errors
```
Details: `docs/system-architecture.md`.

## 6. Database architecture & MongoDB collections
`users`, `studentprofiles`, `companies`, `internships`, `applications`, `recommendations`, `savedinternships`, `notifications`, `skillcatalogs`, `learningresources`, `activityhistories`. Full field lists, relationships and embed-vs-reference decisions: `docs/database-design.md`.

> `studentId` fields in `applications`, `recommendations`, `savedinternships` reference **`users._id`** (not `studentprofiles._id`); `companyId` references `companies._id`.

## 7. NoSQL justification
1. Student profiles and internships are naturally nested (skills[], projects[], eligibility{}), so one read returns a complete aggregate with no joins.
2. Internships have heterogeneous attributes (`customFields`) - a flexible schema avoids sparse columns.
3. Recommendation results (arrays of matched/missing skills + explanation) are stored as documents and cached.
4. Analytics use the aggregation framework over the same documents.
5. Atlas gives horizontal scaling (sharding) and replication without schema migrations.
Trade-offs are discussed in `docs/nosql-concepts.md`.

## 8. Matching algorithm
```
overall = 0.40·skill + 0.15·eligibility + 0.15·domain + 0.10·location + 0.10·duration + 0.10·projects   (each 0..1)
NOT_ELIGIBLE  ⇒  overall = min(overall, 40)
```
* **Skill**: Σ(importance weight × credit) / Σ(importance weight). Importance High=3, Medium=2, Low=1. Credit: exact = 0.8/0.9/1.0 (Beginner/Intermediate/Advanced+Expert); related skill (e.g. Java→Spring Boot, JavaScript→React) = 0.5; missing = 0. Preferred skills blend in at 10%.
* **Eligibility**: CGPA, branch, graduation year, degree → ELIGIBLE (1.0), PARTIALLY_ELIGIBLE (0.7 if data missing, 0.5 if only CGPA is short by ≤0.5), NOT_ELIGIBLE (0).
* **Domain**: phrase containment = 1, else token overlap between student interests and internship domain/title/tags (with synonym expansion, e.g. MERN → full stack).
* **Location**: preferred city or accepted remote = 1.0; remote without stated preference = 0.6; mismatch = 0.1; no preference = 0.5.
* **Duration**: exact = 1, ±1 month = 0.75, ±2 = 0.5, otherwise 0.2.
* **Projects**: share of required skills covered by project technologies (related = 0.5).

Every recommendation carries a human-readable explanation. Full worked example: `docs/matching-algorithm.md`. The engine is rule-based, **not machine learning**; `MLRecommendationEngine` is an unimplemented extension point.

## 9. Skill-gap algorithm
`Required − Student = Gap`. Missing skills: High→**Critical**, Medium→**Moderate**, Low→**Minor**. Partially matched skills are listed one level less severe. Learning paths (steps, resources, estimated hours) are stored in `learningresources` and joined with `$lookup`.

## 10. API documentation
Summary below; complete reference in `docs/api-documentation.md`. All responses are `{ success, data, meta? }` or `{ success:false, message, details? }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| Student | `GET/PUT /api/students/profile` · `POST/DELETE /api/students/skills[/:id]` · `POST/DELETE /api/students/projects[/:id]` · `GET /api/students/dashboard` |
| Internships | `GET /api/internships` (search/filter/sort) · `GET /api/internships/:id` · `POST/PUT/DELETE` |
| Recommendations | `GET /api/recommendations` · `GET /api/recommendations/:internshipId` · `POST /api/recommendations/generate` |
| Skill gaps | `GET /api/skill-gaps` · `GET /api/skill-gaps/:internshipId` |
| Applications | `POST /api/applications` · `GET /api/applications[/:id]` · `PUT /api/applications/:id/status` |
| Saved | `POST/DELETE /api/saved/:internshipId` · `GET /api/saved` |
| Company | `GET /api/company/internships` · `GET /api/company/applications` (+ profile, dashboard, candidate) |
| Admin | `GET /api/admin/dashboard\|analytics\|users\|companies\|internships` (+ approval, verify, applications) |

## 11. Installation (Windows)
Prerequisites: Node.js 18+, MongoDB 6+ locally **or** a MongoDB Atlas cluster, Git.
```bash
git clone <your-repo-url> smart-internship-matcher
cd smart-internship-matcher

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

## 13. Database setup
* **Local**: install MongoDB Community Server, run `mongod`, use the default URI above.
* **Atlas**: create a free cluster, add a database user, allow your IP under *Network Access*, copy the SRV string into `MONGODB_URI` (add `/smart_internship_matcher` before `?`).
Indexes are created automatically at server start and by the seed script.

## 14. Seed instructions
```bash
cd backend
npm run seed
```
**Warning:** the seed script empties every collection in the target database. It creates 1 admin, 10 companies, 30 students (4 hand-written personas + 26 generated), ~52 internships across 13 domains (some pending approval, some expired), 95 catalog skills, 76 learning paths, applications in varied statuses, saved internships, notifications and stored recommendations.

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

## 16. Testing
```bash
cd backend
npm run test:unit   # 20 pure tests: matching, eligibility, location, duration, skill gaps
npm test            # + API/MongoDB integration tests (needs MONGODB_URI_TEST or downloads an in-memory mongod)
```
Manual checklist and demo script: `docs/testing.md`.

## 17. Project structure
```
smart-internship-matcher/
├── backend/   config/ controllers/ middleware/ models/ routes/ services/(engines/) utils/ seed/ validators/ tests/ uploads/ app.js server.js
├── frontend/  src/{components,pages(student|company|admin),layouts,services,hooks,context,utils,constants} App.jsx main.jsx
└── docs/      problem-statement, objectives, system-architecture, database-design, nosql-concepts,
               matching-algorithm, api-documentation, testing, future-scope, viva-questions
```

## 18. Future scope
Learned ranking model (see `MLRecommendationEngine`), embeddings for semantic skill matching, PDF/DOCX resume parsing, e-mail/push notifications, collaborative filtering from `activityhistories`, sharding by `studentId`. See `docs/future-scope.md`.

## 19. Limitations
* Rule-based scoring; the skill-relationship graph (`utils/skillUtils.js`) is hand-curated and incomplete.
* Resume parsing is keyword-based on plain text only.
* JWT is stored in `localStorage` (simple, but exposed to XSS); there are no refresh tokens or e-mail verification.
* Any internship change marks cached recommendations stale for all students, so the next view re-scores everything for that student (O(internships) per student); fine for a mini-project, not for millions of documents.
* Notifications are in-app only and polled every 60 s.
* Integration tests require a MongoDB instance; the author's environment could only run the pure unit tests.
