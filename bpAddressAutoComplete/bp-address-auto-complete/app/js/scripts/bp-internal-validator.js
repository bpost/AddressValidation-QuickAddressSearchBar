angular.module('bpAddressAutoComplete').directive('bpInternalValidator', function(){
	'use strict';
	return {
		restrict: 'A',
		require: ['bpInternalValidator', 'bpAddressValidator'],
		controller: 'BpInternalValidatorController',
		link: function(scope, element, attrs, controllers){
			var BpInternalValidatorController = controllers[0];
			var BpAddressValidatorController = controllers[1];

			BpAddressValidatorController.getAITSuggestion = BpInternalValidatorController.getAITSuggestion;
			BpAddressValidatorController.prepareValidationData = BpInternalValidatorController.prepareValidationData;
		}
	};
});
