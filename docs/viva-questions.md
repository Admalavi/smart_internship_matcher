# Viva Questions and Answers

**1. Why MongoDB for this project?**
Student profiles and internships are nested, variable documents (skills[], projects[], eligibility{}, custom attributes). One document read returns a full aggregate without joins, arrays are indexable, the aggregation framework supports the analytics, and Atlas provides replication and sharding. Recommendation results (arrays of matched/missing skills plus explanations) also fit documents naturally.

**2. What does "NoSQL" mean and which type is MongoDB?**
"Not only SQL": databases that drop the fixed relational schema in favour of other models and horizontal scaling. MongoDB is a document store (BSON documents in collections).

**3. MongoDB vs MySQL - when would you prefer MySQL?**
MySQL is better for strongly relational data with many multi-table transactions and enforced foreign keys (e.g. banking). Here, profile/skills/projects would need 4-5 tables and joins, per-internship attributes would need EAV or JSON columns, and cascades/integrity are acceptable to handle in code. If the workload were mostly cross-entity reporting with strict integrity, MySQL would win.

**4. Embedding vs referencing - what did you choose and why?**
Embedded: skills, projects, certifications (read with the profile, bounded), eligibility/stipend (belong to one internship), statusHistory (append-only timeline). Referenced: application/recommendation/saved link students and internships (many-to-many, unbounded, independently queried); internships reference companies. The 16 MB document limit and unbounded growth are the reasons not to embed applications inside internships.

**5. Where is denormalisation used and what is its risk?**
`applications.snapshot` (student name, college, CGPA, titles) and `applications.companyId`. It avoids joins and keeps history if an internship is deleted; the risk is staleness, which is acceptable because a snapshot should reflect the moment of applying.

**6. Which indexes did you create and why?**
Unique email/userId; compound `{status, approvalStatus, applicationDeadline}` for the discovery predicate; `{domain, location, workMode}` for filters; a weighted text index for search; unique `{studentId, internshipId}` on applications/recommendations/saved to enforce idempotency; `{studentId, overallScore:-1}` for top-N; a partial unique index for notification de-duplication; a TTL index to expire activity logs after 180 days. See `database-design.md`.

**7. What is a compound index and does field order matter?**
An index on several fields. Order matters (equality fields first, then sort/range fields; prefix rule). `{status, approvalStatus, applicationDeadline}` serves equality on the first two and a range on deadline.

**8. How does text search work here?**
A text index over title, description, domain, tags, location and required-skill names with weights. `$text:{$search}` tokenises and stems the query, ORs terms, and `$meta:"textScore"` ranks by relevance. If it returns nothing (e.g. partial word "pyth"), the API falls back to `$regex` across fields, and `meta.searchMode` reports which was used.

**9. Why only one text index?**
MongoDB allows one text index per collection, so location and skill names were added to the same index to support queries such as "Remote Python internship".

**10. Explain the aggregation pipeline for "most demanded skills".**
`$match` approved internships → `$unwind` requiredSkills (one document per skill) → `$group` by skill name counting and counting High-importance → `$sort` by count → `$limit` 10 → `$project` rename. `$unwind` is needed because skills are an embedded array.

**11. Where is `$lookup` used and how does it compare to a SQL join?**
Student applied-domains and company funnel join applications to internships; the student gap view joins missing skills to `learningresources`. It is a left outer join executed in the aggregation engine; it is costlier on large collections than an indexed SQL join, so the schema denormalises where reads are hot.

**12. What is `$bucket` used for?**
The recommendation score distribution: boundaries 0, 20, 40, 60, 80, 101 produce histogram counts in a single pass.

**13. Explain the flexible schema in this project.**
`internships.customFields` (Mixed) lets each posting carry different attributes (portfolioRequired for design, datasetAccess for ML). The company form lets users add arbitrary key-values. The trade-off is no automatic validation of these fields; JSON-schema validators could be added.

**14. Explain the recommendation algorithm mathematically.**
`overall = 0.40·S + 0.15·E + 0.15·D + 0.10·L + 0.10·T + 0.10·P`, each in [0,1]. S is the importance-weighted (3/2/1) average credit over required skills (exact 0.8-1.0 by proficiency, related 0.5, missing 0). E from eligibility checks, D from interest/domain token overlap, L location/remote fit, T duration distance, P coverage of required skills by project technologies. Ineligible internships are capped at 40. See `matching-algorithm.md` for a worked example (84%).

**15. How do you decide a partial match?**
A curated relationship graph (`utils/skillUtils.js`), e.g. Spring Boot ⇐ Java, React ⇐ JavaScript, MongoDB ⇐ MySQL. A related skill earns 0.5 credit and is listed as a lower-severity gap.

**16. How is the skill gap classified?**
Required − Student. Missing skills: High→Critical, Medium→Moderate, Low→Minor; partial skills drop one level. Each gap links to a stored learning path (steps, resources, hours).

**17. Is this machine learning?**
No. It is a transparent weighted rule-based engine. The `RecommendationEngine` abstraction and the unimplemented `MLRecommendationEngine` placeholder show where a learned model would plug in; nothing in the UI or docs claims ML.

**18. Why store recommendations instead of computing on each request?**
Scoring every internship per request is O(N) and repeats work. Results are upserted (bulkWrite) into `recommendations` with `generatedAt`. A staleness check compares profile/internship `updatedAt` with `generatedAt`, so caches refresh on profile change, new/edited internships, approval, or manual refresh.

**19. How do you guarantee no duplicate applications or saves under concurrency?**
Unique compound indexes on `{studentId, internshipId}`; the application check is backed by the index, and a duplicate-key error (11000) is mapped to HTTP 409. Notifications use a partial unique index plus `$setOnInsert` upserts for idempotency.

**20. How is eligibility enforced?**
The engine checks CGPA, branch, graduation year and degree. `POST /applications` recomputes eligibility server-side and rejects NOT_ELIGIBLE with 403 and the reasons (e.g. "Minimum CGPA required: 8.0. Your CGPA: 7.4"). The UI is only a convenience; the server is authoritative.

**21. Describe the security measures.**
bcrypt-hashed passwords (never selected or returned), JWT bearer auth with expiry, role middleware plus ownership checks, input validation, Multer file-type/size filtering, Helmet, CORS allow-list, rate limiting, environment variables for secrets. Known gaps: token in localStorage, no refresh tokens/e-mail verification.

**22. How would this scale to millions of students?**
Shard `recommendations`/`applications` by `studentId`; move scoring to background workers and recompute incrementally; keep `applicationDeadline`/status indexes selective; use read replicas for analytics; precompute analytics with `$merge` into summary collections; use Atlas Search/Vector Search for retrieval before scoring (score only top candidates).

**23. What is the CAP perspective?**
MongoDB replica sets are CP by default (writes go to the primary; during a partition without a majority a primary is not available). With read preferences like `secondary` you trade consistency for availability. This app uses the primary for reads and writes.

**24. Does MongoDB support transactions? Did you use them?**
Yes, multi-document ACID transactions on replica sets/Atlas. This project did not need them: each business operation changes one document or is idempotent (upserts), and cross-collection side effects (notifications, activity) are allowed to be eventually consistent.

**25. What are the limitations and what would you improve first?**
Hand-curated skill graph; keyword-only resume parsing; full re-score of one student's recommendations after any internship change; in-app polling notifications; no JSON-schema validation on `customFields`. First improvements: incremental scoring, embeddings for semantic skill similarity, and a learned ranker trained on application outcomes.

**26. How does the explanation get generated?**
`buildExplanation` converts each component of the score into a typed sentence (positive, warning, negative, info) from real data - e.g. "3 of 5 required skills matched", partial credit via the related skill, the best-matching project, eligibility reasons, and the list of gaps - so no text is hard-coded per internship.
