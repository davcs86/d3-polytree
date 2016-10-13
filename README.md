# D3 Polytree

Interactive [polytree](https://www.google.com/search?q=polytree) viewer based on D3js.

Demo on [JSFiddle.Net](https://jsfiddle.net/yywby23u/1/)

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

## Bundle it

Just clone the master branch of this repo

```shell
$> git clone https://github.com/davcs86/d3-polytree-graph.git
```

Install `Grunt` and the nodejs dependencies

```shell
$> npm install -g grunt-cli
$> cd d3-polytree-graph
$> npm install
```

Run the `default` task with grunt to bundle the library

```shell
$> grunt default
```


### Known issue

In a recent change, I added up the ability to "requiring" the SVG icons in a CommonJS way (see `./lib/icons/index.js`), 
by using `xml2js` to parse and import the icons as re-usable def elements. Unfortunately, you have to do 2 minor changes to
`xml2js` after running `npm install`, in order to bundle the library without problems.

File: `./node_modules/xml2js/lib/xml2js.js`:

Line 11:  `events = require('events/events');`

Line 19:  `setImmediate = require('timers-browserify').setImmediate;`

## Usage

Example:

![Alt text](/dist/screenshot.png?raw=true "Example of usage")

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
                "NODE_C": {
                	color: "red",
                  label: "to node C"
                }
            },
            "label": "Node-A refinery + Node-B",
            "iconType": "storage",
            "attachedData": {
                "Qg": ["2.6", "2.7"],
                "Qo": ["245", "250"]
            },
            positionX: 780, 
            positionY: 345,
            overridePosition: true
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
    "tableHeaders": ["Var", "Reported", "Fixed"],
    floatingLabels: [{
      id: '1',
      label: "Arbitrary label",
      x: 200,
      y: 600,
      'font-size': 30,
      color: 'red'
    }]
});
```
