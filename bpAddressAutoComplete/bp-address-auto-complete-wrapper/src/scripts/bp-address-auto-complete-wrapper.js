angular.module('bpAddressAutoCompleteWrapper').directive('bpAddressAutoCompleteWrapper', function ($templateCache) {
    "use strict";
    return {
        restrict: 'AE',
        require: 'ngModel',
        transclude: true,
        scope: {
            url: '@',
            minLevel: '@',
            bpAddressparams: '@'
        },
        template: $templateCache.get('views/address-auto-complete-wrapper.html'),
        link: function (scope, element, attrs, ctrl) {

            scope.showValidationIcon = function(){
                return ctrl.$viewValue && ctrl.$viewValue.string;
            };

            scope.$watch(function () {
                return scope.wrappedAddressAutoComplete.suggestionValidationMessage;
            }, function (validationMessage) {
                scope.validationMessage = validationMessage;
            });
        }
    };
});
