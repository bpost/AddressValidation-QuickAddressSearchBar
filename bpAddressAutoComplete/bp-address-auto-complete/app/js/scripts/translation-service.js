angular.module('bpAddressAutoComplete').service('TranslationService', function(LocaleService){
	"use strict";
	var translationsEn = {
		"bpaddressautocomplete": {
			"subl": "<em>%s</em> is a sub-municipality of <em>%s</em>",
			"missing-elements-1": "Please provide a %s.",
			"missing-elements-2": "Please provide a %s and a %s",
			"missing-elements-3": "Please provide a %s, a %s and a %s",
			"missing-elements-4": "Please provide a %s, a %s, a %s and a %s",
			"missing-elements-5": "Please provide a %s, a %s, a %s, a %s and a %s",
			"streetName": "street name",
			"houseNumber": "house number",
			"boxNumber": "box number",			
			"postalCode": "postal code",
			"municipalityName": "municipality",
			"address-not-found": "Address not recognized.",
			"address-validated": "The address has been validated",
			"input-placeholder": "Provide a location ...",
			"service-unavailable": "The service could not be reached. Please try again later."
		}
	};

	var translationsFr = {
		"bpaddressautocomplete": {
			"subl": "<em>%s</em> est une sous-commune de <em>%s</em>",
			"missing-elements-1": "Veuillez fournir %s.",
			"missing-elements-2": "Veuillez fournir %s et %s",
			"missing-elements-3": "Veuillez fournir %s, %s et %s",
			"missing-elements-4": "Veuillez fournir %s, %s, %s et %s",
			"missing-elements-5": "Veuillez fournir %s,%s, %s, %s et %s",
			"streetName": "un nom de rue",
			"houseNumber": "un numéro de maison",
			"boxNumber": "une boîte postale",
			"postalCode": "un code postal",
			"municipalityName": "un nom de commune",			
			"address-not-found": "Adresse non-reconnue.",
			"address-validated": "L'adresse a été validée.",
			"input-placeholder": "Fournir une adresse ...",
			"service-unavailable": "Le service n'est pas disponible, veuillez réessayer plus tard."
		}
	};

	var translationsNl = {
		"bpaddressautocomplete": {
			"subl": "<em>%s</em> is een deelgemeente van <em>%s</em>",
			"missing-elements-1": "Gelieve een %s op te geven.",
			"missing-elements-2": "Gelieve een %s en een %s op te geven.",
			"missing-elements-3": "Gelieve een %s, een %s en een %s op te geven.",
			"missing-elements-4": "Gelieve een %s, een %s, een %s en een %s op te geven.",
			"missing-elements-5": "Gelieve een %s, een %s, een %s, een %s en een %s op te geven.",
			"streetName": "straatnaam",
			"houseNumber": "huisnummer",
			"boxNumber": "postbus",
			"postalCode": "postcode",
			"municipalityName": "gemeente",
			"address-not-found": "Het adres werd niet herkend.",
			"address-validated": "Het adres werd gevalideerd.",
			"input-placeholder": "Voer een locatie in ...",
			"service-unavailable": "Er kon geen verbinding gemaakt worden. Probeer later opnieuw."
		}
	};

	var i18nPrefix = 'bpaddressautocomplete.';

	return {
		translate: translate
	};

	function getTranslationBundle(){
		if(LocaleService.isLocaleDutch()){
			return translationsNl;
		}
		if(LocaleService.isLocaleFrench()){
			return translationsFr;
		}
		return translationsEn;
	}

	function translate(key, options){
		if(typeof i18n !== 'undefined'){
			return i18n.t(i18nPrefix + key, options);
		}else{
			var translatedKey = getTranslationBundle().bpaddressautocomplete[key];
			if(options && options.postProcess === "sprintf" && options.sprintf){
				if(options.sprintf.constructor === Array){
					options.sprintf.forEach(function(repl){
						//Replace first match
						translatedKey = translatedKey.replace("%s", repl);
					});
				}else{
					translatedKey = translatedKey.replace("%s", options.sprintf);
				}
			}
			return translatedKey;
		}
	}
});