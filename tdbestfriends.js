/*!
 * These Days Best Friends
 * Analyses the profile feed (Wall) of the user and returns their best friends based on who posts on their wall the most.
 */
var TDBestFriends = (function() {

	// Public setters
	var setFB, setFriends, setUid, setPerms, extendOptions,

	// Public functions
	getBestFriends,

	// Private variables
	FB, friends, uid, perms, options = {
		numToReturn   : 10,
		storiesToLoad : 50
	},

	// Private functions
	getLoginStatusAndLogin, loadFriends, log;

	/////////////////////////////////////////
	// PUBLIC SETTERS
	/////////////////////////////////////////

	// Pass a reference to the FB Facebook SDK to reduce scope lookup
	setFB = function(input) {
		FB = input;
	};

	// Pass a reference to the friends loaded by Facebook to avoid a duplicate API call
	setFriends = function(input) {
		friends = input;
	};

	// If the user has already logged in to your app, give us their UID
	setUid = function(input) {
		uid = input;
	};

	// If your app has already called FB.login or FB.getLoginStatus, give us a list of permissions that have been granted
	setPerms = function(input) {
		perms = input;
	};

	// Override the current options
	extendOptions = function(input) {
		var i;
		for (i in input) {
			if (input.hasOwnProperty(i)) {
				options[i] = input[i];
			}
		}
	};

	/////////////////////////////////////////
	// PUBLIC FUNCTIONS
	/////////////////////////////////////////

	getBestFriends = function(callback) {
		log("getBestFriends()");
		// Make sure SDK exists
		if (!FB) {
			throw new Error("Could not find the Facebook JavaScript SDK");
		}

		// Make sure a user is logged in and has granted us the necessary permissions
		if (!uid || !perms) {
			return getLoginStatusAndLogin(getBestFriends, [callback]);
		}

		// Make sure the requested permissions have been granted
		if (perms.indexOf("read_stream") === -1) {
			return getLoginStatusAndLogin(getBestFriends, [callback]);
		}

		// If the friends are not set, load them
		if (!friends) {
			return loadFriends(getBestFriends, [callback]);
		}

		// If the user doesn't have any friends, return null
		if (!friends.length) {
			return null;
		}

		callback.apply(this, [friends.slice(0, options.numToReturn)]);
	};

	/////////////////////////////////////////
	// PRIVATE FUNCTIONS
	/////////////////////////////////////////

	getLoginStatusAndLogin = function(callback, callbackArgs) {
		log("getLoginStatusAndLogin()");
		var login = function() {
			FB.login(function(response) {
				if (response.session && response.session.uid && response.perms) {
					uid = response.session.uid;
					perms = response.perms;
				}
				if (typeof callback === "function") { callback.apply(this, callbackArgs); }
			}, { perms: "read_stream" });
		};
		FB.getLoginStatus(function(response) {
			if (response.session && response.session.uid && response.perms) {
				uid = response.session.uid;
				perms = response.perms;
				if (typeof callback === "function") { callback.apply(this, callbackArgs); }
			} else {
				login();
			}
		});
	};

	// Load the friends then call the callback
	loadFriends = function(callback, callbackArgs) {
		log("loadFriends()");
		FB.api("/me/friends?fields=id,name", function(response) {
			if (response.data) {
				friends = response.data;
			}
			if (typeof callback === "function") { callback.apply(this, callbackArgs); }
		});
	};

	log = function() {
		if (console) {
			console.log(Array.prototype.slice.call(arguments));
		}
	};

	return {
		setFB          : setFB,
		setFriends     : setFriends,
		setUid         : setUid,
		setPerms       : setPerms,
		extendOptions  : extendOptions,
		getBestFriends : getBestFriends
	};

}());

