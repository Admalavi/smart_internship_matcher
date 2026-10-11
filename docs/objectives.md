# Objectives

## Primary
1. Demonstrate document modelling in MongoDB: embedding (skills, projects, eligibility, statusHistory) and referencing (userId, companyId, internshipId).
2. Build a **recommendation layer** that scores every student-internship pair from real data using a documented weighted formula.
3. Make every recommendation **explainable** (matched skills, partial skills, missing skills, eligibility, location, duration, projects).
4. Detect and classify **skill gaps** (Critical / Moderate / Minor) and attach stored **learning paths**.

## Secondary
5. Implement the whole lifecycle: register → profile → discover → apply → track → status update → notification.
6. Provide role-based dashboards for student, company and admin.
7. Use MongoDB features visibly: CRUD, query operators, aggregation pipelines (`$unwind`, `$group`, `$lookup`, `$bucket`), text index, compound/unique/partial/TTL indexes, bulk writes and upserts.
8. Secure the system: bcrypt, JWT, role middleware, validation, upload filtering, rate limiting.
9. Keep the engine replaceable (`RecommendationEngine` abstraction) so a learned model can be added later.

## Measurable outcomes
* Different students receive visibly different rankings for the same internships (seed data has four contrasting personas).
* No statistic shown in the UI is hard-coded; all come from API calls backed by MongoDB.
* Ineligible applications are rejected by the API with the reason.
* All dashboard charts are produced by aggregation pipelines.
