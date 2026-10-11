# System Architecture

## Layers
```
Browser (React SPA)
   │  Axios (Bearer JWT)
   ▼
Express app (app.js): helmet · cors · json · rate-limit · morgan
   │
Routes (routes/index.js) ── middleware: protect / optionalAuth / authorize(role) / multer
   │
Controllers  (HTTP concerns only: parse, validate, shape response)
   │
Services     (business logic - no Express objects)
   ├ matchingService.js        pure functions: skills, eligibility, domain, location, duration, projects, explanation
   ├ engines/                  RecommendationEngine (abstract) → WeightedRuleBasedEngine | MLRecommendationEngine (placeholder)
   ├ recommendationService.js  generate, cache, staleness check, bulk upsert
   ├ skillGapService.js        gap classification + aggregation with $lookup to learning paths
   ├ analyticsService.js       all aggregation pipelines
   ├ notificationService.js    idempotent notifications + dynamic deadline alerts
   └ activityService.js        fire-and-forget activity log
   │
Mongoose models → MongoDB (Atlas compatible)
```

## Request example: opening the recommendations page
1. `GET /api/recommendations` → `protect` + `authorize('student')`.
2. Controller checks the profile has ≥3 skills.
3. `recommendationService.getForStudent` → `ensureFresh`: compares `profile.updatedAt` and the newest `internship.updatedAt` with the newest `recommendations.generatedAt`.
4. If stale (or none) → score all open internships with the engine, `bulkWrite` upserts into `recommendations`, delete recommendations of closed internships, create notifications for new ≥85% eligible matches, log activity.
5. Read cached recommendations sorted by `overallScore`, populate internship and company, return with explanation.

## Cache invalidation (recommendation caching)
| Event | Effect |
|---|---|
| Profile saved (skills, education, preferences, projects) | `updatedAt` changes → next read regenerates |
| Internship created/edited | its `updatedAt` is newer → next read regenerates |
| Admin approves internship | internship scored for all students immediately (`scoreInternshipForAllStudents`) |
| `POST /recommendations/generate` or `?refresh=true` | forced regeneration |
| Deadline passes | server closes expired internships hourly with `timestamps:false` (does not invalidate caches); reads also filter expired ones |

## Roles and authorization
`student`, `company`, `admin` are enforced by `authorize(...)`. Ownership checks (company owns the internship/application, student owns the application) are in controllers.

## Frontend structure
`AuthContext` (token + user), `ProtectedRoute` (role gate), `useFetch` (loading/error/reload), shared UI kit (`components/ui.jsx`), match visualisations (`components/match.jsx`), `InternshipCard`, three layouts (public, dashboard, adaptive for pages shared by guests and users).

## Error handling
Central `errorHandler` maps Mongoose `ValidationError`, `CastError`, duplicate key (11000 → 409), Multer errors and `ApiError`. Frontend shows `message` via toasts or inline error states; 401 clears the session and redirects to login.

## Deployment notes
Single Node process + MongoDB Atlas. Set `CLIENT_URL` to the deployed frontend origin; build the frontend with `npm run build` and host `dist/` statically; uploaded files live in `backend/uploads` (use object storage for production).
