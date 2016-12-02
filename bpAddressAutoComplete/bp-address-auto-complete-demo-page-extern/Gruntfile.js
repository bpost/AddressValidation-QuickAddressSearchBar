module.exports = function (grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        assetsbpAddressDistDir: './../bp-address-auto-complete/dist',
        distbpAddressDir: 'vendor/bp-address-auto-complete/dist',
		assetsbpAddressWrapperDistDir: './../bp-address-auto-complete-wrapper/dist',
        distbpAddressWrapperDir: 'vendor/bp-address-auto-complete-wrapper/dist',
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
				'vendor/bp-address-auto-complete/dist/bp-address-auto-complete.js',
				'vendor/bp-address-auto-complete/dist/bp-address-auto-complete.css',
                'vendor/bp-address-auto-complete-wrapper/dist/bp-address-auto-complete-wrapper.js',
				'vendor/bp-address-auto-complete-wrapper/dist/bp-address-auto-complete-wrapper.css'
            ]
        },
        copy: {
            dist: {
                files: [{
                        expand: true,
                        dot: true,
                        cwd: '<%= assetsbpAddressDistDir %>',
                        dest: '<%= distbpAddressDir %>/',
                        src: [
							'*.js',
							'*.css'
                        ]
                    },{
                        expand: true,
                        dot: true,
                        cwd: '<%= assetsbpAddressWrapperDistDir %>',
                        dest: '<%= distbpAddressWrapperDir %>/',
                        src: [
							'*.js',
							'*.css'
                        ]
                    }]
            }
        },
        eslint: {
            options: {
                configFile: 'eslint.json'
            },
            target: ['js/*.js']
        },
        browserSync: {
            dev: {
                bsFiles: {
                    src: [
						'/index.html',
                        'vendor/**/*.html',
						'vendor/**/*.js',
                        'vendor/**/*.css'						
                    ]
                },
                options: {
                    watchTask: true,
                    ghostMode: {
                        clicks: true,
                        scroll: true,
                        links: false,
                        // must be false to avoid interfering with angular routing
                        forms: true
                    },
                    server: { baseDir: './' }
                }
            }
        },
        watch: {
            options: { interrupt: true },
            js: {
                files: ['<%= assetsbpAddressDistDir %>/*.js','<%= assetsbpAddressWrapperDistDir %>/*.js'],
                tasks: ['package']
            },
            css: { files: ['<%= assetsbpAddressDistDir %>/*.css', '<%= assetsbpAddressWrapperDistDir %>/*.css'] }
        },
        connect: {
            test: {
                options: {
                    port: 8887,
                    base: '<%= assetsDir %>',
                    keepalive: false,
                    livereload: false,
                    open: false
                }
            }
        }
    });
	/*  ---------- old code ------------------  */
	grunt.registerTask("bom", function () {
    var buf = grunt.file.read("dist/bpAutoCompleteCore.js", { encoding: null });
    var BOM = new Buffer([0xEF, 0xBB, 0xBF]);

    // remove multi BOMs from Buffer
    var bufString = buf.toString('utf-8');
    bufString = bufString.replace(BOM.toString('utf-8'), null);
    buf = new Buffer(bufString, 'utf-8');

    // add new UTF-8 BOM to the beginning of the file buffer
    var bomFile = Buffer.concat([BOM, buf]);
    grunt.file.write("dist/bpAutoCompleteCore.js", bomFile, { encoding: 'utf-8' });
	/*  ---------- old code ------------------  */
});

    grunt.registerTask('ls', ['availabletasks']);
    grunt.registerTask('package', [
        'clean',
        'copy'
    ]);
    grunt.registerTask('ci', ['package']);
    grunt.registerTask('dev', [
        'browserSync',
        'watch'
    ]);

	grunt.registerTask('default', ['dev']);	
};
