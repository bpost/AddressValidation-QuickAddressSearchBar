angular.module('bpAddressAutoComplete').directive('caretControl', ['$timeout', function($timeout) {
	'use strict';
	return {
		restrict: 'A',
		controller: function () {

		},
		link: function (scope, element) {
			var input = element[0];
			scope.$on('move-caret', function (event, data) {
				$timeout(function () {
					if (input.setSelectionRange) {
						input.focus();
						input.setSelectionRange(data, data);
					}
					else if (input.createTextRange) {
						var range = input.createTextRange();
						range.collapse(true);
						range.moveEnd('character', data);
						range.moveStart('character', data);
						range.select();
					}
				});
			});
		}
	};
}]);

