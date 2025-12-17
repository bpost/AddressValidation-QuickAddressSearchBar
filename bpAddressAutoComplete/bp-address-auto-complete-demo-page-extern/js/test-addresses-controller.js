angular.module('autocompleteDemoPageExtern').controller('TestAddressesController', function ($scope) {
	'use strict';

	var Urls = {
		'aacUrlAc' :  "https://api.mailops-np.bpost.cloud/roa-info-ac/externalMailingAddressProofingRest/autocomplete",
		'aacUrlSt' :  "https://api.mailops-np.bpost.cloud/roa-info-st2/externalMailingAddressProofingRest/autocomplete",
		'aacUrlPr' :  "https://api.mailops.bpost.cloud/roa-info/externalMailingAddressProofingRest/autocomplete",
		'valUrlAc' :  "https://api.mailops-np.bpost.cloud/roa-info-ac/externalMailingAddressProofingRest/validateAddresses",
		'valUrlSt' :  "https://api.mailops-np.bpost.cloud/roa-info-st2/externalMailingAddressProofingRest/validateAddresses",
		'valUrlPr' :  "https://api.mailops.bpost.cloud/roa-info/externalMailingAddressProofingRest/validateAddresses"
	};

	var apiKeys = {
		'apiKeyAc' :  "",
		'apiKeySt' :  "",
		'apiKeyPr' :  ""
	};

	$scope.selectedLevel = 2;
	$scope.selectedAddress = {};
	$scope.setToSt= setToSt;
	$scope.setToPr = setToPr;
	$scope.setToAc = setToAc;
    $scope.setLevel = setLevel;
	$scope.clearInput = clearInput;
	$scope.isSetToProduction = isSetToProduction;
	$scope.includeListOfBoxes = includeListOfBoxes;
    $scope.includeNisCode = includeNisCode;
    $scope.includeBusinessName = includeBusinessName;
    $scope.includeBusinessNameWithBoxes = includeBusinessNameWithBoxes;
	$scope.unstructuredAddress = "";
	$scope.streetName = "";
	$scope.houseNumber = "";
	$scope.boxNumber = "";
	$scope.postalCode = "";
	$scope.municipalityName	= "";
	$scope.addressparams = {"streetName":"","houseNumber":"","boxNumber":"","postalCode":"","municipalityName":"","state":"false"};
	$scope.prefillParams = prefillParams;
	$scope.prefillUnstructuredParams = prefillUnstructuredParams;
	$scope.clearPrefilledParams = clearPrefilledParams;
	$scope.clearPrefilledUnstructuredParams = clearPrefilledUnstructuredParams;
	$scope.selectedIncludeListOfBoxes = false;
    $scope.selectedIncludeNisCode = false;
    $scope.selectedIncludeBusinessName = false;
    $scope.selectIncludeBusinessNameWithBoxes = false;
	var environmentFunction;
	setToAc();
	prefillParams();

	function isSetToProduction(){
		return $scope.aacUrl === getUrlBundle().aacUrlPr;
	}
    function setLevel(lvl){
        $scope.selectedLevel = lvl;
    }
	function getUrlBundle ()  {
		return Urls;
	}
	function getApiKeyBundle() {
		return apiKeys;
	}
	function clearInput(focus){
		$scope.$broadcast('bpAddressAutoComplete.clearInput', focus);
	}
	function setToAc(){
		$scope.aacUrl = getUrlBundle().aacUrlAc;
		$scope.valUrl = getUrlBundle().valUrlAc;
		$scope.apiKey = getApiKeyBundle().apiKeyAc;
		$scope.environment = "ac";
		environmentFunction = setToAc;
	}
	function setToSt(){
		$scope.aacUrl = getUrlBundle().aacUrlSt;
		$scope.valUrl = getUrlBundle().valUrlSt;
		$scope.apiKey = getApiKeyBundle().apiKeySt;
		$scope.environment = "st";
		environmentFunction = setToSt;
	}
	function setToPr(){
		$scope.aacUrl = getUrlBundle().aacUrlPr;
		$scope.valUrl = getUrlBundle().valUrlPr;
		$scope.apiKey = getApiKeyBundle().apiKeyPr;
		$scope.environment = "pr";
		environmentFunction = setToPr;
	}
	function prefillParams(){
		$scope.addressparams.streetName=$scope.streetName;
		$scope.addressparams.houseNumber=$scope.houseNumber;
		$scope.addressparams.boxNumber=$scope.boxNumber;
		$scope.addressparams.postalCode=$scope.postalCode;
		$scope.addressparams.municipalityName=$scope.municipalityName;
		$scope.addressparams.unstructuredAddress="";
		$scope.addressparams.state = !$scope.addressparams.state;
	}
	function prefillUnstructuredParams(){
		$scope.addressparams.streetName="";
		$scope.addressparams.houseNumber="";
		$scope.addressparams.boxNumber="";
		$scope.addressparams.postalCode="";
		$scope.addressparams.municipalityName="";
		$scope.addressparams.unstructuredAddress=$scope.unstructuredAddress;
		$scope.addressparams.state = !$scope.addressparams.state;
	}
	function clearPrefilledParams(){
		$scope.streetName = "";
		$scope.houseNumber = "";
		$scope.boxNumber = "";
		$scope.postalCode = "";
		$scope.municipalityName	= "";
	}
	function clearPrefilledUnstructuredParams(){
		$scope.unstructuredAddress = "";
	}

	function includeListOfBoxes(includeListOfBoxes) {
        $scope.selectedIncludeListOfBoxes = includeListOfBoxes;
        let tempUrl = removeURLParameter($scope.aacUrl, 'IncludeListOfBoxes')
        $scope.aacUrl = tempUrl + getIncludeListOfBoxesQueryParam() + includeListOfBoxes;
    }
    function includeNisCode(includeNisCode){
        $scope.selectedIncludeNisCode = includeNisCode;
        let tempUrl = removeURLParameter($scope.aacUrl, 'includeNisCode')
        $scope.aacUrl = tempUrl + getIncludeNisCodeQueryParam() + includeNisCode;
    }

    function includeBusinessName(includeBusinessName){
        $scope.selectedIncludeBusinessName = includeBusinessName;
        let tempUrl = removeURLParameter($scope.aacUrl, 'includeBusinessName')
        $scope.aacUrl = tempUrl + getIncludeBusinessNameQueryParam() + includeBusinessName;
    }

    function includeBusinessNameWithBoxes(includeBusinessNameWithBoxes){
        $scope.selectIncludeBusinessNameWithBoxes = includeBusinessNameWithBoxes;
        let tempUrl = removeURLParameter($scope.aacUrl, 'includeListOfBusinessNamesWithBoxes')
        $scope.aacUrl = tempUrl + getIncludeBusinessNameWithBoxes() + includeBusinessNameWithBoxes;
    }

    function getIncludeListOfBoxesQueryParam() {
    	return ($scope.isInternal) ? "&IncludeListOfBoxes=" : "?IncludeListOfBoxes=";
    }
    function getIncludeNisCodeQueryParam() {
        return ($scope.includeNisCode) ? "&includeNisCode=" : "?includeNisCode=";
    }

    function getIncludeBusinessNameQueryParam() {
        return ($scope.includeBusinessName) ? "&includeBusinessName=" : "?includeBusinessName=";
    }

    function getIncludeBusinessNameWithBoxes() {
         return ($scope.includeBusinessName) ? "&includeListOfBusinessNamesWithBoxes=" : "?includeListOfBusinessNamesWithBoxes=";
    }

    function removeURLParameter(url, parameter) {
         var urlparts = url.split('?');
         if (urlparts.length >= 2) {
              var prefix = encodeURIComponent(parameter) + '=';
              var pars = urlparts[1].split(/[&;]/g);
              for (var i = pars.length; i-- > 0;) {
                   if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                        pars.splice(i, 1);
                   }
              }
              return urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
         }
         return url;
    }

});
