---
"@d3-polytree/viewer": minor
"@d3-polytree/interactive-viewer": minor
"@d3-polytree/editor": minor
---

Add a `modules` constructor option to the components (`new Editor({ modules: [...] })`).
Caller-supplied didi modules are composed after the component's own — last
definition of a token wins — so a custom feature, drawer, icon pack, or service
can be layered in without subclassing. See the Storybook "Guides/Kitchensink"
story for a worked example.
