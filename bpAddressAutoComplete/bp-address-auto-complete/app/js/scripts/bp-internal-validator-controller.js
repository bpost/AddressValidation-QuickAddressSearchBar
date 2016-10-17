angular.module('bpAddressAutoComplete').controller('BpInternalValidatorController', function(){
	'use strict';
	var controller = this;
	controller.getAITSuggestion = getAITSuggestion;
	controller.prepareValidationData = prepareValidationData;

	function getAITSuggestion(response){
		if(response && response['mpw:ValidatedAddressList'] && response['mpw:ValidatedAddressList']['mpw:ValidatedAddress']){
			var validatedAddressObj = response['mpw:ValidatedAddressList']['mpw:ValidatedAddress'];
		}
		var validatedPostalAddress;
		var addressLabel;
		var addressee;
		if(validatedAddressObj !== undefined){
			if(angular.isArray(validatedAddressObj) ){
				validatedPostalAddress = validatedAddressObj[0]['mpw:PostalAddress'];
				addressLabel = validatedAddressObj[0]['mpw:Label'];
			}else {
				validatedPostalAddress = validatedAddressObj['mpw:PostalAddress'];
				addressLabel = validatedAddressObj['mpw:Label'];
			}
		}
		if(response && response['mpw:MaileeAndAddressee'] && response['mpw:MaileeAndAddressee']['mpw:UnstructuredAddresseeIndividualIdentification']){
			addressee = response['mpw:MaileeAndAddressee']['mpw:UnstructuredAddresseeIndividualIdentification'];
		}

		if(validatedPostalAddress){
			var aitSuggestion = {};
			if(validatedPostalAddress['mpw:StructuredDeliveryPointLocation']){
				if(validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].hasOwnProperty('a3:StreetName')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].StreetName === ""){
					aitSuggestion.streetName = validatedPostalAddress['mpw:StructuredDeliveryPointLocation']['a3:StreetName']['*body'];
				}
				if(validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].hasOwnProperty('a3:StreetNumber')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].StreetNumber === ""){
					aitSuggestion.houseNumber = validatedPostalAddress['mpw:StructuredDeliveryPointLocation']['a3:StreetNumber'];
				}
				if(validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].hasOwnProperty('a3:BoxNumber')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].BoxNumber === ""){
					aitSuggestion.boxNumber = validatedPostalAddress['mpw:StructuredDeliveryPointLocation']['a3:BoxNumber'];
				}
				if(validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].hasOwnProperty('a3:StreetId')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].StreetId === ""){
					aitSuggestion.streetId = validatedPostalAddress['mpw:StructuredDeliveryPointLocation']['a3:StreetId'];
				}
			}
			if(validatedPostalAddress['mpw:StructuredPostalCodeMunicipality']){
				if(validatedPostalAddress['mpw:StructuredPostalCodeMunicipality'].hasOwnProperty('a3:MunicipalityName')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].MunicipalityName === ""
					&& validatedPostalAddress['mpw:StructuredPostalCodeMunicipality'].hasOwnProperty('a3:PostalCode')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].PostalCode === ""){
					aitSuggestion.municipalityName = validatedPostalAddress['mpw:StructuredPostalCodeMunicipality']['a3:MunicipalityName']['*body'];
					aitSuggestion.postalCode = validatedPostalAddress['mpw:StructuredPostalCodeMunicipality']['a3:PostalCode'];
				}
				if(validatedPostalAddress['mpw:StructuredPostalCodeMunicipality'].hasOwnProperty('a3:PostalAdministrativeAreaId')
					&& !validatedPostalAddress['mpw:StructuredDeliveryPointLocation'].PostalAdministrativeAreaId === ""){
					aitSuggestion.subMunicipalityId = validatedPostalAddress['mpw:StructuredPostalCodeMunicipality']['a3:PostalAdministrativeAreaId'];
				}
			}
			if(aitSuggestionContainsNoErrors(response)){
				aitSuggestion.isComplete = true;
			}
			addInternalIds(response, aitSuggestion);
			addDefaultSuffix(aitSuggestion);
			addStringToSuggestion(aitSuggestion, addressLabel, addressee);
			return aitSuggestion;
		}
	}

	function addInternalIds(response, aitSuggestion){
		var validatedAddress = response && response["mpw:ValidatedAddressList"] && response["mpw:ValidatedAddressList"]["mpw:ValidatedAddress"];
		if(angular.isArray(validatedAddress)){
			validatedAddress = validatedAddress[0];
		}
		if(!validatedAddress){
			return;
		}
		if(validatedAddress["pp:ServicePointId"]){
			if(validatedAddress["pp:ServicePointId"]["pp:PhysicalPointId"]){
				aitSuggestion.pdpId = validatedAddress["pp:ServicePointId"]["pp:PhysicalPointId"];
			}
			if(validatedAddress["pp:ServicePointId"]["pp:ServicePointSuffix"]){
				aitSuggestion.suffixId = validatedAddress["pp:ServicePointId"]["pp:ServicePointSuffix"];
			}
		}
	}

	/**
	 * The validate address service omits the default suffix.
	 */
	function addDefaultSuffix(aitSuggestion){
		if(!aitSuggestion.suffixId && aitSuggestion.isComplete && aitSuggestion.pdpId){
			aitSuggestion.suffixId = 0;
		}
	}

	function aitSuggestionContainsNoErrors(response){
		if(response && response['mpw:Error']){
			if(angular.isArray(response['mpw:Error'])){
				return !response['mpw:Error'].some(containsError);
			}else{
				return !containsError(response['mpw:Error']);
			}
		}
		return true;
	}

	function containsError(warning){
		return !!(warning && warning['mpw:ErrorSeverity'] === 'error');
	}

	function prepareValidationData(address){
		return {
			"ValidateAddressesRequest": {
				"AddressToValidateList": {
					"AddressToValidate": {
						"@id": "1",
						"mpw:AddressBlockLines": {
							"a3:UnstructuredAddressLine": [
								{
									"@locale": "nl",
									"*body": address
								}
							]
						},
						"mpw:DispatchingCountryISOCode": "BE",
						"mpw:DeliveringCountryISOCode": "BE"
					}
				},
				"ValidateAddressOptions": {
					"mpw:IncludeFormatting": "true",
					"mpw:IncludeSuggestions": "true",
					"mpw:IncludeForwardingAddress": "false",
					"mpw:IncludeSubmittedAddress": "false",
					"mpw:AddressDetailProjections": {
						"mpw:IncludeStreetId": "true"
					},
					"mpw:PostalAdministrativeAreaProjections": {
						"mpw:IncludePostalAdministrativeAreaId": "true"
					}
				},
				"mpw:CallerIdentification": {
					"mpw:CallerName": "Casper"
				}
			}
		};
	}

	function addStringToSuggestion(suggestion, addressLabel, addressee){
		var string = "";
		if(addressLabel && addressLabel.hasOwnProperty('mpw:Line')){
			if(angular.isArray(addressLabel['mpw:Line'])){
				addressLabel['mpw:Line'].forEach(function(line){
					if(line !== addressee){
						if(string.length > 0){
							string = string + " - ";
						}
						string = string + line;
					}
				});
			}else{
				if(addressLabel['mpw:Line'] !== addressee) {
					string = addressLabel['mpw:Line'];
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
});
