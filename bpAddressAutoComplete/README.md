ngBpostAddressAutoCompleteDemoPage
==================

## Usage
* Simply take the files found in the dist folders of the vendor bp-address-auto-complete and bp-address-auto-complete-wrapper modules
* (bp-address-auto-complete.js, bp-address-auto-complete.css, bp-address-auto-complete-wrapper.js, bp-address-auto-complete-wrapper.css) 
* and include them into the page.

## Development
## Prerequisites
1. Install [node and npm](http://www.nodejs.org)
2. Install **Grunt** running `npm install -g grunt-cli` 
3. Install **Bower** running `npm install -g bower` 
4. Install Local Environment on bp-address-auto-complete, bp-address-auto-complete-wrapper and bp-address-auto-complete-demo-page modules repeating the next steps:

On command prompt cd to the current directory of the module 
5.  Run npm install --save-dev grunt@0.4.1
6.  Run npm install --save-dev load-grunt-tasks@0.2.0
7.  Run npm install --save-dev grunt-angular-templates@0.5.7
8.  Run npm install --save-dev  grunt-available-tasks@0.4.2
9.  Run npm install --save-dev grunt-bower-task@0.3.4
10. Run npm install --save-dev grunt-browser-sync@0.9.1
11. Run npm install --save-dev grunt-contrib-clean@0.5.0
12. Run npm install --save-dev grunt-contrib-concat@0.3.0
13. Run npm install --save-dev grunt-contrib-connect@0.5.0
14. Run npm install --save-dev grunt-contrib-copy@0.4.1
15. Run npm install --save-dev grunt-contrib-cssmin@0.7.0
16. Run npm install --save-dev grunt-contrib-jshint@0.7.2
17. Run npm install --save-dev grunt-contrib-uglify@0.2.7
18. Run npm install --save-dev grunt-contrib-watch@0.5.3
19. Run npm install --save-dev grunt-eslint@14.0.0
20. Run npm install --save-dev grunt-newer@0.6.0
21. Run npm install --save-dev grunt-ngmin@0.0.3
22. Run npm install --save-dev grunt-usemin@2.0.0
23. Run npm install --save-dev grunt-wiredep@1.7.0


## Package for Deployment
## This concerns the modules bp-address-auto-complete, bp-address-auto-complete-wrapper
* On command prompt cd to the current directory of the module 
* Run `grunt package` to package your static assets for deployment.
* Your package will be generated in a `dist` folder and your javascripts and stylesheets will be concatenated, minified and versionned.
* `grunt` : launches `grunt package`. Use this task for continuous integration. 
  When the 'grunt' has been launched on bp-address-auto-complete-demo-page module 
  and the static localhost server has been launched,
  then changes are automatically distributed on the dist of the bp-address-auto-complete vendor.
  
## Deployment 
## This concerns the module bp-address-auto-complete-demo-page
* On command prompt cd to the current directory of the module bp-address-auto-complete-demo-page
* Run `grunt` to start a static web server and open your browser.
* Livereload will be automatically active meaning that you can see your modification on the browser without hitting F5.
* `jshint` and/or `csslint` will be run on your files when they change.
* When running 'grunt' on the other modules bp-address-auto-complete and bp-address-auto-complete-wrapper,
  the changes are automatically distributed on the dist folder of the corresponding vendor folders.
