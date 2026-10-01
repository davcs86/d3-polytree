---
'@d3-polytree/interactive-viewer': patch
---

The confirm dialog listens for Enter/Escape on itself instead of `document`.
Enter from a host-page input can no longer confirm a destructive action, and
Enter on the focused Cancel button cancels. `destroy()` cancels an open
confirmation (its callback receives `false`) and clears pending toast timers.
