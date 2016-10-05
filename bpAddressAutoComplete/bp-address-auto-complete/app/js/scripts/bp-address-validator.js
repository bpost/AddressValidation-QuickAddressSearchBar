angular.module('bpAddressAutoComplete').directive('bpAddressValidator', ['$templateCache', function($templateCache){
	'use strict';
	return {
		restrict: 'AE',
		require: ['bpAddressValidator', '^bpAddressAutoComplete'],
		scope: {
			url: '@url'
		},
		template: $templateCache.get('views/address-validator.html'),
		controller: "BpAddressValidatorController",
		controllerAs: "vm",
		link: function(scope, element, attrs, controllers){
			controllers[0].setParentController(controllers[1]);
		}
	};
}]);
