(function() {
try {
	var socket = io.connect('http://127.0.0.1:8080');
} catch (e) {
	// Warn user
	alert(e);
}

if (socket !== undefined) {
	// Listen for output
	socket.on('broadcast', parseBroadcast);

	var users = {};

	function parseBroadcast(data) {

		for (var i = 0, len = data.length; i < len; i++) {
			var pos = data[i].user_position;

			var cursor = document.createElement("div");
			cursor.classList.add("cursor");
			cursor.style.top = pos.y+"px";
			cursor.style.left = pos.x+"px";

			document.body.appendChild(cursor);
		}
		console.log(data[i]);

	}

	// Send position
	document.addEventListener("mousemove", sendPosition);

	function sendPosition(e) {
		socket.emit('input', {
			user_name: "Murtada",
			user_position: {
				x: e.clientX,
				y: e.clientY
			}
		});
	}
}
})();

function array_flip( trans )
{
    var key, tmp_ar = {};

    for ( key in trans )
    {
        if ( trans.hasOwnProperty( key ) )
        {
            tmp_ar[trans[key]] = key;
        }
    }

    return tmp_ar;
}