angular.module('bpAddressAutoComplete').service('LocaleService', function(){
	"use strict";
	return {
		isLocaleDutch: isPreferredLocale('nl'),
		isLocaleFrench: isPreferredLocale('fr'),
		isLocaleGerman: isPreferredLocale('de')
	};

	function isPreferredLocale(locale){
		return function(){
			return (window.navigator.userSelectedLanguage || window.navigator.userLanguage || window.navigator.language ).indexOf(locale) === 0;
		};
	}
});
