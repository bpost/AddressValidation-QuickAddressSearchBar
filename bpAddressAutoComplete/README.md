BpostAddressAutoComplete
==================
<img align="right" height="160" width="260" src="https://github.com/bpost/AddressValidation-QuickAddressSearchBar/blob/master/bpAddressAutoComplete/asb.png">

 <br/>

## Introduction
Whoever is interested to **use** the widget BpostAddressAutoComplete, and **include** it in a working page should follow the Usage section. 
 <br/>
Whoever is interested to **contribute** or do any **modifications** on the widget should follow the steps in the Development Prerequisites section and then in the Deployment section to generate the distributable files. 


## Usage (Include)
* Simply copy the files found in the **dist** folders of the vendor modules
 **bp-address-auto-complete**, and **bp-address-auto-complete-wrapper**
 and **include** them into the page.
<br/> The files to copy are *bp-address-auto-complete.js*, *bp-address-auto-complete.css*, 
 *bp-address-auto-complete-wrapper.js* and *bp-address-auto-complete-wrapper.css*. 
<br/> For conveniency they can be copied into distinct folders. 
 <br/>
* As an example the **bp-address-auto-complete-demo-page-extern** module is provided where the options minimum level, environment and prefilled parameters and their usage is demonstrated. 
The module can be deployed either on a local server (localhost) by following the steps in the **Development** section and running grunt on the **bp-address-auto-complete-demo-page-extern**   by command prompt, or be deployed on any web server (Bpost web site will be soon updated to publish the module external demo page).


## Usage
* Simply copy the files found in the **dist** folders of the vendor modules
 **bp-address-auto-complete**, and **bp-address-auto-complete-wrapper**
 and include them into the page.
<br/> The files to copy are *bp-address-auto-complete.js*, *bp-address-auto-complete.css*, 
 *bp-address-auto-complete-wrapper.js* and *bp-address-auto-complete-wrapper.css*. 
<br/> For conveniency they can be copied into distinct folders. 
* As an example the **bp-address-auto-complete-demo-page-extern** module is provided.
 

## Development
## Prerequisites
1. Install [node and npm](http://www.nodejs.org)
2. Install **Grunt** running `npm install -g grunt-cli` 
3. Install **Bower** running `npm install -g bower` 
4. Install local environment on **bp-address-auto-complete**, **bp-address-auto-complete-wrapper**
   and **bp-address-auto-complete-demo-page-extern** modules as follows: 
<br/>
  On command prompt cd to the current directory of each module and run `npm install --save-dev package_name`
    where ***package_name*** will be the following:
   <br/> 
 `grunt@0.4.1`, `load-grunt-tasks@0.2.0`, `grunt-angular-templates@0.5.7`, `grunt-available-tasks@0.4.2`, `grunt-bower-task@0.3.4`, `grunt-browser-sync@0.9.1`, `grunt-contrib-clean@0.5.0`, `grunt-contrib-concat@0.3.0`, `grunt-contrib-connect@0.5.0`, `grunt-contrib-copy@0.4.1`, `grunt-contrib-cssmin@0.7.0`, `grunt-contrib-jshint@0.7.2`, `grunt-contrib-uglify@0.2.7`, `grunt-contrib-watch@0.5.3`, `grunt-eslint@14.0.0`, `grunt-newer@0.6.0`, `grunt-ngmin@0.0.3`, `grunt-usemin@2.0.0`, `grunt-wiredep@1.7.0`. 
  
## Package for Deployment
## This concerns the modules bp-address-auto-complete, bp-address-auto-complete-wrapper
* On command prompt cd to the current directory of the module 
* Run `grunt package` to package your static assets for deployment.
* Your package will be generated in a `dist` folder and your javascripts and stylesheets will be concatenated, minified and versionned.
* `grunt` : launches `grunt package`. Use this task for continuous integration. 
<br/>
  When the `grunt` will be launched on **bp-address-auto-complete-demo-page-extern** module 
  where the static localhost server will be launched,
  then changes will be automatically distributed on the dist folders of that module.
  
## Deployment 
## This concerns the module bp-address-auto-complete-demo-page-extern
* On command prompt cd to the current directory of the module **bp-address-auto-complete-demo-page-extern**
* Run `grunt` to start a static web server and open your browser Live
* `jshint` and/or `csslint` will be running on your files when they change.
* With every change done on the other modules **bp-address-auto-complete** and **bp-address-auto-complete-wrapper** and running `grunt` on these modules,
  the changes are automatically distributed on the corresponding vendor folders of the **bp-address-auto-complete-demo-page-extern** module.
  
## Contributing

We welcome [contributions](https://github.com/bpost/AddressValidation-QuickAddressSearchBar/graphs/contributors).

Note that on Windows for tests to pass you need to configure Git before cloning:

```
git config --global core.autocrlf input
```

## License

License

Copyright (c) 2016 Bpost and [other contributors](https://github.com/bpost/AddressValidation-QuickAddressSearchBar/graphs/contributors)

Licensed under the MIT License
