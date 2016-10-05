module.exports = function (grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        assetsDir: 'css',
        distDir: 'dist',
        tempDir: '.tmp',
        availabletasks: {
            tasks: {
                options: {
                    filter: 'include',
                    groups: {
                        'Development': ['dev'],
                        'Production': ['package'],
                        'Continuous Integration': ['ci']
                    },
                    sort: [
                        'dev',
                        'test:unit',
                        'test:e2e',
                        'report',
                        'package',
                        'ci'
                    ],
                    descriptions: {
                        'dev': 'Launch the static server and watch tasks',
                        'package': 'Package your web app for distribution',
                        'ci': 'Run unit & e2e tests, package your webapp and generate reports. Use this task for Continuous Integration'
                    },
                    tasks: [
                        'dev',
                        'test:unit',
                        'test:e2e',
                        'report',
                        'package',
                        'ci'
                    ]
                }
            }
        },
        clean: {
            dist: [
                '<%= tempDir %>',
                '<%= distDir %>'
            ]
        },
        copy: {
            dist: {
                files: [{
                        expand: true,
                        dot: true,
                        cwd: '<%= assetsDir %>',
                        dest: '<%= distDir %>/',
                        src: ['*.css']
                    }]
            }
        },
		ngtemplates: {
         dist: {
             cwd: 'src',
             src: "**/*.html",
             dest: "<%= tempDir %>/templates.js",
             options:{
                 module: "bpAddressAutoCompleteWrapper"
             }
         }
        },
        ngmin: {
            dist: {
                files: [{
                        expand: true,
                        cwd: '.tmp/concat/js',
                        src: '*.js',
                        dest: '.tmp/concat/js'
                    }]
            }
        },
        eslint: {
            options: {
                configFile: 'eslint.json'
            },
            target: ['src//**/*.js']
        },

		concat: {
            dist: {
                files: {
                    "dist/bp-address-auto-complete-wrapper.js": ["src/**/*.js", ".tmp/templates.js"]
                }
            }
        }
    });
	grunt.registerTask("bom", function () {
    var buf = grunt.file.read("dist/bp-address-auto-complete-wrapper.js", { encoding: null });
    var BOM = new Buffer([0xEF, 0xBB, 0xBF]);

    // remove multi BOMs from Buffer
    var bufString = buf.toString('utf-8');
    bufString = bufString.replace(BOM.toString('utf-8'), null);
    buf = new Buffer(bufString, 'utf-8');

    // add new UTF-8 BOM to the beginning of the file buffer
    var bomFile = Buffer.concat([BOM, buf]);
    grunt.file.write("dist/bp-address-auto-complete-wrapper.js", bomFile, { encoding: 'utf-8' });
});

    grunt.registerTask('ls', ['availabletasks']);
    grunt.registerTask('package', [
        'clean',
		'eslint',
        'copy',
		'ngtemplates',
        'concat',
		'bom',
        'ngmin'
    ]);
    grunt.registerTask('default', ['package']);
};
