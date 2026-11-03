# Delivery templates

Use the relevant format, preserve existing team conventions, and omit fields
that do not help the task. Unknown values remain unknown or explicitly proposed.
Identifiers below are illustrative; reuse existing project identifiers.

## Feature spec

- **Feature and status:** Name; proposed or agreed; source and revision if known.
- **Problem and audience:** Who needs help, in what context, and with which task.
- **Evidence:** Linked findings; assumptions and confidence; competing evidence.
- **Outcome:** Intended user benefit, success measure, and relevant guardrails.
- **Scope:** Included behavior and meaningful boundaries.
- **Flow:** Entry, core steps, choices, feedback, completion, and recovery.
- **Requirements:** Stable identifiers and observable behavior.
- **Acceptance:** Testable criteria linked to requirements; Given/When/Then when
  that clarifies the behavior.
- **Constraints and dependencies:** Relevant platform, content, audio, design,
  accessibility, and integration constraints.
- **Decisions:** Resolved tradeoffs, outstanding questions, and material changes.

## Ticket

**Title:** Verb plus user-visible outcome.

**Source:** Spec and requirement identifiers; relevant research or design.

**Problem:** User, context, and reason the change matters.

**Behavior and scope:** What changes, relevant states, and necessary boundaries.

**Acceptance criteria:** Observable criteria with stable identifiers when useful.

**Dependencies:** Related work and unresolved blockers; distinguish requirements
from implementation suggestions.

**Validation:** How to demonstrate the behavior, relevant environments, and
regressions to check.

**Priority:** Proposed or agreed priority and its rationale. Include owner,
estimate, and deadline only when known or clearly proposed.

## Requirement coverage

| Requirement | Acceptance criterion | Ticket | UAT scenario | Evidence or gap |
| --- | --- | --- | --- | --- |

Populate with actual identifiers and links. Every in-scope criterion needs a
planned validation path; gaps remain visible rather than silently counting as
covered.

## UAT scenario

- **ID and title:** Stable identifier and the user goal being exercised.
- **Traceability:** Spec revision, requirement, criterion, and relevant ticket.
- **Context:** User role; environment, build, device, and input source as needed.
- **Preconditions:** Starting state, permissions, settings, and test data.
- **Steps:** Reproducible actions and relevant inputs.
- **Expected:** Observable behavior that satisfies the criterion.
- **Actual:** Recorded result; leave unexecuted scenarios explicitly unexecuted.
- **Status:** Pass, Fail, Blocked, or Not Run.
- **Evidence:** Actual observations, screenshots, logs, or recordings when available.
- **Follow-up:** Defect link, blocker, or required retest.

For an audio scenario, record whether input is a real microphone, an instrument,
a fixture, or a simulation. State which claims that input can validate.

## Defect and retest

**Title and impact:** Concrete failure and who it affects.

**References:** Failing requirement, acceptance criterion, and UAT scenario.

**Reproduction:** Build, environment, starting data, and steps.

**Expected / actual:** The acceptance expectation and observed behavior.

**Severity and priority:** Distinct values with reasons; use the team's scheme.

**Evidence and retest:** Supporting observations, fix reference when known,
conditions for retesting, actual retest result, and relevant regression checks.

## Acceptance summary

Report scope and build assessed, requirement coverage, executed results, open
defects by impact, Blocked and Not Run scenarios, and the resulting readiness
recommendation. Separate that recommendation from a stakeholder's recorded
acceptance or release decision.
