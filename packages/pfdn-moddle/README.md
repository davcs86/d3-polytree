# @d3-polytree/pfdn-moddle

The **`.pfdn`** (Process Flow Diagram Notation) model for the d3-polytree v2 ecosystem — a
[`moddle`](https://github.com/bpmn-io/moddle) schema plus an XML reader/writer.

```ts
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';

const moddle = createPfdnModdle();
const { rootElement } = await moddle.fromXML(pfdnXml); // parse
const node = moddle.create('pfdn:Node', { id: 'n1', type: 'default' });
const { xml } = await moddle.toXML(rootElement);       // serialize
```

Defines the `pfdn:` types — `Diagram`, `Node`, `Link`, `Label`, `Zone`, `Coordinates`, settings — that
the engine reads and writes. See the model rendered in the
**[live Storybook](https://davcs86.github.io/d3-polytree/)**. Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
