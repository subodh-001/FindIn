## FindIn Pilot Roadmap

This document captures the foundation work required before larger-scale expansion. It is intended to guide the first pilot launch in a single Indian city.

### 1. Stakeholder Alignment
- Compile a list of police units, NGOs, hospitals, and volunteer groups who will participate in the pilot.
- Draft Memoranda of Understanding (MoUs) that cover escalation paths, data handling, and takedown requests.
- Nominate a local coordination lead responsible for weekly progress reviews.

### 2. Pilot Scope
- Focus area: one district with high incident volume and reliable partner coverage.
- Supported categories: Missing persons, women’s safety, senior citizens, and critical crimes.
- Languages: English + primary regional language for landing copy, SMS templates, and push notifications.

### 3. Product Expectations
- Verified onboarding: admins approve new users, responders join via invite links, and two-factor authentication is mandatory for privileged accounts.
- Report workflow: submit → document upload → admin review → live publication → automated radius expansion → resolution/closure.
- Sightings & collaboration: photo metadata, confidence scoring, moderation queue for spam, real-time updates via Socket.IO or push notifications.

### 4. Operations & Security
- Configure encrypted storage (e.g., S3 with KMS) for ID proofs and sensitive media.
- Enable audit logging for report edits, role changes, and data exports.
- Define incident response: case assignment, escalation to partner agencies, and compliance-friendly data retention.

### 5. Success Metrics
- Time to verify new responder accounts.
- Time from report creation to first responder acknowledgement.
- Number of verified sightings per active case.
- Resolution rate and median time to resolution.

### 6. Post-Pilot Actions
- Conduct retrospective with all partners.
- Update the platform backlog: user feedback, missing features, policy changes.
- Roll out the playbook to the next city with localized adjustments.


