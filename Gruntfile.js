module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                ignores: []
            },
            files: {
                src: [
                    'bin/**/*.js',
                    'lib/**/*.js']
            },
            gruntfile: {
                src: 'Gruntfile.js'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Default task(s).

    grunt.registerTask('default', ['jshint']);
};