/*!
 * These Days Best Friends
 * Analyses the profile feed (Wall) of the user and returns their best friends based on who posts on their wall the most.
 */
var TDBestFriends = (function() {

	// Public functions
	var init,

	// Private variables
	FB, friends;

	// Set options, i.e. init({ FB: FB, friends: friends });
	init = function(options) {
		var validOptions = ['FB', 'friends'], option, i, iLen;
		for (option in options) {
			if (options.hasOwnProperty(option)) {
				for (i = 0, iLen = validOptions.length; i < iLen; i += 1) {
					if (option === validOptions[i]) {
						this[option] = options[option];
						break;
					}
				}
			}
		}
	};

	return {
		init: init
	};

}());

