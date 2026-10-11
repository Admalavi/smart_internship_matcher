# NoSQL Concepts Demonstrated (and where)

## Document model & flexible schema
* `studentprofiles` - nested arrays and sub-documents (`models/StudentProfile.js`).
* `internships.customFields` (Mixed) - each posting can store different attributes, e.g. `{portfolioRequired:true, tools:["Figma"]}` (design), `{datasetAccess:"Provided"}` (ML), `{backgroundCheck:true}` (security). Editable in the company form ("Custom attributes").

## CRUD
| Operation | Where |
|---|---|
| insert (`create`, `insertMany`) | registration, internship posting, `seed/seed.js` |
| find / findOne | list/detail endpoints everywhere |
| updateOne | `setUserStatus`, `verifyCompany`, notification read, `savedController.save` (upsert + `$setOnInsert`) |
| updateMany | mark all notifications read, `closeExpired()` in `server.js`, close a deleted company's internships |
| deleteOne / deleteMany | unsave, delete internship (+ cascade of recommendations/saved), delete user, stale recommendations |
| bulkWrite (upserts) | `recommendationService` storing hundreds of scores in one round-trip |

## Query operators
| Operator | Use |
|---|---|
| `$in` | domain / location / workMode / skill filters (skills use case-insensitive regexes inside `$in`) |
| `$nin` | "hide internships I applied to"; remove stale recommendations |
| `$gte` / `$lte` | deadline ≥ now, stipend ≥ x, duration ≤ y, minimum match score |
| `$regex` | fallback search for partial words, admin user/company search, skill autocomplete |
| `$and` / `$or` | composing dynamic filters; regex fallback across title/domain/tags/skills/location |
| `$exists` | stipend filter, `skills.0` (profiles with at least one skill) |
| `$text` + `$meta: textScore` | relevance-ranked search (`internshipController.list`) |
| `$set`, `$setOnInsert` | updates, idempotent upserts |

## Aggregation pipelines (`services/analyticsService.js`, `services/skillGapService.js`)
| Output | Stages |
|---|---|
| Most demanded skills | `$match → $unwind(requiredSkills) → $group → $sort → $limit → $project` |
| Internships by domain / popular locations / work modes | `$match → $group → $sort` |
| Applications by status | `$match → $group → $sort` |
| Monthly applications | `$match → $group({$year,$month}) → $sort → $project` |
| Average recommendation score | `$group` with `$avg` |
| Score distribution | `$bucket` (0-19 … 80-100) |
| Top skill gaps | `$match → $unwind(missingSkills) → $group($addToSet students) → $project($size) → $sort → $limit` |
| Student's most applied domains | `$match → $lookup(internships) → $unwind → $group → $sort` |
| Company funnel | `$match → $group($cond for shortlisted) → $lookup(internships) → $unwind → $project` |
| Student skill gaps + learning path | `$match → $sort → $limit → $unwind → $group → $sort → $limit → $lookup(learningresources) → $unwind → $project` |

## Indexing
See `database-design.md`: single-field, compound, multikey (`skills.name`, `requiredSkills.name`), text, unique, partial-unique, TTL. The discovery query uses the compound `{status, approvalStatus, applicationDeadline}` index; search uses `internship_text_idx`.

## Denormalisation and caching
`applications.snapshot` and `applications.companyId`; `recommendations` collection as a materialised, timestamped cache with explicit invalidation rules.

## Why NoSQL (and MongoDB) for this project
* Aggregate-oriented data: one profile document holds what would be 4-5 relational tables.
* Variable attributes per internship.
* Arrays are first-class and indexable (multikey).
* Aggregation framework replaces many SQL GROUP BY / JOIN queries.
* Horizontal scaling: shard `recommendations` and `applications` by `studentId`.

## MongoDB vs MySQL (for this workload)
| Aspect | MongoDB | MySQL |
|---|---|---|
| Profile with skills/projects | one document | profile + skills + projects + certs tables, joins |
| Per-internship custom attributes | native | EAV tables or JSON columns |
| Search | text index, `$text` | FULLTEXT, less flexible on arrays |
| Strong multi-table transactions | available but not the focus | stronger/more natural |
| Referential integrity | by application code (cascade done manually) | foreign keys |
| Complex reporting joins | `$lookup`, heavier | native joins, optimiser |

## Trade-offs accepted
No foreign keys (cascades coded manually); duplicate data (snapshots) can go stale by design; `$lookup` across large collections is costlier than SQL joins; Mixed `customFields` are not schema-validated.
