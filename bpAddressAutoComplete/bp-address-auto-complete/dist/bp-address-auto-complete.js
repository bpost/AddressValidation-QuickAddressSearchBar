angular.module('bpAddressAutoComplete', ['ngSanitize']);



angular.module('bpAddressAutoComplete').controller('BpAddressAutoCompleteController', function ($scope, $http, UnicodeService, LocaleService, TranslationService) {
	'use strict';

	var controller = this;
	// instance methods
	controller.onInputChange = onInputChange;
	controller.mayShowClearButton = mayShowClearButton;
	controller.checkKeyDown = checkKeyDown;
	controller.getTranslatedMessages = getTranslatedMessages;
	controller.clearInput = clearInput;
	controller.mayShowDropdown = mayShowDropdown;
	controller.getTopSuggestions = getTopSuggestions;
	controller.clickSuggestion = clickSuggestion;
	controller.highlightFirstSuggestionIfComplete = highlightFirstSuggestionIfComplete;
	controller.moveAddressToTop = moveAddressToTop;
	controller.suggestionsAreEqual = suggestionsAreEqual;
	controller.onBlur = onBlur;
	controller.onFocus = onFocus;
	controller.moveCursorToLastCharacter = moveCursorToMissingElementOrLastCharacter;
	controller.retranslate = retranslate;
	controller.showAddressNotFoundMessage = showAddressNotFoundMessage;
	controller.loadParams = loadParams;		
	controller.showMissingElements = showMissingElements;
	// instance properties
	controller.addressIsValidated = false;
	controller.suggestionValidationMessage = "";
	controller.suggestions = [];
	controller.previousIndex = -1;
	controller.lastSearchValue = "";
	controller.wordList = [];
	controller.suggestionsWordList = [];
	controller.bpTypeAhead = "";
	controller.placeHolderText = "";
	controller.skipNextBlur = false; // OnBlur is triggered when the user clicks suggestion/validator button
	controller.errorCode = null;
	controller.clearConnectionErrorMessage = clearConnectionErrorMessage;
	controller.setConnectionErrorMessage = setConnectionErrorMessage;
	controller.suggestionMouseLeave = suggestionMouseLeave;
	// scope properties
	$scope.selectedIndex = -1;
	$scope.$on("bpAddressAutoComplete.clearInput", onClearInputEvent);

	// private properties
	var typeAheadWord = "";
	var collapseDropdown = false;
	var sequenceNumber = 0;
	var consumedNumber = 0;
	var ADDRESSLEVEL = {
		"PHYSICALPOINT": 2,
		"SUFFIX": 1, // Only supported when internal IDs are provided
		"STREET": 3,
		"MUNICIPALITY": 4
	};
	var validationMessageCode = null;
	var validationMessageOptions = null;
	var missingElementCursorPosition = null;

	// initialization
	setSearchText("");
	setPlaceHolderText();
	$scope.$on("language-changed", retranslate);

	function onClearInputEvent(event, focus){
		clearInput(focus);
	}

	function retranslate(){
		setPlaceHolderText();
		if(controller.errorCode){
			setValidationMessage(controller.errorCode);
		}else{
			if(validationMessageCode){
				setValidationMessage(validationMessageCode, validationMessageOptions, true);
			}
		}
	}

	function setPlaceHolderText(){
		controller.placeHolderText = TranslationService.translate('input-placeholder');
	}

	function onBlur(){
		if(controller.skipNextBlur){
			controller.skipNextBlur = false;
		}else{
			collapseDropdown = true;
		}
	}

	function onFocus(){
		collapseDropdown = false;
		controller.skipNextBlur = false;
	}

	function mayShowDropdown() {
		return controller.suggestions.length > 0 && !collapseDropdown;
	}

	function buildInputWordList() {
		controller.wordList = controller.searchText.split(/[\s, ]+/);
	}

	function mayAddTypeAhead() {
		if (controller.searchText.length === 0) {
			return false;
		}
		return (/[^\s, \\\/]$/).test(controller.searchText);
	}

	function moveAddressToTop(address){
		for( var i = 0; i < controller.suggestions.length; i++){
			if(suggestionsAreEqual(controller.suggestions[i], address)){
				var aacAddress = controller.suggestions[i];
				controller.suggestions.splice(i, 1);
				controller.suggestions.unshift(aacAddress);
				return;
			}
		}
	}

	function suggestionsAreEqual(sug1, sug2){
		return !(suggestionFieldsAreDifferent(sug1, sug2, 'streetName') || suggestionFieldsAreDifferent(sug1, sug2, 'houseNumber')
		|| suggestionFieldsAreDifferent(sug1, sug2, 'boxNumber') || suggestionFieldsAreDifferent(sug1, sug2, 'municipalityName')
		|| suggestionFieldsAreDifferent(sug1, sug2, 'postalCode') || suggestionFieldsAreDifferent(sug1, sug2, 'name'));
	}

	function suggestionFieldsAreDifferent(sug1, sug2, field){
		if(sug1.hasOwnProperty(field) || sug2.hasOwnProperty(field)){
			if(sug1[field] !== sug2[field] && parseInt(sug1[field]) !== parseInt(sug2[field])){
				return true;
			}
		}
		return false;
	}

	function buildTypeAhead() {
		if (!mayAddTypeAhead()) {
			return;
		}
		var searchTextWords = controller.searchText.split(/[\s, ]+/);
		var lastWord = searchTextWords[searchTextWords.length - 1];

		if (controller.suggestions.some(function (sug) {
				if(!sug || !sug.hasOwnProperty('string')){
					return false;
				}
				return sug.string.split(/[\s-]+/).some(function (word) {
					if (stringStartsWithIgnoreDiacritics(word, lastWord)) {
						typeAheadWord = word;
						return true;
					}
				});
			})) {
			var appendix = typeAheadWord.slice(lastWord.length, typeAheadWord.length).toLowerCase();
			controller.bpTypeAhead = controller.searchText + appendix;
		}
	}

	function stringStartsWithIgnoreDiacritics(string, prefix) {
		return UnicodeService.removeDiacritics(string).slice(0, prefix.length).toLowerCase().indexOf(UnicodeService.removeDiacritics(prefix)) !== -1;
	}

	function getTopSuggestions() {
		sequenceNumber += 1;
		var config = {
			'url': $scope.url,
			'method': 'GET',
			'headers': {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			'params': {
				'q': controller.searchText,
				'id': sequenceNumber
			}
		};

		$http(config)
			.success(function (data) {
				if (data && data.response && data.response.sequenceNumber && data.response.sequenceNumber >= consumedNumber && data.response.topSuggestions) {
					consumedNumber = data.response.sequenceNumber;
					clearSuggestions();
					parseTopSuggestions(data.response.topSuggestions);
					buildTypeAhead();
					clearConnectionErrorMessage();
				}
			}).error(function () {
				setConnectionErrorMessage();
			});
	}

	function setConnectionErrorMessage(){
		controller.errorCode = "service-unavailable";
		setValidationMessage(controller.errorCode);
	}
	function clearConnectionErrorMessage(){
		if(controller.errorCode){
			if(controller.suggestionValidationMessage === TranslationService.translate(controller.errorCode)){
				clearSuggestionValidationMessage();
			}
			controller.errorCode = null;
		}
	}

	function parseTopSuggestions(topSuggestions) {
		if(topSuggestions.constructor === Array){
			topSuggestions.forEach(parseSingleSuggestion);
		}else{
			parseSingleSuggestion(topSuggestions);
		}
	}

	function parseSingleSuggestion(suggestion){
		var suggestionToAdd;
		if (LocaleService.isLocaleFrench() && suggestion.hasOwnProperty('french')) {
			suggestionToAdd = suggestion.french;
		} else if (LocaleService.isLocaleDutch() && suggestion.hasOwnProperty('dutch')) {
			suggestionToAdd = suggestion.dutch;
		} else if (LocaleService.isLocaleGerman() && suggestion.hasOwnProperty('german')) {
			suggestionToAdd = suggestion.german;
		} else if (suggestion.hasOwnProperty('address')) {
			suggestionToAdd = suggestion.address;
		}
		if(suggestionToAdd){
			if(suggestion.messages){
				suggestionToAdd.messages = suggestion.messages;
			}
			controller.suggestions.push(suggestionToAdd);
		}
	}
	
	function onInputChange() {
		collapseDropdown = false;
		resetArrowSelectedIndex();
		clearSelectedAddress();
		clearSuggestionValidationMessage();
		missingElementCursorPosition = null;
		if (controller.searchText === "") {
			sequenceNumber += 1;
			consumedNumber = sequenceNumber;
			clearSuggestions();
			controller.wordList = [];
		} else {
			controller.getTopSuggestions();
		}
		buildInputWordList();
	}

	function clickSuggestion(event, suggestion) {
		var continueChecks = false;
		event.preventDefault();
		clearTypeAhead();
		resetArrowSelectedIndex();
		//when selecting municipality + postal code, add one space in the beginning
		if(suggestion.hasOwnProperty("postalCode")	&& suggestion.hasOwnProperty("municipalityName") 
			&& !suggestion.hasOwnProperty("streetName") && !suggestion.hasOwnProperty("houseNumber") 
				&& !suggestion.hasOwnProperty("boxNumber")){					
			setSearchText(" " + suggestion.string);
			continueChecks = true;
		}

		missingElementCursorPosition = null;

		if (addressIsComplete(suggestion)) {	
			if (!continueChecks){			
				setSearchText(suggestion.string); 
			}		
			collapseDropdown = true;
			showAddressIsValidated();
			$scope.setSelectedAddress(suggestion);
			$scope.$emit('bpAddressAutoComplete.addressSelected');
		} else {
			if (!continueChecks){
				if (suggestion.hasOwnProperty("streetName") && suggestion.hasOwnProperty("houseNumber")){
					setSearchText(suggestion.searchBarString);
				}else {
					setSearchText(suggestion.string); 
				}
			}
			controller.skipNextBlur = true;
			clearSelectedAddress();
			showMissingElements(suggestion);
		}
	}

	function clearSelectedAddress(){
		$scope.clearSelectedAddress();
		controller.addressIsValidated = false;
	}

	function loadParams(params){
		var concatStr = "";
		var newJsonObj = params;
		var leastone = false;      //used for one space in case the municipality is missing
		if (params.hasOwnProperty("unstructuredAddress") && params.unstructuredAddress) {
			concatStr = params.unstructuredAddress;
			delete newJsonObj.streetName;
			delete newJsonObj.houseNumber;
			delete newJsonObj.boxNumber;
			delete newJsonObj.postalCode;
			delete newJsonObj.municipalityName;
			delete newJsonObj.postalCode;
		}else {
			delete newJsonObj.unstructuredAddress;
			if (params.hasOwnProperty("streetName") && params.streetName){
				leastone = true;
				concatStr = params.streetName;
			} else {
				delete newJsonObj.streetName;
			}
			if (params.hasOwnProperty("houseNumber") && params.houseNumber){
				leastone = true;
				concatStr += " " + params.houseNumber;
			}else {
				delete newJsonObj.houseNumber;
			}
			if (params.hasOwnProperty("boxNumber") && params.boxNumber){
				leastone = true;
				if (!params.houseNumber && getMinimumAddressLevel() < ADDRESSLEVEL.STREET){
					concatStr += "  BOX " + params.boxNumber; // extra space for the missing element
				}else{
					concatStr += " BOX " + params.boxNumber;
				}
			}else {
				delete newJsonObj.boxNumber;	
			}
			if (params.streetName || params.houseNumber || params.boxNumber || (params.hasOwnProperty('postalCode') && params.postalCode) || (params.hasOwnProperty('municipalityName') && params.municipalityName)){
				concatStr += "  -  ";
			}
			if(params.hasOwnProperty('postalCode') && params.postalCode){
				leastone = true;			
				concatStr += params.postalCode;
			}else {
				delete newJsonObj.postalCode;
			}
			if(params.hasOwnProperty('municipalityName') && params.municipalityName){
				concatStr += " " + params.municipalityName;
			}else {
				if (leastone) {
					concatStr += " ";
				}
				delete newJsonObj.municipalityName;	
			}
		}
		params = newJsonObj;
		return concatStr;
	}

	function showMissingElements(suggestion) {
		var cursorPosition;
		if (!suggestion) {
			return;
		}
		var missingElements = [];
				
		if(!suggestion.hasOwnProperty("unstructuredAddress") && !suggestion.hasOwnProperty("unstructuredAddress") 
			&& !suggestion.hasOwnProperty("streetName") && !suggestion.hasOwnProperty("houseNumber") 
			&& !suggestion.hasOwnProperty("postalCode") && !suggestion.hasOwnProperty("boxNumber") 
			&& !suggestion.hasOwnProperty("postalCode") && !suggestion.hasOwnProperty("municipalityName")){
			controller.suggestionValidationMessage = "";
			$scope.$broadcast('move-caret', 0);
			return;
		}

		if(suggestion.hasOwnProperty("unstructuredAddress")){
			controller.suggestionValidationMessage = "";
			cursorPosition = suggestion.unstructuredAddress.length;
			$scope.$broadcast('move-caret', cursorPosition);
			return;
		}

		if (!suggestion.hasOwnProperty("streetName") && getMinimumAddressLevel() <= ADDRESSLEVEL.STREET) {
			missingElements.push("streetName");
		}
		if (!suggestion.hasOwnProperty("houseNumber") && getMinimumAddressLevel() <= ADDRESSLEVEL.PHYSICALPOINT) {
			missingElements.push("houseNumber");
		}
		if(getMinimumAddressLevel() === ADDRESSLEVEL.SUFFIX && !suggestion.hasOwnProperty('boxNumber') ){
			missingElements.push("boxNumber");
		}		
		if (!suggestion.hasOwnProperty("postalCode")) {
			missingElements.push("postalCode");
		}
		if (!suggestion.hasOwnProperty("municipalityName")) {
			missingElements.push("municipalityName");
		}

		if (missingElements.length === 0) {
			controller.suggestionValidationMessage = "";
			//return;
		}

		var translatedCode = "missing-elements-" + missingElements.length;
		var translatedElements = [];
		missingElements.forEach(function (element) {
				translatedElements.push(TranslationService.translate(element));
			}
		);

		setValidationMessage(translatedCode, {
			postProcess: 'sprintf',
			sprintf: translatedElements,
			"untranslated-sprintf": missingElements
		});
		cursorPosition = calculateNewCursorPosition(suggestion);
		missingElementCursorPosition = cursorPosition;
		$scope.$broadcast('move-caret', cursorPosition);
	}
	function setValidationMessage(translationCode, options, retranslateOptions){
		validationMessageOptions = options;
		if(retranslateOptions && angular.isArray(validationMessageOptions["untranslated-sprintf"]) && validationMessageOptions.sprintf){
			var translatedElements = [];
			validationMessageOptions["untranslated-sprintf"].forEach(function (element) {
					translatedElements.push(TranslationService.translate(element));
				}
			);
			validationMessageOptions.sprintf = translatedElements;
		}
		validationMessageCode = translationCode;
		controller.suggestionValidationMessage = TranslationService.translate(validationMessageCode, validationMessageOptions);
	}

	function calculateNewCursorPosition(address) {
		var partialAddress = "";
		if (address.hasOwnProperty('unstructuredAddress')){
			return address.unstructuredAddress.length;
		}

		if (address.hasOwnProperty('streetName')) {
			partialAddress += address.streetName;
		} else {
			return 0;
		}

		if(getMinimumAddressLevel() <= ADDRESSLEVEL.PHYSICALPOINT){
			if(!address.hasOwnProperty('houseNumber') && !address.hasOwnProperty('houseNumber')){
				return partialAddress.length + 1;
			}else if (address.hasOwnProperty('houseNumber') && address.houseNumber) {
				partialAddress += " " + address.houseNumber;
			} 
		}else if(address.hasOwnProperty('houseNumber') && address.houseNumber) {
			partialAddress += " " + address.houseNumber;
		}

		if(getMinimumAddressLevel() === ADDRESSLEVEL.SUFFIX){
			if(!address.hasOwnProperty('boxNumber') && !address.boxNumber){
				return partialAddress.length + 5;
			}else if(address.hasOwnProperty('boxNumber') && address.boxNumber) {
				partialAddress += " BOX " + address.boxNumber;
			}
		}else if(address.hasOwnProperty('boxNumber') && address.boxNumber) {
				partialAddress += " BOX " + address.boxNumber;
		}

		partialAddress += "  -  ";
		if (address.hasOwnProperty('postalCode')) {
			partialAddress += address.postalCode + " ";
		} else {
			return partialAddress.length;
		}
		if (address.hasOwnProperty('municipalityName')) {
			partialAddress += address.municipalityName;
		} else { 
			return partialAddress.length + 1;
		}
		return partialAddress.length;
	}

	function moveCursorToMissingElementOrLastCharacter(){
		var charPosition = missingElementCursorPosition || controller.searchText.length;
		$scope.$broadcast('move-caret', charPosition);
	}

	function addressIsComplete(suggestion) {
		if(getMinimumAddressLevel() === ADDRESSLEVEL.PHYSICALPOINT) {
			return (suggestion.isComplete || (suggestion
				&& suggestion.hasOwnProperty("streetName")
				&& suggestion.hasOwnProperty("municipalityName")
				&& suggestion.hasOwnProperty("postalCode")
				&& suggestion.hasOwnProperty("houseNumber")));
		}else if(getMinimumAddressLevel() === ADDRESSLEVEL.SUFFIX){
			return (suggestion.isComplete || (suggestion
				&& suggestion.hasOwnProperty("streetName")
				&& suggestion.hasOwnProperty("municipalityName")
				&& suggestion.hasOwnProperty("postalCode")
				&& suggestion.hasOwnProperty("houseNumber") 
				&& suggestion.hasOwnProperty("boxNumber")));
		}else if(getMinimumAddressLevel() === ADDRESSLEVEL.STREET){
			return (suggestion.isComplete || (suggestion
				&& suggestion.hasOwnProperty("streetName")
				&& suggestion.hasOwnProperty("municipalityName")
				&& suggestion.hasOwnProperty("postalCode")));
		}else if(getMinimumAddressLevel() === ADDRESSLEVEL.MUNICIPALITY){
			return (suggestion.isComplete || (suggestion
				&& suggestion.hasOwnProperty("municipalityName")
				&& suggestion.hasOwnProperty("postalCode")));
		}
	}

	function getMinimumAddressLevel(){
		var minLevelInt = parseInt($scope.minLevel);
		//If minLevel attribute is not provided, default is physical point
		if(isNaN(minLevelInt)){
			return 2;
		}
		return minLevelInt;
	}

	function showAddressIsValidated() {
		controller.addressIsValidated = true;
		setValidationMessage('address-validated');
	}

	function checkKeyDown(event) {
		if (event.keyCode === 40) { //down key, increment selectedIndex
			event.preventDefault();
			moveArrowSelectedIndexDown();
		}
		else if (event.keyCode === 38) { //up key, decrement selectedIndex
			event.preventDefault();
			moveArrowSelectedIndexUp();
		} else if (event.keyCode === 39) { // right arrow key
			if (cursorIsOnSuggestionList()) {
				controller.clickSuggestion(event, controller.suggestions[$scope.selectedIndex]);
				event.preventDefault();
			} else {
				if (typeAheadWord && typeAheadIsShown()) {
					setSearchText(controller.bpTypeAhead);
					typeAheadWord = "";
					event.preventDefault();
				}
			}			
		} else if (event.keyCode === 9) { //tab key
			selectFirstInListOfSuggesions();			
		} else if (event.ctrlKey === true && event.keyCode === 46) {
			clearWidget();
		} else if (event.keyCode === 13) { //enter pressed
			event.preventDefault();
			if (cursorIsOnSuggestionList()) {
				controller.clickSuggestion(event, controller.suggestions[$scope.selectedIndex]);
			} else {
				$scope.$broadcast("bpAddressAutoComplete.validateAddress");
			}
		} else {
			clearTypeAhead();
		}
	}

	function clearWidget(){
		clearSelectedAddress();
		clearSuggestionValidationMessage();
		clearSearchText();
		clearSuggestions();
	}

	function clearSearchText(){
		controller.searchText = "";		
	}

	function typeAheadIsShown() {
		return controller.bpTypeAhead && controller.bpTypeAhead.length > 0;
	}

	function resetArrowSelectedIndex() {
		$scope.selectedIndex = -1;
	}

	function moveArrowSelectedIndexDown() {
		if ($scope.selectedIndex + 1 !== controller.suggestions.length) {
			$scope.selectedIndex++;
			setSearchTextBasedOnArrowSelection($scope.selectedIndex, $scope.selectedIndex - 1);
		}
	}

	function moveArrowSelectedIndexUp() {
		if ($scope.selectedIndex - 1 !== -2) {
			$scope.selectedIndex--;
			setSearchTextBasedOnArrowSelection($scope.selectedIndex, $scope.selectedIndex + 1);
		}
	}

	function cursorIsOnSuggestionList() {
		return $scope.selectedIndex >= 0;
	}

	function setSearchTextBasedOnArrowSelection(newVal, oldVal) {
		if (newVal === undefined) {
			return;
		}
		if (newVal !== -1) {
			if (oldVal === -1) {
				controller.lastSearchValue = controller.searchText;
			}
			setSearchText(controller.suggestions[$scope.selectedIndex].string);
			clearTypeAhead();
		} else {
			setSearchText(controller.lastSearchValue);
		}
	}

	function getTranslatedMessages(suggestion) {
		var result = [];
		if (!suggestion.messages) {
			return result;
		}
		if(suggestion.messages.constructor === Array){
			suggestion.messages.forEach(function (message) {
				result.push(TranslationService.translate(message.key, {postProcess: 'sprintf', sprintf: message.args.slice(0)}));
			});
		}else{
			result.push(TranslationService.translate(suggestion.messages.key, {postProcess: 'sprintf', sprintf: suggestion.messages.args.slice(0)}));
		}

		return result;
	}

	function mayShowClearButton() {
		return controller.searchText.length > 0;
	}

	function clearInput(focus) {
		clearSuggestions();
		controller.bpTypeAhead = "";
		setSearchText("");
		resetArrowSelectedIndex();
		controller.previousIndex = -1;
		controller.lastSearchValue = "";
		controller.wordList = [];
		clearSuggestionValidationMessage();
		clearSelectedAddress();
		clearConnectionErrorMessage();
		missingElementCursorPosition = null;
		if(focus){
			$scope.$broadcast('move-caret', 0);
		}
	}

	function clearSuggestions() {
		controller.suggestions = [];
		controller.suggestionsWordList = [];
	}

	function clearTypeAhead() {
		controller.bpTypeAhead = "";
	}

	function clearSuggestionValidationMessage() {
		controller.suggestionValidationMessage = "";
		validationMessageOptions = null;
		validationMessageCode = null;
	}

	function setSearchText(string) {
		controller.searchText = string;
	}

	function highlightFirstSuggestionIfComplete() {
		if (addressIsComplete(controller.suggestions[0])) {
			$scope.selectedIndex = 0;
		}
	}
	function selectFirstInListOfSuggesions(){
		event.preventDefault();
		$scope.selectedIndex = 0;		
	}
	function suggestionMouseLeave(){
		$scope.selectedIndex = -1;
	}
	function showAddressNotFoundMessage(){
		setValidationMessage("address-not-found");
	}

});
angular.module('bpAddressAutoComplete').directive('bpAddressAutoComplete', ['$templateCache', function($templateCache){
	'use strict';
	return {
		restrict: 'AE',
		require: ['bpAddressAutoComplete', '^ngModel'],
		transclude: true,
		scope: {
			url: '@url',
			name: '@',
			minLevel: '@',
			bpAddressparams: '@'
		},
		template: $templateCache.get('views/addressautocomplete-template.html'),
		controller: "BpAddressAutoCompleteController",
		controllerAs: "aac",
		link: function(scope, element, attrs, controllers){
			if (scope.name) {
				scope.$parent[scope.name + 'AddressAutoComplete'] = controllers[0];
			}
			scope.setSelectedAddress = controllers[1].$setViewValue;

			scope.bpAddressparams = scope.$parent.bpAddressparams;

			scope.clearSelectedAddress = function(){
				scope.setSelectedAddress(null);
			};
			attrs.$observe("bpAddressparams", function(value){	
				if (value){
					var jsonObj = JSON.parse(value);
					var searchStr = controllers[0].loadParams(jsonObj);				
					controllers[0].searchText = searchStr;
					controllers[0].bpTypeAhead = "";
					controllers[0].showMissingElements(jsonObj);
					controllers[0].getTopSuggestions();
				}
			});			
		}
	};
}]);
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
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('StreetName')
					&& !validatedPostalAddress.StructuredDeliveryPointLocation.StreetName === "") {
					aitSuggestion.streetName = validatedPostalAddress.StructuredDeliveryPointLocation.StreetName;
				}
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('StreetNumber') 
					&& !validatedPostalAddress.StructuredDeliveryPointLocation.StreetNumber === "") {
					aitSuggestion.houseNumber = validatedPostalAddress.StructuredDeliveryPointLocation.StreetNumber;
				}
				if (validatedPostalAddress.StructuredDeliveryPointLocation.hasOwnProperty('BoxNumber')
					&& !validatedPostalAddress.StructuredDeliveryPointLocation.BoxNumber === "") {
					aitSuggestion.boxNumber = validatedPostalAddress.StructuredDeliveryPointLocation.BoxNumber;
				}
			}
			if (validatedPostalAddress.StructuredPostalCodeMunicipality) {
				if (validatedPostalAddress.StructuredPostalCodeMunicipality.hasOwnProperty('MunicipalityName')
					&& !validatedPostalAddress.StructuredPostalCodeMunicipality.MunicipalityName === "" 
					&& validatedPostalAddress.StructuredPostalCodeMunicipality.hasOwnProperty('PostalCode')
					&& !validatedPostalAddress.StructuredPostalCodeMunicipality.PostalCode === "") {
					aitSuggestion.municipalityName = validatedPostalAddress.StructuredPostalCodeMunicipality.MunicipalityName;
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

angular.module('bpAddressAutoComplete').directive('bpAddressValidator', ['$templateCache', function($templateCache){
	'use strict';
	return {
		restrict: 'AE',
		require: ['bpAddressValidator', '^bpAddressAutoComplete'],
		scope: {
			url: '@url'
		},
		template: $templateCache.get('views/address-validator.html'),
		controller: "BpAddressValidatorController",
		controllerAs: "vm",
		link: function(scope, element, attrs, controllers){
			controllers[0].setParentController(controllers[1]);
		}
	};
}]);

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


angular.module('bpAddressAutoComplete').filter('highlightSuggestion', function(UnicodeService) {
	'use strict';
    return function (input, wordList) {
        var query = "(";

        wordList.forEach(function(word){
            query = query.concat(UnicodeService.removeDiacritics(word) + "|");
        });

		var normalizedInput = UnicodeService.removeDiacritics(input);
        query = query.concat(")");
        return normalizedInput.replace(new RegExp('(' + query + ')', 'gi'), '<span class="bpaac-suggestion-char-highlight">$1</span>');
    };
});

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
angular.module('bpAddressAutoComplete').service('UnicodeService', function(){
	'use strict';

	this.removeDiacritics = removeDiacritics;

	var defaultDiacriticsRemovalMap = [
		{'base': 'A', 'letters': '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
		{'base': 'AA', 'letters': '\uA732'},
		{'base': 'AE', 'letters': '\u00C6\u01FC\u01E2'},
		{'base': 'AO', 'letters': '\uA734'},
		{'base': 'AU', 'letters': '\uA736'},
		{'base': 'AV', 'letters': '\uA738\uA73A'},
		{'base': 'AY', 'letters': '\uA73C'},
		{'base': 'B', 'letters': '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
		{'base': 'C', 'letters': '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
		{'base': 'D', 'letters': '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
		{'base': 'DZ', 'letters': '\u01F1\u01C4'},
		{'base': 'Dz', 'letters': '\u01F2\u01C5'},
		{'base': 'E', 'letters': '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
		{'base': 'F', 'letters': '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
		{'base': 'G', 'letters': '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
		{'base': 'H', 'letters': '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
		{'base': 'I', 'letters': '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
		{'base': 'J', 'letters': '\u004A\u24BF\uFF2A\u0134\u0248'},
		{'base': 'K', 'letters': '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
		{'base': 'L', 'letters': '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
		{'base': 'LJ', 'letters': '\u01C7'},
		{'base': 'Lj', 'letters': '\u01C8'},
		{'base': 'M', 'letters': '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
		{'base': 'N', 'letters': '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
		{'base': 'NJ', 'letters': '\u01CA'},
		{'base': 'Nj', 'letters': '\u01CB'},
		{'base': 'O', 'letters': '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
		{'base': 'OI', 'letters': '\u01A2'},
		{'base': 'OO', 'letters': '\uA74E'},
		{'base': 'OU', 'letters': '\u0222'},
		{'base': 'OE', 'letters': '\u008C\u0152'},
		{'base': 'oe', 'letters': '\u009C\u0153'},
		{'base': 'P', 'letters': '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
		{'base': 'Q', 'letters': '\u0051\u24C6\uFF31\uA756\uA758\u024A'},
		{'base': 'R', 'letters': '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
		{'base': 'S', 'letters': '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
		{'base': 'T', 'letters': '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
		{'base': 'TZ', 'letters': '\uA728'},
		{'base': 'U', 'letters': '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
		{'base': 'V', 'letters': '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
		{'base': 'VY', 'letters': '\uA760'},
		{'base': 'W', 'letters': '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
		{'base': 'X', 'letters': '\u0058\u24CD\uFF38\u1E8A\u1E8C'},
		{'base': 'Y', 'letters': '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
		{'base': 'Z', 'letters': '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
		{'base': 'a', 'letters': '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
		{'base': 'aa', 'letters': '\uA733'},
		{'base': 'ae', 'letters': '\u00E6\u01FD\u01E3'},
		{'base': 'ao', 'letters': '\uA735'},
		{'base': 'au', 'letters': '\uA737'},
		{'base': 'av', 'letters': '\uA739\uA73B'},
		{'base': 'ay', 'letters': '\uA73D'},
		{'base': 'b', 'letters': '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
		{'base': 'c', 'letters': '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
		{'base': 'd', 'letters': '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
		{'base': 'dz', 'letters': '\u01F3\u01C6'},
		{'base': 'e', 'letters': '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
		{'base': 'f', 'letters': '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
		{'base': 'g', 'letters': '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
		{'base': 'h', 'letters': '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
		{'base': 'hv', 'letters': '\u0195'},
		{'base': 'i', 'letters': '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
		{'base': 'j', 'letters': '\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
		{'base': 'k', 'letters': '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
		{'base': 'l', 'letters': '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
		{'base': 'lj', 'letters': '\u01C9'},
		{'base': 'm', 'letters': '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
		{'base': 'n', 'letters': '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
		{'base': 'nj', 'letters': '\u01CC'},
		{'base': 'o', 'letters': '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
		{'base': 'oi', 'letters': '\u01A3'},
		{'base': 'ou', 'letters': '\u0223'},
		{'base': 'oo', 'letters': '\uA74F'},
		{'base': 'p', 'letters': '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
		{'base': 'q', 'letters': '\u0071\u24E0\uFF51\u024B\uA757\uA759'},
		{'base': 'r', 'letters': '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
		{'base': 's', 'letters': '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
		{'base': 't', 'letters': '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
		{'base': 'tz', 'letters': '\uA729'},
		{'base': 'u', 'letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
		{'base': 'v', 'letters': '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
		{'base': 'vy', 'letters': '\uA761'},
		{'base': 'w', 'letters': '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
		{'base': 'x', 'letters': '\u0078\u24E7\uFF58\u1E8B\u1E8D'},
		{'base': 'y', 'letters': '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
		{'base': 'z', 'letters': '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
	];

	var diacriticsMap = {};
	for ( var i = 0; i < defaultDiacriticsRemovalMap.length; i++){
		var letters = defaultDiacriticsRemovalMap[i].letters.split("");
		for ( var j = 0; j < letters.length; j++){
			diacriticsMap[letters[j]] = defaultDiacriticsRemovalMap[i].base;
		}
	}

	function removeDiacritics(str) {
		return str.replace(/[^\u0000-\u007E]/g, function(a){
			return diacriticsMap[a] || a;
		});
	}

});

angular.module('bpAddressAutoComplete').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('index.html',
    "<!DOCTYPE html>\n" +
    "<html ng-app=\"bpAddressAutoComplete\">\n" +
    "<head lang=\"en\">\n" +
    "\t<meta charset=\"UTF-8\">\n" +
    "\t<title>Test page for bpAddressAutoComplete core</title>\n" +
    "\t<link rel=\"stylesheet\" href=\"css/app.css\"/>\n" +
    "\n" +
    "</head>\n" +
    "<body>\n" +
    "<script src=\"bower_components/angular/angular.js\"></script>\n" +
    "<script src=\"bower_components/angular-sanitize/angular-sanitize.js\"></script>\n" +
    "<script src=\"js/app.js\"></script>\n" +
    "<script src=\"js/scripts/bp-address-auto-complete.js\"></script>\n" +
    "<script src=\"js/scripts/bp-address-auto-complete-controller.js\"></script>\n" +
    "<script src=\"js/scripts/caret-control.js\"></script>\n" +
    "<script src=\"js/scripts/highlight-filter.js\"></script>\n" +
    "<script src=\"js/scripts/unicode-service.js\"></script>\n" +
    "<script src=\"js/scripts/translation-service.js\"></script>\n" +
    "<div bp-address-auto-complete selected-address=\"selectedAddress\"\n" +
    "\t valurl=\"http://webservices-dca.netpost/ws/MailingAddressProofingCSREST_v1/address/validateAddresses\"\n" +
    "\t aacurl=\"http://webservices-dca.netpost/ws/MailingAddressProofingCSREST_v1/address/autocomplete?\"></div>\n" +
    "</body>\n" +
    "</html>\n" +
    "\n"
  );


  $templateCache.put('views/address-validator.html',
    "<button class=\"bpaac-button\" ng-mousedown=\"vm.validateAddress(aac.searchText)\">\n" +
    "</button>\n"
  );


  $templateCache.put('views/addressautocomplete-template.html',
    "<div class=\"bpaac-dropdown\">\n" +
    "\t<div class=\"bpaac-search-bar\">\n" +
    "\t\t<div class=\"bpaac-input-width\"><input caret-control type=\"text\" class=\"bpaac-input\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t ng-keydown=\"aac.checkKeyDown($event)\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t ng-change=\"aac.onInputChange()\" ng-trim=\"false\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t ng-model=\"aac.searchText\" id=\"addressInputField\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t placeholder=\"{{aac.placeHolderText}}\" autocomplete=\"off\" ng-blur=\"aac.onBlur()\"\n" +
    "\t\t\t\t\t\t\t\t\t\t\t\t\t ng-focus=\"aac.onFocus()\"/>\n" +
    "\t\t\t<div id=\"bpaac-clear-button\"\n" +
    "\t\t\t\t ng-show=\"aac.mayShowClearButton()\" ng-click=\"aac.clearInput(true)\"\n" +
    "\t\t\t\t class=\"bpaac-clear\"></div>\n" +
    "\t\t</div>\n" +
    "\t\t<div ng-transclude></div>\n" +
    "\t\t<input id=\"bpaac-typeahead\" type=\"text\" disabled autocomplete=\"off\" ng-model=\"aac.bpTypeAhead\"/></div>\n" +
    "\t<div class=\"bpaac-dropdown-menu-container\"><div class=\"bpaac-dropdown-menu\" ng-show=\"aac.mayShowDropdown()\">\n" +
    "\t\t<ul id=\"bpaac-suggestionsList\" class=\"list-unstyled\">\n" +
    "\t\t\t<li ng-repeat=\"suggestion in aac.suggestions\"\n" +
    "\t\t\t\tng-class=\"{active : selectedIndex===$index,validatedSuggestion : suggestion.isValidatedSuggestion}\"\n" +
    "\t\t\t\tng-mousedown=\"aac.clickSuggestion($event, suggestion)\" ng-mouseleave=\"aac.suggestionMouseLeave()\">\n" +
    "\t\t\t\t<span ng-bind-html=\"suggestion.string | highlightSuggestion:aac.wordList\"></span> <br />\n" +
    "\t\t\t\t<span ng-repeat=\"translatedMessage in aac.getTranslatedMessages(suggestion)\" class=\"bpaac-suggestion-message\"\n" +
    "\t\t\t\t\t  ng-bind-html=\"translatedMessage\"></span>\n" +
    "\t\t\t</li>\n" +
    "\t\t</ul>\n" +
    "\t</div></div>\n" +
    "</div>\n" +
    "\n"
  );

}]);
