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
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'x-api-key': $scope.apiKey
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