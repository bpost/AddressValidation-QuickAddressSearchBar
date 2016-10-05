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
