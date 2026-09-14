'use strict';

function ITool() {
}

ITool.$inject = [
];

module.exports = ITool;

ITool.prototype.activate = function(){
  console.error('This method must be implemented');
};

ITool.prototype.deactivate = function(){
  console.error('This method must be implemented');
};