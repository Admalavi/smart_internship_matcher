# Database Design

Database: `smart_internship_matcher` (MongoDB). Mongoose ODM. `timestamps: true` on all collections (`createdAt`, `updatedAt`).

## Collections

### users
`name, email (unique, lowercase), password (bcrypt, select:false), role (student|company|admin), phone, profileImage, isActive`

### studentprofiles (one per student user)
```
userId (unique → users)
education { degree, branch, college, graduationYear, cgpa }
skills[]         { name, category, proficiency(Beginner..Expert), yearsOfExperience }   (embedded)
projects[]       { title, description, technologies[], role, githubUrl }                (embedded)
certifications[] { name, issuer, issueDate, credentialUrl }                             (embedded)
preferences { domains[], locations[], workModes[], durationPreference, minStipend }
interests[], resumeUrl, profileCompletion (computed in pre-save hook)
```

### companies
`userId (unique), companyName, logo, description, industry, website, location, companySize, verified`

### internships
```
companyId → companies
title, description, domain
requiredSkills[] { name, importance(High|Medium|Low) }   preferredSkills[]
eligibility { minCGPA, branches[], graduationYears[], requiredDegree }
location, workMode, duration(months), stipend { min, max, currency }
responsibilities[], benefits[], openings, applicationDeadline
status (active|closed), approvalStatus (pending|approved|rejected), tags[]
customFields : Mixed          ← flexible, per-internship attributes
```

### applications
```
studentId → users, internshipId → internships, companyId → companies (denormalised)
status, appliedAt, statusHistory[] { status, changedAt, note }
matchScore, skillMatchPercentage, eligibilityScore, coverNote
snapshot { studentName, college, cgpa, internshipTitle, companyName }   ← embedded copy
```

### recommendations (cache of engine output)
```
studentId, internshipId, overallScore
scores { skillMatch, eligibility, domainInterest, locationPreference, durationPreference, projectRelevance }
skillMatchPercentage
matchedSkills[] {name, importance, proficiency}
partialSkills[] {name, importance, via}
missingSkills[] {name, key, importance, severity}
eligibility { status, reasons[] }, confidence, explanation[] {type, text}, engine, generatedAt
```

### savedinternships · notifications · skillcatalogs · learningresources · activityhistories
* `savedinternships`: `studentId, internshipId, savedAt`.
* `notifications`: `userId, type, title, message, link, read, dedupeKey, meta`.
* `skillcatalogs`: `name, key (normalised), category, aliases[]`.
* `learningresources`: `skill, skillKey (unique), steps[], resources[] {title,url,type}, estimatedHours`.
* `activityhistories`: `userId, action, entityType, entityId, meta` (TTL 180 days).

## Embed vs reference decisions
| Data | Choice | Reason |
|---|---|---|
| Skills, projects, certifications | **Embedded** in profile | always read with the profile; bounded size; atomic update |
| Eligibility, stipend | **Embedded** in internship | belongs to one internship, read together |
| statusHistory | **Embedded** in application | append-only timeline, bounded |
| Student ↔ internship relation | **Referenced** (applications, recommendations, saved) | many-to-many, grows independently |
| Company ↔ internship | **Referenced** | company has many internships; internships queried alone |
| Application snapshot | **Embedded copy** | survives internship deletion, avoids joins in tables |
| `companyId` in applications | **Denormalised** | fast company-side queries without joining internships |

## Indexes and why they exist
| Collection | Index | Purpose |
|---|---|---|
| users | `email` unique | login lookup, duplicate prevention |
| users | `{role, createdAt:-1}` | admin user lists |
| studentprofiles | `userId` unique | one profile per user, fast fetch |
| studentprofiles | `skills.name` (multikey) | skill look-ups / analytics |
| studentprofiles | `{education.branch, education.graduationYear}` | eligibility-style queries |
| companies | `userId` unique, `companyName` | owner lookup, admin search |
| internships | `internship_text_idx` (text: title×10, domain×6, tags×5, requiredSkills.name×4, location×3, description×1) | `$text` search with relevance score |
| internships | `title`, `domain`, `location`, `requiredSkills.name`, `applicationDeadline` | field filters and sorts |
| internships | `{status, approvalStatus, applicationDeadline}` | the discovery listing predicate |
| internships | `{domain, location, workMode}` | combined filters |
| internships | `{companyId, createdAt:-1}` | company dashboard |
| applications | `{studentId, internshipId}` unique | prevents duplicate applications |
| applications | `{internshipId,status}`, `{companyId,status}`, `{appliedAt:-1}` | company pipeline, trends |
| recommendations | `{studentId, internshipId}` unique | idempotent upsert |
| recommendations | `{studentId, overallScore:-1}` | top-N per student |
| recommendations | `{internshipId, overallScore:-1}`, `missingSkills.name` | per-internship and gap analytics |
| savedinternships | `{studentId, internshipId}` unique | no duplicate saves |
| notifications | `{userId, read, createdAt:-1}` | inbox + unread counter |
| notifications | `{userId, dedupeKey}` unique **partial** (only when dedupeKey is a string) | idempotent alerts |
| skillcatalogs | `name`, `key` unique | autocomplete / normalisation |
| learningresources | `skillKey` unique | `$lookup` join key |
| activityhistories | `{userId, createdAt:-1}`, `{action, createdAt:-1}` | history, analytics |
| activityhistories | `createdAt` **TTL** 180 days | automatic cleanup |

MongoDB allows one text index per collection, which is why `location` and `requiredSkills.name` are included in it so queries like "Remote Python internship" work.

## Relationships
```
users 1──1 studentprofiles          users 1──1 companies 1──* internships
users 1──* applications *──1 internships
users 1──* recommendations *──1 internships
users 1──* savedinternships, notifications, activityhistories
skillcatalogs / learningresources: reference data keyed by normalised skill name
```
