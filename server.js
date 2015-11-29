var mongo  = require('mongodb').MongoClient;
    client = require('socket.io').listen(8080).sockets;

// Connect to database
mongo.connect('mongodb://127.0.0.1/simple-node', function(error, db) {
	if (error) throw error;

	// User is connected
	client.on('connection', function(socket) {

		var collection_users     = db.collection('users'),
		    collection_positions = db.collection('positions');

		// Wait for input
		socket.on('input', function(data) {
			var user_name     = data.user_name,
			    user_position = data.user_position;

			collection_users.insert({"user_name": user_name});
			collection_positions.insert({"user_position": user_position});

		});

	});
});

