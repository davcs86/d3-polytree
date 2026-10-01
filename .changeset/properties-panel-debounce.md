---
'@d3-polytree/editor': patch
---

Fix a properties-panel edit landing on the wrong element: typing in a field and
then selecting something else within the 300 ms debounce window wrote the text
into the newly selected element (e.g. the diagram settings). The pending edit is
now flushed into the element it was typed into before the panel re-renders, and
dropped when the engine is torn down.
