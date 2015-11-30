var mongo   = require('mongodb').MongoClient;
    client  = require('socket.io').listen(8080).sockets,
    clients = {};

// Connect to database
mongo.connect('mongodb://127.0.0.1/simple-node', function(error, db) {
	if (error) throw error;

	var collection_users     = db.collection('users'),
		collection_positions = db.collection('positions');

	var data_all_users,
	    data_all_positions;

	var users = {};


	collection_users.remove({});
	collection_positions.remove({});

	var get_all_users = function(callback) {
		return collection_users.find().limit(10).toArray(function(error, response) {
			data_all_users = response;
			console.log(data_all_users);
			callback();
		});
	};

	var get_all_positions = function(callback) {
		return collection_positions.find().sort({_id: -1}).limit(10).toArray(function(error, response) {
			data_all_positions = response;
			callback();
		});
	};

	/*setInterval(function() {
		data_all_positions = get_all_positions();
	}, 50);*/

	// User is connected
	client.on('connection', function(socket) {
		clients[socket.id] = socket;

		socket.on('disconnect', function() {
			delete clients[socket.id];
		});

		var current_user = { timeout: 0 };

		var broadcast_users = function(key_string) {
			var user_array = Object.keys(users).map(function(k) { return users[k] });
			client.emit(key_string, user_array);
		};

		/*setInterval(function() {
			broadcast_positions();
		}, 50);*/

		// Client input
		socket.on('input', function(data) {
			users[data.user_name] = data;
			broadcast_users('broadcast');
		});

		// Client mouseclick
		socket.on('mouseclick', function(data) {
			var user_name     = data.user_name,
			    user_position = data.user_position;

			client.emit('mouseclick', {"user_name": user_name, "user_position": user_position});
		});

		// Client mousedown
		socket.on('mousedown', function(data) {
			var user_name     = data.user_name,
			    user_position = data.user_position;

			client.emit('mousedown', {"user_name": user_name, "user_position": user_position});
			pauseEvent(e);
		});

		// Client mouseup
		socket.on('mouseup', function(data) {
			var user_name     = data.user_name,
			    user_position = data.user_position;

			client.emit('mouseup', {"user_name": user_name, "user_position": user_position});
		});

		// Client join
		socket.on('join', function(data) {
			var user_name = data.user_name;
			current_user.user_name = user_name;


			if (users[user_name] === undefined) {
				users[user_name] = {
					user_name: data.user_name
				};
				console.log("user joined", user_name);
			}

			console.log(users);
			broadcast_users('users');

		});

		// Client quit
		socket.on('quit', function(data) {
			var user_name = data.user_name;

			if (!(users[user_name] === undefined)) {
				console.log("User quit:", user_name);
				delete users[user_name];
			}
			console.log(users);

			client.emit('quit', user_name);
			clearTimeout(timer_timeout);
			socket.disconnect();
		});

		// Client keepalive
		socket.on('keepalive', function(data) {
			if (data) {
				current_user.timeout = 0;
			}
		});

		var timer_timeout = setInterval(clientTimeout, 1000);

		function clientTimeout() {
			if (current_user.timeout > 10 && !(current_user.user_name === undefined)) {
				collection_users.remove(
					{"user_name": current_user.user_name},
					function(error, result) {
						if (error) throw error;
					}
				);

				console.log("Client timed out:", current_user.user_name);

				client.emit('quit', current_user.user_name);
				clearTimeout(timer_timeout);
				socket.disconnect();
			} else {
				current_user.timeout++;
			}
		}
	});
});

