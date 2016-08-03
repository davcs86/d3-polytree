'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  // project configuration
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    config: {
      sources: 'lib',
      dist: 'dist'
    },

    jshint: {
      src: [
        ['<%=config.sources %>']
      ],
      options: {
        jshintrc: true
      }
    },

    bundle: {
      d3sn: {
        modName: 'D3SimpleNetwork',
        name: 'd3-simple-networks',
        src: '<%= config.sources %>/SimpleNetwork.js',
        dest: '<%= config.dist %>'
      }
    }

  });

  grunt.loadTasks('tasks');

  // tasks

  grunt.registerTask('default', [ 'jshint', 'bundle' ]);
};