(function()	
{
	var INNER_SQUARE = [40,20];
	var MOVE_DURATION = 498;
	
	var eRoom;
	var eBackground;
	
	var roomName;
	var config;
	var scale;
	var zoom = 1.3;
	
	var users = {};
	var currentUser;
	
	function setScale()
	{
		var w = eBackground.clientWidth/scale + "px";
		var h = eBackground.clientHeight/scale + "px";
		eBackground.style.width = w;
		eBackground.style.height = h;
		eRoom.style.width = w;
		eRoom.style.height = h;
	}
	
	function positionToXY(pos)
	{
		x = 0;
		y = (config.grid[1]-1) * INNER_SQUARE[1];
		
		x += pos[0] * INNER_SQUARE[0];
		y -= pos[0] * INNER_SQUARE[1];
		
		x += pos[1] * INNER_SQUARE[0];
		y += pos[1] * INNER_SQUARE[1];
		return [x, y]
	}
	
	function placeUser(user)
	{
		var xy = positionToXY(user.position);
		user.element.style.left = xy[0] + "px";
		user.element.style.bottom = xy[1] + "px";
		directUser(user);
	}
	
	function directUser(user)
	{
		if(user.direction == 1 || user.direction == 2)
				var side = "front";
			else
				var side = "back";
		user.imgElement.src = "image/characters/" + user.character +
				"/" + side + ".png";
		if(user.direction == 0 || user.direction == 1)
			user.imgElement.style.transform = "scaleX(-1) translateX(50%)";
		else
			user.imgElement.style.transform = "scaleX(1) translateX(-50%)";
	}
	
	var alternateInstance = null;
	function moveUser(user)
	{
		if(alternateInstance !== null)
			clearInterval(alternateInstance);
		
		var isRight = false;
		function alternateLegs()
		{
			if(user.direction == 1 || user.direction == 2)
				var side = "front";
			else
				var side = "back";
			if(isRight)
				var leg = "right";
			else
				var leg = "left";
			user.imgElement.src = "image/characters/" +
				user.character + "/" + side + "_" + leg + "_leg.png";
			
			isRight = !isRight;
		}
		alternateInstance = setInterval(alternateLegs, MOVE_DURATION/6);
		alternateLegs();
		
		var xy = positionToXY(user.position);
		$(user.element).stop().animate({left: xy[0], bottom: xy[1]},
			MOVE_DURATION, "linear", function()
		{
			clearInterval(alternateInstance);
			directUser(user);
		});
	}
	
	function setUpUser(user)
	{
		user.element = document.createElement("div");
		user.element.id = "u" + user.id;
		user.element.className = "square character";
		user.imgElement = document.createElement("img");
		user.imgElement.onload = function() // here until svg
		{
			var w = user.imgElement.clientWidth/2;
			var h = user.imgElement.clientHeight/2;
			user.imgElement.style.width = w + "px";
			user.imgElement.style.height = h + "px";
			user.imgElement.onload = undefined;
		};
		user.element.appendChild(user.imgElement);
		placeUser(user);
		eRoom.appendChild(user.element);
	}
	
	function getOppositeDirection(direction)
	{
		if(direction < 2)
			return direction + 2;
		else
			return direction - 2;
	}
	
	function sendDirection(direction) // parts to be moved to server
	{
		var user = users[currentUser];
		if(direction != user.direction)
		{
			user.direction = direction;
			directUser(user);
		}
		else
		{
			var pos = user.position.slice();
			if(direction == 0)
			{
				if(pos[1]+1 < config.grid[1]) pos[1] += 1;
			}
			else if(direction == 2)
			{
				if(0 <= pos[1]-1) pos[1] -= 1;
			}
			else if(direction == 1)
			{
				if(pos[0]+1 < config.grid[0]) pos[0] += 1;
			}
			else if(direction == 3)
			{
				if(0 <= pos[0]-1) pos[0] -= 1;
			}
			
			var isValid = true;
			for(var i=0; i<config.blocked.length; i++)
			{
				var block = config.blocked[i];
				var isFullBlock = (typeof block[0] === "number");
				if(isFullBlock)
					var c = block;
				else
					var c = block[0];
				if(c[0] == pos[0] && c[1] == pos[1])
				{
					console.log(c, pos);
					if(isFullBlock ||
						block[1][getOppositeDirection(direction)])
					{
						isValid = false;
						break;
					}
				}
				else if(!isFullBlock &&
					(c[0] == user.position[0] && c[1] == user.position[1]))
				{
					if(block[1][direction])
					{
						isValid = false;
						break;
					}
				}
			}
			
			if(isValid)
			{
				user.position = pos;
				moveUser(user);
			}
		}
	}
	
	function final()
	{
		var keyCode = null;
		var isDown = false;
		var sendInterval = null;
		document.addEventListener("keydown", function(event)
		{
			e = event || window.event;
			if(keyCode == e.keyCode) return;
			if(sendInterval !== null)
				clearInterval(sendInterval);
			isDown = true;
			keyCode = e.keyCode;
			var direction = null;
			if (keyCode == 38) // up
				direction = 0;
			else if (keyCode == 40) // down
				direction = 2;
			else if (keyCode == 37) // left
				direction = 3;
			else if (keyCode == 39) // right
				direction = 1;
			if(direction !== null)
			{
				sendInterval = setInterval(function()
				{
					if(isDown)
					{
						sendDirection(direction);
					}
					else
					{
						clearInterval(sendInterval);
						keyCode = null;
					}
				}, MOVE_DURATION);
				sendDirection(direction);
				return false;
			}
		});
		
		document.addEventListener("keyup", function(event)
		{
			e = event || window.event;
			if(e.keyCode != keyCode) return;
			isDown = false;
			return false;
		});
	}
	
	function setUpRoom()
	{
		setScale();
		for(var userId in users)
		{
			var user = users[userId];
			user.id = userId;
			setUpUser(user);
		}
		final();
	}
	
	function loadRoom()
	{
		currentUser = 420;
		users[420] = {
			"name": "maf",
			"character": "giko",
			"position": [8,4],
			"direction": 3
		};
		
		roomName = "bar";
		config = JSON.parse(document.getElementById("room-config").textContent);
		
		eBackground.src = "rooms/" + roomName + "/" + config.background;
		scale = ("scale" in config ? config.scale : 1);
	}
	
	run = function()
	{
		roomStyle = document.getElementById("room-style");
		eRoom = document.getElementById("room");
		eBackground = document.getElementById("background");
		eBackground.onload = setUpRoom;
		loadRoom();
	};
})();
