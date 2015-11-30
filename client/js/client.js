(function() {
var socket
try {
	var socket = io.connect('http://127.0.0.1:8080', {forceNew: true});
} catch (e) {
	// Warn user
	alert(e);
}

var current_user = {
	user_name: (Math.round(Math.random()*89999)+10000).toString(),
};

if (socket !== undefined) {


	var users = {};

	sendJoin();

	window.addEventListener("beforeunload", function (e) {
		sendQuit();
	});

	function sendQuit(e) {
		console.log("Quitting");
		socket.emit('quit', {
			user_name: current_user.user_name
		});
		socket.disconnect();
	}

	function sendJoin(e) {
		console.log("Joining as: ", current_user.user_name);
		socket.emit('join', {
			user_name: current_user.user_name
		});
	}

	// Listen for output
	socket.on('broadcast', parseBroadcast);
	socket.on('users', parseUsers);
	socket.on('quit', parseQuit);

	socket.on('mouseclick', parseMouseclick);
	//socket.on('mousedown', parseMousedown);
	//socket.on('mouseup', parseMouseup);

	function parseMouseclick(data) {
		var user_name = data.user_name,
		    user_pos  = data.user_position;

		console.log("Clicked:", user_name);

		if (user_name !== current_user.user_name) {
			if (!(users[user_name] === undefined)) {

				users[user_name].user_position = user_pos;
				add_block(user_pos);
			}
		}
	}

	function parseMousedown(data) {
		var user_name = data.user_name,
		    user_pos  = data.user_position;

		if (!(users[user_name] === undefined)) {
			users[user_name].user_position = user_pos;
			users[user_name].mousedown = true;
		}
	}

	function parseMouseup(data) {
		var user_name = data.user_name,
		    user_pos  = data.user_position;

		if (!(users[user_name] === undefined)) {
			users[user_name].user_position = user_pos;
			users[user_name].mousedown = false;
		}
	}

	function parseQuit(data) {
		if (!(users[data] === undefined)) {
			console.log("User quit:", data);
			document.body.removeChild(users[data].cursor);
			delete users[data];
		}
		console.log("Users after quit:", users);
	}

	function parseUsers(data) {
		console.log(data);
		if (data) {
			for (var i = 0, len = data.length; i < data.length; i++) {
				var user_name = data[i].user_name;
				if (users[user_name] === undefined) {
					users[user_name] = {};
					users[user_name].user_position = {x: 0, y: 0};
					var cursor = document.createElement("div");
					cursor.id = "cursor-"+user_name;
					cursor.classList.add("cursor");

					users[user_name].cursor = cursor;

					console.log("New user:", user_name);

					if (user_name !== current_user.user_name) {
						document.body.appendChild(cursor);
					}
				}

			}
			console.log("Joined users:", users);
		}
	}

	function parseBroadcast(data) {
		if (data) {
			for (var i = 0, len = data.length; i < data.length; i++) {
				var user_name = data[i].user_name;
				var pos = data[i].user_position;

				if (users[user_name]) {
					users[user_name].user_position = pos;
				}
			}

			render();
		}
	}

	function render() {
		var user_key;
		for (user_key in users) {
			if ((user_key !== current_user.user_name) && (users[user_key].user_position)) {
				var cursor = users[user_key].cursor;
				var pos = users[user_key].user_position;
				cursor.style.transform = "translate("+pos.x+"px, "+pos.y+"px)";
			}
		}
	}

	// Send position
	setInterval(function() {
		sendPosition();
	}, 50);

	var amount = 0;
	function pushbuttonClicked() {
		amount++;
		document.getElementById("pushbutton-text").textContent = "Clicked "+amount+" times";
	}

	document.getElementById("pushbutton").addEventListener("click", pushbuttonClicked);
	document.addEventListener("mousemove", getPosition);
	//document.addEventListener("click", sendMouseclick);
	document.addEventListener("mousedown", sendMousedown);
	document.addEventListener("mouseup", sendMouseup)

	var pos_x = 0;
	var pos_y = 0;

	function sendMouseclick(e) {
		socket.emit('mouseclick', {
			user_name: current_user.user_name,
			user_position: {
				x: e.clientX,
				y: e.clientY
			}
		});
	}

	function sendMousedown(e) {
		if (!current_user.mousedown) {
			socket.emit('mouseclick', {
				user_name: current_user.user_name,
				user_position: {
					x: e.clientX,
					y: e.clientY
				}
			});
			add_block({x: e.clientX, y: e.clientY})
			current_user.mousedown = true;
		}
		pauseEvent(e);
	}

	function sendMouseup(e) {
		socket.emit('mouseup', {
			user_name: current_user.user_name,
			user_position: {
				x: e.clientX,
				y: e.clientY
			}
		});
		current_user.mousedown = false;
	}

	function getPosition(e) {
		pos_x = e.clientX;
		pos_y = e.clientY;
	}

	function sendPosition() {
		socket.emit('input', {
			user_name: current_user.user_name,
			user_position: {
				x: pos_x,
				y: pos_y
			}
		});
	}

	// Keepalive
	setInterval(function() {
		keepAlive();
	}, 1000);

	function keepAlive(e) {
		socket.emit('keepalive', true);
	}
}

function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

var blocks_layer = document.createElement("div");
blocks_layer.id = "blocks-layer";
document.body.appendChild(blocks_layer);

function add_block(pos) {
	var block = document.createElement("div");
	block.classList.add("block");

	pos.x -= 10;
	pos.y -= 10;
	block.style.transform = "translate("+pos.x+"px, "+pos.y+"px)";

	blocks_layer.appendChild(block);
}

function click_in_window(x,y) {
    var ev = document.createEvent("MouseEvent");
    var el = document.elementFromPoint(x,y);
    ev.initMouseEvent(
        "click",
        true /* bubble */, true /* cancelable */,
        window, null,
        x, y, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/, null
    );
    el.dispatchEvent(ev);
}
})();