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
      viewer: {
        name: 'D3PolytreeViewer',
        src: '<%= config.sources %>/Viewer.js',
        dest: '<%= config.dist %>'
      },
      navigated_viewer: {
        name: 'D3PolytreeNavigatedViewer',
        src: '<%= config.sources %>/NavigatedViewer.js',
        dest: '<%= config.dist %>'
      },
      modeler: {
        name: 'D3PolytreeModeler',
        src: '<%= config.sources %>/Modeler.js',
        dest: '<%= config.dist %>'
      }
    }

  });

  grunt.loadTasks('tasks');

  // tasks

  grunt.registerTask('default', [ 'jshint', 'bundle' ]);
};