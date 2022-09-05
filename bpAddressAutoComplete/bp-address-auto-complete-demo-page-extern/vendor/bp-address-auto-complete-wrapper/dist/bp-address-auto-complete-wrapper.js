angular.module('bpAddressAutoCompleteWrapper', [
    'bpAddressAutoComplete'
]);

angular.module('bpAddressAutoCompleteWrapper').directive('bpAddressAutoCompleteWrapper', function ($templateCache) {
    "use strict";
    return {
        restrict: 'AE',
        require: 'ngModel',
        transclude: true,
        scope: {
            url: '@',
            apiKey: '@',
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

angular.module('bpAddressAutoCompleteWrapper').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/address-auto-complete-wrapper.html',
    "<div>\r" +
    "\n" +
    "    <div class=\"bpaac-dropdown-validation\"><div class=\"bpaac-validated-icon\" ng-show=\"showValidationIcon()\"></div>\r" +
    "\n" +
    "        {{validationMessage}}\r" +
    "\n" +
    "    </div>\r" +
    "\n" +
    "    <bp-address-auto-complete name=\"wrapped\" url=\"{{url}}\" api-key=\"{{apiKey}}\" min-level=\"{{minLevel}}\"  bp-addressparams=\"{{bpAddressparams}}\">\r" +
    "\n" +
    "        <div ng-transclude></div>\r" +
    "\n" +
    "    </bp-address-auto-complete>\r" +
    "\n" +
    "</div>\r" +
    "\n"
  );

}]);
