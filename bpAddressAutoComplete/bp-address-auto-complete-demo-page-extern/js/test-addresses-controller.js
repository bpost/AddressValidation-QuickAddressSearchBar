angular.module('autocompleteDemoPageExtern').controller('TestAddressesController', function ($scope) {
	'use strict';

	var Urls = {
		'aacUrlAc1' :  "https://webservices-pub.acbpost.be/ws/ExternalMailingAddressProofingCSREST_v1_AC1/address/autocomplete",
		'aacUrlAc2' :  "https://webservices-pub.acbpost.be/ws/ExternalMailingAddressProofingCSREST_v1/address/autocomplete",
		'aacUrlPr' :  "https://webservices-pub.bpost.be/ws/ExternalMailingAddressProofingCSREST_v1/address/autocomplete",
		'valUrlAc1' : "https://webservices-pub.acbpost.be/ws/ExternalMailingAddressProofingCSREST_v1_AC1/address/validateAddresses",
		'valUrlAc2' : "https://webservices-pub.acbpost.be/ws/ExternalMailingAddressProofingCSREST_v1/address/validateAddresses",
		'valUrlPr' :  "https://webservices-pub.bpost.be/ws/ExternalMailingAddressProofingCSREST_v1/address/validateAddresses"
	};

	$scope.selectedLevel = 2;
	$scope.selectedAddress = {};
	$scope.setToAc2 = setToAc2;
	$scope.setToPr = setToPr;
	$scope.setToAc1 = setToAc1;
    $scope.setLevel = setLevel;
	$scope.clearInput = clearInput;
	$scope.isSetToProduction = isSetToProduction;
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
	$scope.clearPrefilledUnstructuredParams = clearPrefilledUnstructuredParams
	var environmentFunction;
	setToAc1();
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
	function clearInput(focus){
		$scope.$broadcast('bpAddressAutoComplete.clearInput', focus);
	}
	function setToAc1(){
		$scope.aacUrl = getUrlBundle().aacUrlAc1;
		$scope.valUrl = getUrlBundle().valUrlAc1;
		$scope.environment = "ac1";
		environmentFunction = setToAc1;
	}
	function setToAc2(){
		$scope.aacUrl = getUrlBundle().aacUrlAc2;
		$scope.valUrl = getUrlBundle().valUrlAc2;
		$scope.environment = "ac2";
		environmentFunction = setToAc2;
	}
	function setToPr(){
		$scope.aacUrl = getUrlBundle().aacUrlPr;
		$scope.valUrl = getUrlBundle().valUrlPr;
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
});
