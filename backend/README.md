# Smart Internship Matcher - Backend (Part 1)

Node.js + Express + Mongoose API. MongoDB is the only database.

## Run (Windows)
```bash
cd backend
npm install
copy .env.example .env      # then edit MONGODB_URI and JWT_SECRET
npm run seed                # WARNING: clears the target database, loads demo data
npm run dev                 # http://localhost:5000/api/health
```

## Tests
```bash
npm run test:unit   # pure matching / skill-gap tests (no DB needed) - 20 tests
npm test            # + API/MongoDB integration tests (needs MONGODB_URI_TEST or downloads an in-memory mongod)
```

## Demo credentials (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Student (Java + Spring + MongoDB) | student@example.com | Student@123 |
| Student (React + Node + MongoDB) | student2@example.com | Student@123 |
| Student (Python + ML + Pandas) | student3@example.com | Student@123 |
| Student (UI/UX + Figma) | student4@example.com | Student@123 |
| Company (ABC Technologies) | company@example.com (company2..10 also exist) | Company@123 |
| Admin | admin@example.com | Admin@123 |

## Scoring
overall = 0.40 skill + 0.15 eligibility + 0.15 domain + 0.10 location + 0.10 duration + 0.10 projects
(each component 0-1; NOT_ELIGIBLE caps the overall score at 40). See `services/matchingService.js`.
