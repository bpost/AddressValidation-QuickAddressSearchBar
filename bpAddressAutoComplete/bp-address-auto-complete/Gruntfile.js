module.exports = function (grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        assetsDir: 'app',
        distDir: 'dist',
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
                '.tmp',
                '<%= distDir %>'
            ]
        },
		ngtemplates: {
			 dist: {
				 cwd: 'app',
				 src: "**/*.html",
				 dest: ".tmp/templates.js",
				 options:{
					 module: "bpAddressAutoComplete"
				 }
			 }
        },
        eslint: {
            options: {
                configFile: 'eslint.json'
            },
            target: ['app/js/**/*.js']
        },
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= assetsDir %>/css',
					dest: '<%= distDir %>/',
					src: ['**/*.css','**/*.png']
				}]
			}
		},
		concat: {
            dist: {
                files: {
                    "dist/bp-address-auto-complete.js": ["app/js/**/*.js", ".tmp/templates.js"]
                }
            }
        }
    });
	grunt.registerTask("bom", function () {
    var buf = grunt.file.read("dist/bp-address-auto-complete.js", { encoding: null });
    var BOM = new Buffer([0xEF, 0xBB, 0xBF]);

    // remove multi BOMs from Buffer
    var bufString = buf.toString('utf-8');
    bufString = bufString.replace(BOM.toString('utf-8'), null);
    buf = new Buffer(bufString, 'utf-8');

    // add new UTF-8 BOM to the beginning of the file buffer
    var bomFile = Buffer.concat([BOM, buf]);
    grunt.file.write("dist/bp-address-auto-complete.js", bomFile, { encoding: 'utf-8' });
});

    grunt.registerTask('ls', ['availabletasks']);
    grunt.registerTask('package', [
        'clean',
		'eslint',
		'ngtemplates',
        'concat',
		'copy',
		'bom'
    ]);
    grunt.registerTask('ci', ['package']);

	grunt.registerTask('default', ['package']);
};
