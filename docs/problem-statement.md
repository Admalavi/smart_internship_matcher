# Problem Statement

## Background
Internships are the main bridge between academic study and employment, yet students find them through keyword searches on large portals. A student with *Java, React, MongoDB, Node.js* who prefers a *6-month internship in Pune* must manually read dozens of postings to learn whether they qualify, which requirements they miss, and which posting suits them best.

## Problems with existing portals
1. **Keyword matching only** - no understanding of related skills (JavaScript ↔ React).
2. **No explanation** - a list of results without reasons.
3. **Eligibility discovered late** - CGPA, branch and graduation-year rules are found only after reading or applying.
4. **No skill-gap feedback** - students do not learn what to study next.
5. **Rigid data model** - internships in design, security, ML and mobile need different attributes.
6. **Weak analytics** - placement offices cannot see which skills are in demand or lacking.

## Problem to solve
Design and implement a web platform that
* stores heterogeneous student and internship data in **MongoDB**,
* computes a **personalised, explainable compatibility score** between a student and each internship,
* validates **eligibility** before application,
* detects **skill gaps** and proposes **learning paths**,
* tracks **applications** and generates **notifications**,
* provides **analytics** for companies and the placement office using MongoDB aggregation.

## Example
Student: Java, React, MongoDB, Node.js · interest Full Stack · Pune · 6 months.
Internship: Java Full Stack Developer Intern requiring Java, Spring Boot, React, MongoDB in Pune for 6 months.
Output: match score, matched skills (Java, React, MongoDB), partial/missing skill (Spring Boot - partial credit because the student knows Java), eligibility result, location and duration confirmation, and a learning path for Spring Boot.

## Scope
In scope: three roles (student, company, admin), recommendation engine, skill-gap engine, application workflow, notifications, analytics, seeding, tests.
Out of scope: payments, messaging between users, video interviews, learned (ML) ranking, e-mail delivery.
