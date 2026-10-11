# Future Scope

1. **Learned ranking** - implement `MLRecommendationEngine`: train a learning-to-rank model on `activityhistories` (views, saves, applies) and `applications` outcomes (shortlisted/selected) using the rule-based score as a baseline feature; evaluate with offline NDCG before replacing the engine.
2. **Semantic skill matching** - replace the hand-curated relationship graph with skill embeddings; store vectors and use MongoDB Atlas Vector Search.
3. **Resume parsing** - PDF/DOCX extraction and NER for projects/education; the current parser only matches skill-catalog keywords in plain text.
4. **Collaborative filtering** - "students like you applied to…" from activity data.
5. **Notifications** - e-mail / web-push, WebSockets instead of 60 s polling, user-level notification preferences.
6. **Scalability** - shard `recommendations` and `applications` by `studentId`; compute scores in a background worker queue instead of on read; incremental recomputation (only changed internships).
7. **Security hardening** - refresh tokens in httpOnly cookies, e-mail verification, password reset, audit logs, antivirus scanning for uploads, object storage for files.
8. **Placement analytics** - cohort comparison, salary/stipend trends, skill-demand time series using `$setWindowFields`.
9. **Interview scheduling** and calendar integration for the "Interview" stage.
10. **Schema validation** - add MongoDB JSON-schema validators for `customFields` per domain.
11. **Accessibility & i18n** - full keyboard/ARIA audit and regional languages.
