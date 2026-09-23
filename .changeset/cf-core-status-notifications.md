---
'@d3-polytree/core': patch
---

Two internal hardening changes, no behavior change to public rendering:

- Introduce a shared `ElementStatus` const (New/Persisted/Dirty/Deleted) and replace the bare `0/1/2/3`
  status literals across the draw/modelling/feature layers (identical numeric values; the `toXML`
  round-trip contract is preserved).
- Harden notifications: `NotificationParams` gains a dedicated `trustedHtml` field for pre-sanitized
  markup, and the notice popup uses it. Plain `text` is always rendered as textContent, so untrusted
  content can no longer reach `innerHTML` via a boolean flag.
