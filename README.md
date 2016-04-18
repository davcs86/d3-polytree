# d3-simple-networks

Simple directed node networks with D3js

Demo on [JSFiddle.Net](https://jsfiddle.net/davcs86/bffszf0d/2/)

## Install

- With bower

```shell
$> bower install --save git://github.com/davcs86/d3-simple-networks
```

import it with

```html
<script src="bower_components/d3-simple-networks/dist/d3-simple-networks.min.js"></script>
```

- With npm

```shell
$> npm install --save davcs86/d3-simple-networks
```

use it with

```js
var d3sn = require('d3-simple-networks');
```

- Old-school way
 
Just download the master branch of this repo, then import it with 

```html
<script src="<your-scripts-folder>/d3-simple-networks/dist/d3-simple-networks.min.js"></script>
```

## Usage

Example:

![Alt text](/dist/screenshot.png?raw=true "Example")

```js
var network = new D3SimpleNetwork({
    "container": "body",
    "nodes": {
        "NODE_A": {
            "adjacencyList": {
                "NODE_A_TR": 1
            },
            "label": "Node-A",
            "iconType": "field",
            "attachedData": {
                "Qg": ["1", "1.2"],
                "Qo": ["100", "105"]
            }
        },
        "NODE_A_TR": {
            "adjacencyList": {
                "NODE_A_TR_NODE_B": 1
            },
            "label": "Node-A refinery",
            "iconType": "transport",
            "attachedData": {
                "Qg": ["n/a", "1.1"],
                "Qo": ["n/a", "101"]
            }
        },
        "NODE_B": {
            "adjacencyList": {
                "NODE_A_TR_NODE_B": 1
            },
            "label": "Node-B",
            "iconType": "field",
            "attachedData": {
                "Qg": ["1.5", "1.7"],
                "Qo": ["140", "150"]
            }
        },
        "NODE_A_TR_NODE_B": {
            "adjacencyList": {
                "NODE_C": 1
            },
            "label": "Node-A refinery + Node-B",
            "iconType": "storage",
            "attachedData": {
                "Qg": ["n/a", "2.7"],
                "Qo": ["n/a", "250"]
            }
        },
        "NODE_C": {
            "adjacencyList": null,
            "label": "Node C",
            "iconType": "transfer",
            "attachedData": {
                "Qg": ["2.45", "2.5"],
                "Qo": ["232", "230"]
            }
        }
    },
    "tableHeaders": ["Var", "Reported", "Fixed"]
});
```
