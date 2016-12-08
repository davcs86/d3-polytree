'use strict';

/**
 * CommandQueue description
 *
 * @class
 * @constructor
 *
 * @param {Queue} queue
 */

function CommandQueue(queue) {
  var that = this;

  this._queue = queue;
}

CommandQueue.$inject = [
  'queue',
  'eventBus'
];

module.exports = CommandQueue;

CommandQueue.prototype._execute = function (command, context) {
  this._queue.enqueue({
    command: command,
    context: context
  });
};
