module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        eslint: {
            files: {
                src: [
                    '**/*.js',
                    '!node_modules/**/*']
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');

    // Default task(s).

    grunt.registerTask('default', ['eslint']);
};