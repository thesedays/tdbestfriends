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
		numToReturn    : 10,
		storiesToLoad  : 50,
		pointsWallPost : 2,
		pointsComment  : 1
	}, feed,

	// Private functions
	getLoginStatusAndLogin, loadFriends, loadFeed, calculateBestFriends, log;

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

		// If the feed is not set, load it
		if (!feed) {
			return loadFeed(getBestFriends, [callback]);
		}

		// Determine the best friends
		return calculateBestFriends(callback);
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

	// Load the feed then call the callback
	loadFeed = function(callback, callbackArgs) {
		log("loadFeed()");
		FB.api("/me/feed", function(response) {
			if (response.data) {
				feed = response.data;
			}
			if (typeof callback === "function") { callback.apply(this, callbackArgs); }
		});
	};

	// Read the news feed and figure out who the best friends are
	calculateBestFriends = function(callback) {
		var points = [], pointsById = {}, friend, bestFriends = [], i, iLen, post, j, jLen, comment, sortByPoints, complete, padOutResults;

		for (i = 0, iLen = feed.length; i < iLen; i += 1) {
			post = feed[i];
			if (post.from) {
				friend = pointsById[post.from.id];
				if (friend) {
					friend.points += options.pointsWallPost;
				} else {
					friend = { id: post.from.id, points: options.pointsWallPost };
					pointsById[friend.id] = points[points.push(friend) - 1];
				}
				//log("Incremented " + post.from.name + "'s points for a wall post to " + friend.points);
			}
			if (post.comments && post.comments.data) {
				for (j = 0, jLen = post.comments.data.length; j < jLen; j += 1) {
					comment = post.comments.data[j];
					if (comment.from) {
						friend = pointsById[comment.from.id];
						if (friend) {
							friend.points += options.pointsWallPost;
						} else {
							friend = { id: comment.from.id, points: options.pointsComment };
							pointsById[friend.id] = points[points.push(friend) - 1];
						}
						//log("Incremented " + comment.from.name + "'s points for a comment to " + friend.points);
					}
				}
			}
		}
		pointsById = null;

		// Sort the friends with points
		sortByPoints = function(a, b) {
			if (a.points < b.points) {
				return 1;
			} else if (a.points > b.points) {
				return -1;
			} else {
				return 0;
			}
		};
		points.sort(sortByPoints);

		complete = function() {
			callback.apply(this, [bestFriends]);
		};

		// Add the top scoring people to the bestFriendsArray if they are friends with the user
		for (i = 0, iLen = points.length; i < iLen; i += 1) {
			if (points[i].id !== uid) {
				for (j = 0, jLen = friends.length; j < jLen; j += 1) {
					if (points[i].id === friends[j].id) {
						bestFriends.push(friends[j]);
						if (bestFriends.length === options.numToReturn) {
							return complete();
						}
						break;
					}
				}
			}
		}

		// Add some extra random friends to pad out the result list if necessary
		padOutResults = function() {
			var unusedFriends = [], i, iLen, j, jLen, found, rand;
			// Generate a list of unused friends
			for (i = 0, iLen = friends.length; i < iLen; i += 1) {
				found = false;
				for (j = 0, jLen = bestFriends.length; j < jLen; j += 1) {
					if (friends[i].id === bestFriends[j].id) {
						found = true;
						break;
					}
				}
				if (!found) {
					unusedFriends.push(friends[i]);
				}
			}
			// Add as many unused friends as we need
			while (bestFriends.length < options.numToReturn) {
				rand = Math.floor(Math.random() * unusedFriends.length);
				friend = unusedFriends.splice(rand, 1);
				bestFriends.push(friend[0]);
			}
		};
		padOutResults();

		return complete();
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

