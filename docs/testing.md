# Testing

## Automated tests (`backend/tests`)
| File | Needs MongoDB | What it covers |
|---|---|---|
| `matching.test.js` | no | exact / partial / missing skill, alias normalisation, importance weighting, eligibility (eligible, CGPA far/near, branch), ineligible cap, location, remote, duration, overall score, weights sum to 1 |
| `skillGap.test.js` | no | Critical/Moderate/Minor classification, partial downgrade, no-gap case |
| `api.test.js` | **yes** | register/login/duplicate/invalid login, JWT and role checks, recommendations generated + cached + refreshed after profile change, skill-gap endpoint, applications (valid, duplicate, ineligible, expired, status update + notification), CRUD operators, `$text` search + regex fallback + filters, index existence, admin aggregation results |

```bash
cd backend
npm run test:unit    # 20 tests, no database
npm test             # all; uses MONGODB_URI_TEST if set, otherwise mongodb-memory-server (downloads mongod on first run)
```
**Honest status:** the 20 unit tests were run and pass. `api.test.js` and `npm run seed` were written but could not be executed in the environment where the code was produced (no MongoDB available), so run them first on your machine and fix anything they reveal.

## Manual checklist
- [ ] MongoDB connects; server logs "Indexes ready"
- [ ] `npm run seed` completes and prints demo credentials
- [ ] `GET /api/health` returns ok; frontend loads at :5173
- [ ] Register student / company; duplicate email shows an error; wrong password shows an error
- [ ] Student profile edit saves; completion % changes after adding skills/projects/certifications
- [ ] Adding/removing a skill changes recommendation scores on next view
- [ ] Recommendations show match %, explanation, matched/partial/missing chips
- [ ] Internship details show "Your Compatibility", breakdown bars, eligibility checks, skill gaps with learning path
- [ ] Search "Java developer", "Remote Python internship", "pune" return relevant results; "pyth" works through the regex fallback
- [ ] Filters and the four sort options work; pagination works
- [ ] Save / unsave; saved page lists items
- [ ] Applying to an ineligible internship shows "not currently eligible" + reason; duplicate and expired applications are blocked
- [ ] Application appears in the Kanban tracker; withdraw works
- [ ] Company posts an internship (dynamic skills) → admin approves → student sees it
- [ ] Company changes application status → student receives a notification
- [ ] Deadline alerts appear for saved internships closing within 7 days
- [ ] Admin dashboard and analytics render from live data; approve/reject/verify/deactivate work
- [ ] Unauthorised access: student visiting `/admin` is redirected; API returns 403

## Demo script (viva presentation, ~8 minutes)
1. Landing page: statistics come from MongoDB.
2. Register a new student; add Java, React, MongoDB, Node.js; add a MERN project; set Full Stack, Pune, 6 months.
3. Open Recommendations → explain the score and "Why?".
4. Open a Java internship → Your Compatibility → skill gap and learning path.
5. Save, then apply; show the tracker.
6. Log in as `company@example.com`, open Applications, shortlist the student with a note.
7. Log in as the student again → notification.
8. Log in as `admin@example.com` → analytics; mention that every chart is an aggregation pipeline (`analyticsService.js`).
9. Show Mongo shell / Compass: `db.internships.getIndexes()` and `db.internships.find({$text:{$search:"java"}})`.

## Useful shell queries for the viva
```js
db.internships.aggregate([{$unwind:"$requiredSkills"},{$group:{_id:"$requiredSkills.name",n:{$sum:1}}},{$sort:{n:-1}},{$limit:5}])
db.recommendations.find({studentId:ObjectId("...")}).sort({overallScore:-1}).limit(3).explain("executionStats")
db.applications.aggregate([{$group:{_id:"$status",n:{$sum:1}}}])
```
