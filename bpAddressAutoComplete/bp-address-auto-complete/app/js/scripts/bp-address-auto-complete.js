angular.module('bpAddressAutoComplete').directive('bpAddressAutoComplete', ['$templateCache', function($templateCache){
	'use strict';
	return {
		restrict: 'AE',
		require: ['bpAddressAutoComplete', '^ngModel'],
		transclude: true,
		scope: {
			url: '@url',
			name: '@',
			minLevel: '@',
			bpAddressparams: '@'
		},
		template: $templateCache.get('views/addressautocomplete-template.html'),
		controller: "BpAddressAutoCompleteController",
		controllerAs: "aac",
		link: function(scope, element, attrs, controllers){
			if (scope.name) {
				scope.$parent[scope.name + 'AddressAutoComplete'] = controllers[0];
			}
			scope.setSelectedAddress = controllers[1].$setViewValue;

			scope.bpAddressparams = scope.$parent.bpAddressparams;

			scope.clearSelectedAddress = function(){
				scope.setSelectedAddress(null);
			};
			attrs.$observe("bpAddressparams", function(value){	
				if (value){
					var jsonObj = JSON.parse(value);
					var searchStr = controllers[0].loadParams(jsonObj);				
					controllers[0].searchText = searchStr;
					controllers[0].bpTypeAhead = "";
					controllers[0].showMissingElements(jsonObj);
					controllers[0].getTopSuggestions();
				}
			});			
		}
	};
}]);