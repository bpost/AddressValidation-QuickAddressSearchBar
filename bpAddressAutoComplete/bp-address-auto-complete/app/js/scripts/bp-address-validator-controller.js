angular.module('bpAddressAutoComplete').controller('BpAddressValidatorController', function ($scope, $http) {
	'use strict';
	var controller = this;
	controller.prepareValidationData = prepareValidationData;
	controller.validateAddress = validateAddress;
	controller.getAITSuggestion = getAITSuggestion;
	controller.setParentController = setParentController;

	$scope.$on("bpAddressAutoComplete.validateAddress", validateAddress);

	var parentController;

	function setParentController(_parentController){
		parentController = _parentController;
	}

	function validateAddress(){
		if(!maySendRequestToAddressValidationService()){
			return;
		}
		var string = parentController.searchText;
		var body = controller.prepareValidationData(string);
		$http.post($scope.url, body, {headers: {
			'Content-Type': "application/json"
		}}).success(function (data) {
			var aitResponse = parseAitResponseObject(data);
			addAITSuggestion(aitResponse);
			parentController.clearConnectionErrorMessage();
		}).error(function () {
			parentController.setConnectionErrorMessage();
		});
		controller.skipNextBlur = true;
		parentController.moveCursorToLastCharacter();
	}

	function parseAitResponseObject(data){
		if(data && data.ValidateAddressesResponse && data.ValidateAddressesResponse.ValidatedAddressResultList &&
			data.ValidateAddressesResponse.ValidatedAddressResultList.ValidatedAddressResult &&
			angular.isArray(data.ValidateAddressesResponse.ValidatedAddressResultList.ValidatedAddressResult)){
			return data.ValidateAddressesResponse.ValidatedAddressResultList.ValidatedAddressResult[0];
		}else if(data && data.ValidateAddressesResponse && data.ValidateAddressesResponse.ValidatedAddressResultList
			&& data.ValidateAddressesResponse.ValidatedAddressResultList.ValidatedAddressResult){
			return data.ValidateAddressesResponse.ValidatedAddressResultList.ValidatedAddressResult;
		}
	}

	function getAITSuggestion(response){
		if(response && response.ValidatedAddressList && response.ValidatedAddressList.ValidatedAddress){
			var validatedAddressObj = response.ValidatedAddressList.ValidatedAddress;
		}
		var validatedPostalAddress;
		var addressLabel;
		var addressee;

		if(response && response.MaileeAndAddressee && response.MaileeAndAddressee.AddresseeIndividualIdentification &&
				response.MaileeAndAddressee.AddresseeIndividualIdentification.UnstructuredAddresseeIndividualIdentification){
			addressee = response.MaileeAndAddressee.AddresseeIndividualIdentification.UnstructuredAddresseeIndividualIdentification;
		}

		if(validatedAddressObj !== undefined){
			if(angular.isArray(validatedAddressObj) ){
				validatedPostalAddress = validatedAddressObj[0].PostalAddress;
				addressLabel = validatedAddressObj[0].Label;
			}else {
				validatedPostalAddress = validatedAddressObj.PostalAddress;
				addressLabel = validatedAddressObj.Label;
			}
		}


		if (validatedPostalAddress) {
			var aitSuggestion = {};
			if (validatedPostalAddress.StructuredDeliveryPointLocation) {
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('StreetName')) {
					aitSuggestion.streetName = validatedPostalAddress.StructuredDeliveryPointLocation.StreetName;
				}
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('StreetNumber')) {
					aitSuggestion.houseNumber = validatedPostalAddress.StructuredDeliveryPointLocation.StreetNumber;
				}
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('BoxNumber')) {
					aitSuggestion.boxNumber = validatedPostalAddress.StructuredDeliveryPointLocation.BoxNumber;
				}
			}
			if (validatedPostalAddress.StructuredPostalCodeMunicipality) {
				if (validatedPostalAddress.StructuredPostalCodeMunicipality.hasOwnProperty('MunicipalityName')) {
					aitSuggestion.municipalityName = validatedPostalAddress.StructuredPostalCodeMunicipality.MunicipalityName;
				}
				if (validatedPostalAddress.StructuredPostalCodeMunicipality.hasOwnProperty('PostalCode')) {
					aitSuggestion.postalCode = validatedPostalAddress.StructuredPostalCodeMunicipality.PostalCode;
				}
			}

			if(aitSuggestionContainsNoErrors(response)){
				aitSuggestion.isComplete = true;
			}
			addStringToSuggestion(aitSuggestion, addressLabel, addressee);
			return aitSuggestion;
		}
	}

	function aitSuggestionContainsNoErrors(response){
		if(response && response.Error){
			if(angular.isArray(response.Error)){
				return !response.Error.some(containsError);
			}else{
				return !containsError(response.Error);
			}
		}
		return true;
	}

	function containsError(warning){
		return !!(warning && warning.ErrorSeverity === 'error');
	}

	function addAITSuggestion(response) {
		var aitSuggestion = controller.getAITSuggestion(response);
		if(aitSuggestion && aitSuggestion.string && aitSuggestion.string.length > 0) {
			if (!suggestionListContainsAddress(aitSuggestion)) {
				parentController.suggestions.unshift(aitSuggestion);
			} else {
				parentController.moveAddressToTop(aitSuggestion);
			}
			parentController.highlightFirstSuggestionIfComplete();
			if(!aitSuggestion.isComplete){
				parentController.showAddressNotFoundMessage();
			}
		}else{
			parentController.showAddressNotFoundMessage();
		}
	}

	function suggestionListContainsAddress(address){
		return parentController.suggestions.some(function(suggestion){
			return parentController.suggestionsAreEqual(suggestion, address);
		});
	}

	function maySendRequestToAddressValidationService(){
		//return parentController.searchText && parentController.searchText.split(" ").length > 2;
		return true;
	}


	function addStringToSuggestion(suggestion, addressLabel, addressee){
		var string = "";
		if(addressLabel && addressLabel.hasOwnProperty('Line')){
			if(angular.isArray(addressLabel.Line)){
				addressLabel.Line.forEach(function(line){
					if(line !== addressee){
						if(string.length > 0){
							string = string + " - ";
						}
						string = string + line;
					}
				});
			}else{
				if(addressLabel.Line !== addressee){
					string = addressLabel.Line;
				}
			}
		}else{
			string = createString(suggestion);
		}

		if (string && string.length > 0) {
			suggestion.string = string;
		}
	}


	function createString(address){
		var result = "";
		if(address.hasOwnProperty('streetName')){
			result += address.streetName;
		}
		if(address.hasOwnProperty('houseNumber')){
			result += " " + address.houseNumber;
		}
		if(address.hasOwnProperty('boxNumber')){
			result += " BOX " + address.boxNumber;
		}
		if(result.length > 0){
			result += "  -  ";
		}
		if(address.hasOwnProperty('postalCode')){
			result += address.postalCode;
		}
		if(address.hasOwnProperty('postalCode') && address.hasOwnProperty('municipalityName')){
			result += " ";
		}
		if(address.hasOwnProperty('municipalityName')){
			result += address.municipalityName;
		}
		return result;
	}

	function prepareValidationData(address){
		return {
			"ValidateAddressesRequest": {
				"AddressToValidateList": {
					"AddressToValidate": {
						"@id": "1",
						"AddressBlockLines": {
							"UnstructuredAddressLine": [
								{
									"@locale": "nl",
									"*body": address
								}
							]
						},
						"DispatchingCountryISOCode": "BE",
						"DeliveringCountryISOCode": "BE"
					}
				},
				"ValidateAddressOptions": {
					"IncludeFormatting": "true",
					"IncludeSuggestions": "true"
				}
			}
		};
	}
});
