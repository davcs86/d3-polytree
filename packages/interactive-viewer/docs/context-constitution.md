# @d3-polytree/interactive-viewer — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the
interaction layer and its folded-in panels. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/interactive-viewer**.

## Rules (`IV-*`) — binding, easy-to-miss conventions

| ID        | Rule                                                                                                                                                                                                                                                                 | Why                                                                                                                                                                                                                                                                     | Evidence                                                                                                                                                      | Example (canonical `path#anchor`)                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **IV-01** | Folded panels (side-tabs, search-panel, notifications) decouple from siblings via **structural interfaces resolved at runtime**, never a concrete import of the sibling package.                                                                                     | e.g. `SearchPanel` redeclares the `SideTabsRegistrar` surface locally and resolves the `sideTabsProvider` token at runtime "to avoid a hard build dependency on side-tabs"; importing the concrete `SideTabsProvider` recreates the compile coupling the design avoids. | `packages/interactive-viewer/src/search-panel/SearchPanel.ts#SideTabsRegistrar`                                                                               | `packages/interactive-viewer/src/search-panel/SearchPanel.ts#SideTabsRegistrar`            |
| **IV-02** | `domNotificationsModule` has **no `__init__`** — it mounts DOM in its constructor and is only instantiated because core's `notificationsModule` carries `__init__: ['notifications']`. It is an override-only module and must be composed **last** (root `PLAT-01`). | If core ever drops that eager init, the toast/confirm UI silently never mounts; if another module is composed after it, the console stub wins (`PLAT-01`).                                                                                                              | `packages/interactive-viewer/src/notifications/DomNotifications.ts#domNotificationsModule`, `packages/core/src/features/notifications.ts#notificationsModule` | `packages/interactive-viewer/src/notifications/DomNotifications.ts#domNotificationsModule` |

## Norms (`IV-*`) — defaults & asymmetry guidance

| ID         | Norm                                                                                                                                                            | Why                                                                                             | Evidence                                                                                                                              | Example (canonical `path#anchor`)                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **IV-N03** | Search-row activation drives selection by emitting a **synthetic `<localName>.click`** (plus `zoom.to.element`), not by calling the selection feature directly. | Breaks silently if the selection feature stops listening to `<class>.click`; guarded by a test. | `packages/interactive-viewer/src/search-panel/SearchPanel.ts#_activate`, `packages/interactive-viewer/src/search-panel/index.test.ts` | `packages/interactive-viewer/src/search-panel/SearchPanel.ts#_activate` |

## Gotchas & scars

- **Search fell back to element id + refreshes on `node.updated`/`link.updated`** because a node's label text is set _after_ `node.created`, so newly added nodes never appeared. Don't re-narrow search to caption-only. Scar PR #70 (`8394296`).

## Candidate rules (unverified)

_None._

## Pointers (already documented or CI-enforced — not restated here)

| What                                                                                             | Where                                                                   |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Boot order: interaction/feature modules before drawers so created-listeners see initial elements | root `CLAUDE.md`; `packages/interactive-viewer/src/index.ts#getModules` |
| Last-definition-wins override for `notifications` (DomNotifications composed last)               | root `CLAUDE.md`, root `PLAT-01`                                        |
| Folded panels (decision O10); aggregated `style.css` → `dist/style.css`; UMD second pass         | root + package `CLAUDE.md`                                              |

---

_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
