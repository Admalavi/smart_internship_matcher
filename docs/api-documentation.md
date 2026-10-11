# API Documentation

Base URL `http://localhost:5000/api` · JSON · auth header `Authorization: Bearer <token>`.
Success: `{ "success": true, "data": ..., "meta": ... }` · Error: `{ "success": false, "message": "...", "details": ... }`.
Status codes: 200/201 OK · 400 validation · 401 not logged in/invalid token · 403 forbidden/ineligible · 404 · 409 duplicate · 429 rate-limited · 500.

**Access legend:** 🌐 public · 🔓 optional login · 🎓 student · 🏢 company · 🛡 admin · 🔑 any logged-in user

## Auth
| Method | Path | Access | Body / notes |
|---|---|---|---|
| POST | /auth/register | 🌐 | `{name,email,password,role:"student"|"company",companyName?}` - password ≥8 chars with letters+digits; returns `{user,token}` |
| POST | /auth/login | 🌐 | `{email,password}` → `{user,token}`; 401 on bad credentials; 403 if deactivated |
| POST | /auth/logout | 🔑 | stateless; client discards token |
| GET | /auth/me | 🔑 | user + student profile or company |

## Student 🎓
| Method | Path | Notes |
|---|---|---|
| GET | /students/profile | profile + `completionDetails {score, missing[]}` |
| PUT | /students/profile | `{name?,phone?,education?,preferences?,interests?}` |
| GET | /students/dashboard | readiness, top recommendations, skill strength, top gaps, stats, deadline alerts |
| GET | /students/activity | last 50 activity records |
| POST | /students/skills | `{name,category?,proficiency?,yearsOfExperience?}` (409 if duplicate) |
| DELETE | /students/skills/:id | |
| POST | /students/projects | `{title,description?,technologies[]|csv,role?,githubUrl?}` |
| DELETE | /students/projects/:id | |
| POST / DELETE | /students/certifications[/:id] | `{name,issuer?,issueDate?,credentialUrl?}` |
| POST | /students/resume | multipart field `resume` (pdf/doc/docx/txt, ≤2 MB) |
| POST | /students/resume/parse | `{text, apply?}` or `.txt` file → detected skills, CGPA, year; `apply:true` merges into profile |

## Internships
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /internships | 🔓 | query: `q` (text search with regex fallback), `domain`, `location`, `workMode`, `skills` (comma lists), `minStipend`, `maxDuration`, `duration`, `sort` = `match|newest|deadline|stipend|relevance`, `excludeApplied`, `page`, `limit`. Students get `matchScore`, `eligibilityStatus`, `skillStatuses`, `saved`, `applied`. `meta.searchMode` = `text-index` or `regex-fallback`. Admin may also pass `status`, `approvalStatus`. |
| GET | /internships/facets | 🌐 | distinct domains, locations, work modes of open internships |
| GET | /internships/:id | 🔓 | students also get `compatibility` (live score, explanation, eligibility checks, gap with learning paths), `saved`, `application` |
| POST | /internships | 🏢 | creates with `approvalStatus:"pending"`; notifies admins |
| PUT | /internships/:id | 🏢 owner / 🛡 | partial update; `status: active|closed` |
| DELETE | /internships/:id | 🏢 owner / 🛡 | deletes + removes recommendations and saved entries |

Create body example:
```json
{ "title":"Java Full Stack Developer Intern","description":"...","domain":"Java Development",
  "requiredSkills":[{"name":"Java","importance":"High"},{"name":"React","importance":"High"}],
  "preferredSkills":["Docker"],"eligibility":{"minCGPA":7,"branches":["Computer Science"],"graduationYears":[2026],"requiredDegree":"Any"},
  "location":"Pune","workMode":"Hybrid","duration":6,"stipend":{"min":10000,"max":15000,"currency":"INR"},
  "applicationDeadline":"2026-12-01","tags":["java"],"customFields":{"portfolioRequired":false} }
```

## Recommendations & skill gaps 🎓
| Method | Path | Notes |
|---|---|---|
| GET | /recommendations | `minScore`, `limit`, `refresh=true`; returns `[]` + `meta.reason:"INSUFFICIENT_PROFILE"` if <3 skills; each item has `overallScore, scores, matchedSkills, partialSkills, missingSkills, eligibility, explanation, internship` |
| POST | /recommendations/generate | forces regeneration → `{generated, average, generatedAt}` |
| GET | /recommendations/history | previous generation runs |
| GET | /recommendations/:internshipId | one recommendation (computed live if not cached) + `gap` |
| GET | /skill-gaps | aggregated gaps over top 20 eligible matches with learning paths |
| GET | /skill-gaps/:internshipId | `{critical[],moderate[],minor[],items[]}` for one internship |

## Applications
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | /applications | 🎓 | `{internshipId, coverNote?}`; validates profile, approval, status, deadline, duplicate (409) and eligibility (403 with `details.reasons`) |
| GET | /applications | 🔑 | scoped to caller (student own, company own, admin all); response includes `grouped` by status |
| GET | /applications/:id | 🔑 | ownership checked |
| PUT | /applications/:id/status | 🔑 | `{status, note?}`; student → only `Withdrawn`; company → Under Review, Shortlisted, Interview, Selected, Rejected; notifies the student |

## Saved 🎓
`POST /saved/:internshipId` · `DELETE /saved/:internshipId` · `GET /saved`

## Company 🏢
`GET|PUT /company/profile` · `POST /company/logo` (multipart `logo`, png/jpg/webp ≤2 MB) · `GET /company/dashboard` (counts, shortlisting rate, per-internship aggregation) · `GET /company/internships` · `GET /company/applications` (`internshipId`, `status`, `minScore`; sorted by match) · `GET /company/applications/:id` (candidate profile + live compatibility)

## Admin 🛡
| Method | Path | Notes |
|---|---|---|
| GET | /admin/dashboard | overview cards + status and domain aggregations |
| GET | /admin/analytics | `{overview, charts{...}, highlights{...}}` - all aggregation results |
| GET | /admin/users | `role`, `q`, `active`, `page`, `limit` |
| PUT | /admin/users/:id/status | `{isActive}` |
| DELETE | /admin/users/:id | removes user and owned data |
| GET | /admin/companies | with internship counts |
| PUT | /admin/companies/:id/verify | `{verified}` |
| GET | /admin/internships | `approvalStatus`, `status`, `q`, paging |
| PUT | /admin/internships/:id/approval | `{status:"approved|rejected|pending", note?}`; approval scores the internship for all students and notifies the company |
| GET | /admin/applications | `status`, paging |

## Notifications & catalog
`GET /notifications` (also generates deadline alerts for students) · `GET /notifications/unread-count` · `PUT /notifications/read-all` · `PUT /notifications/:id/read` · `DELETE /notifications/:id` · `GET /catalog/skills?q=&category=` · `GET /catalog/learning/:skill` · `GET /catalog/stats` (public landing statistics) · `GET /health`

## Rate limits
Login/register: 100 per 15 min per IP. All other `/api` routes: 600 per minute per IP.
