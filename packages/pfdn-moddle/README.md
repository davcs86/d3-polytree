# pfdn-moddle

Read and write Process Flow Diagram files in NodeJS and the browser.

__pfdn-moddle__ uses a custom notation to validate the input and produce Process Flow Diagrams (PFD) in XML. The library is built on top of [moddle](https://github.com/bpmn-io/moddle) and [moddle-xml](https://github.com/bpmn-io/moddle-xml).


## Usage

Get the library via `npm install davcs86/pfdn-moddle`. Bundle it for the web using [browserify](http://browserify.org) or [webpack](https://webpack.github.io).

```javascript
var PfdnModdle = require('pfdn-moddle');

var moddle = new PfdnModdle();

var xmlStr =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" id="empty-definitions" targetNamespace="http://bpmn.io/schema/bpmn">' +
  '</bpmn2:definitions>';


moddle.fromXML(xmlStr, function(err, definitions) {

  // update id attribute
  definitions.set('id', 'NEW ID');

  // add a root element
  var bpmnProcess = moddle.create('bpmn:Process', { id: 'MyProcess_1' });
  definitions.get('rootElements').push(bpmnProcess);

  moddle.toXML(definitions, function(err, xmlStrUpdated) {

    // xmlStrUpdated contains new id and the added process

  });

});
```


## Resources

*   [Issues](https://github.com/davcs86/pfdn-moddle/issues)
*   [Examples](https://github.com/davcs86/pfdn-moddle/tree/master/test/spec/xml)


## Building the Project

You need [grunt](http://gruntjs.com) to build the project.

To run the test suite that includes XSD schema validation you must have a Java JDK installed and properly exposed through the `JAVA_HOME` variable.

Execute the test via

```
grunt test
```

Perform a complete build of the application via

```
grunt
```


## License

Use under the terms of the [MIT license](http://opensource.org/licenses/MIT).