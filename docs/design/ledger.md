# design-buddy — lessons ledger

Append-only. One entry per lesson, newest at the bottom. Future design-buddy runs read this
during recon and hand relevant entries to the adversary.

Entry schema:

### <ISO date> — <change slug> — <lesson | trap>
- **Lesson**: <one line — what worked, or what went wrong>
- **Evidence**: <path:line, PR, or design doc reference>

<!-- Append entries below. Newest at the bottom. -->
