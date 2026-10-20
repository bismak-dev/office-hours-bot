# Office Hours Bot

A demo of User Stories 1 and 2 from the spec in [docs/](docs/): a student types a name, asks a question, and the app shows the most relevant passages from the sample course materials, each with a "Source:" line naming the document and slide or section it came from. No AI is connected yet ("demo mode").

- Live demo: https://office-hours-bot-one.vercel.app
- Run locally: `npm install`, then `npm run dev`, then open http://localhost:3000
- Run the tests: `npm test`

## Non-goals

This build deliberately leaves out:

- **Real payments.** The spec has no payment step; if one is added, it will use a "Simulated payment" button instead of charging a card.
- **Real authentication.** Where the spec needs a signed-in user, the app uses a name typed into a text box. Anyone can type any name.
- **A database.** Questions and answers are kept in the server's memory only. They reset on every deploy, and whenever the server restarts.
- **A real AI.** Answers are the matching passages from the course materials, shown as they are.

## Security spec audit

Audit of the build deployed on 2026-10-06 (before Story 2) against [the security spec](docs/SECURITY_SPEC.md).

**Summary: 7 of 29 requirements are fully satisfied, 7 partly, and 15 not at all.** This build is a demo with sample materials only. It must not hold real student questions or real course materials.

Most of the "Fully" ratings hold only because the risky feature does not exist yet (no AI, no staff screens, no logging). Each of those is marked "by absence" and must be re-checked when the feature is added. Only the 2,000-character limit (part of SEC-022) is covered by an automated test.

| ID | Requirement | Satisfied? | Why |
|---|---|---|---|
| Matrix | Permission matrix enforced on the server | Not at all | There are no roles; anyone on the internet can type a name and ask questions. |
| SEC-001 | University SSO only, no passwords | Not at all | Sign-in is a typed name that is never verified; no passwords are stored, but only because there is no real login. |
| SEC-002 | Membership check on every sign-in | Not at all | There is no roster, TA list, or role lookup; every name is accepted. |
| SEC-003 | Session limits and cookie flags | Not at all | There are no sessions or cookies; the name lives in the open browser page. |
| SEC-004 | Revocation within 60 minutes | Not at all | There is no roster to remove someone from and no sessions to reject. |
| SEC-005 | Server-side role checks, denials logged | Not at all | The server only checks that a name is not blank; there are no roles and no audit log. |
| SEC-006 | Students see only their own data | Partly | No screen or API returns any stored chat, so nothing can leak today, but no ownership check exists. |
| SEC-007 | No staff access to individual chats | Fully (by absence) | There are no staff screens, exports, APIs, or reports of any kind. |
| SEC-008 | Restricted operator access, audited | Not at all | There is no named operator list or access log; there is also no database yet. |
| SEC-009 | Data minimization | Fully | The only thing stored about a user is the typed name, alongside their question, answer, and time. |
| SEC-010 | Deletion on request | Not at all | Students have no way to delete anything; data only disappears when the server restarts. |
| SEC-011 | End-of-semester deletion | Not at all | There is no semester date, scheduled deletion, or confirmation email. |
| SEC-012 | AI vendor rules, no names or emails sent | Fully (by absence) | No AI provider is used; the answering step is given only the question and passages, never the name. |
| SEC-013 | Encryption in transit and at rest | Partly | The Vercel site is served over HTTPS; nothing is stored on disk, so at-rest encryption is not set up. |
| SEC-014 | Upload checks and injection scanning | Not at all | There is no upload feature; materials are files in the project and are not scanned. |
| SEC-015 | Course material is information, not instructions | Partly | With no AI, planted instructions cannot be followed, but material is not marked as reference content and no injection evaluation has been run. |
| SEC-016 | The bot cannot take actions | Fully (by absence) | No AI is connected; the answering step only returns text. |
| SEC-017 | Safe display of answers | Fully | Answers are shown as plain text, so images, scripts, and links in them are not loaded or clickable; this is not yet covered by a test. |
| SEC-018 | Anonymous weekly summary | Not at all | There is no weekly summary. |
| SEC-019 | Anonymous answer reports | Not at all | There is no way to report an answer. |
| SEC-020 | Hidden information stays hidden | Partly | There are no AI instructions, private graded items, or readable chats to reveal, but there is no decline behavior and no evaluation. |
| SEC-021 | No cross-student leakage | Fully | The search covers only the materials files, and each answer is built from only the current question and those passages. |
| SEC-022 | Per-student limits | Partly | The 2,000-character limit is enforced and tested; the 40-per-day and 10-per-minute limits do not exist. |
| SEC-023 | Hard budget cap | Not at all | There is no spending tracking or cap; there is no AI spending yet either. |
| SEC-024 | Staff upload limits | Not at all | There is no upload feature. |
| SEC-025 | Audit log | Not at all | Nothing is recorded about staff actions or denied requests. |
| SEC-026 | No chat content in technical logs | Fully (by absence) | The code writes no logs at all; this is not yet covered by a test. |
| SEC-027 | Secrets kept out of source | Partly | The code contains no keys and `.env.local` is excluded from version control, but no secret scan has been run and there is no secrets manager. |
| SEC-028 | Original files protected | Partly | The material files have no download URL, but anyone can read their content by asking questions, because there is no real sign-in. |
| SEC-029 | Incident notice within 24 hours | Not at all | There is no way to detect unauthorized access and no named operators or procedure. |
