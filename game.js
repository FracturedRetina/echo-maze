var cvs;
var ctx;
var pingStartX = -1;
var pingStartY = -1;
var pingEndX = -1;
var pingEndY = -1;
const PING_WIDTH = Math.PI / 4;
const PING = new Audio("res/ping.wav");
const PING_BLOCK = new Audio("res/ping_block.wav");
const PING_GOAL = new Audio("res/ping_goal.wav");
const TOUCH_GOAL = new Audio("res/touch_goal.wav");
const TOUCH_BLOCK = new Audio("res/touch_block.wav");

const SPEED = 1/128;
const FPS = 10;
const DELAY = 1 / FPS;

const WIDTH_WORLD = 16;
const HEIGHT_WORLD = 16;
const EMPTY = 0;
const OBSTACLE = 1;
const GOAL = 2;
const PROB_OBSTACLE = 1 / 7;
const STEPS = (WIDTH_WORLD + HEIGHT_WORLD) / 2;
var player = {
	x: WIDTH_WORLD / 2,
	y: HEIGHT_WORLD / 2
};
var controls = {
	W: false,
	A: false,
	S: false,
	D: false
};

var gameOver = false;

genWorld();

function genWorld() {
	world = new Array(WIDTH_WORLD);
	for (var x = 0; x < WIDTH_WORLD; x++) {
		world[x] = new Array(HEIGHT_WORLD);
		for (var y = 0; y < HEIGHT_WORLD; y++) {
			if (x == 0 || y == 0 || x == WIDTH_WORLD - 1 || y == HEIGHT_WORLD - 1) {
				world[x][y] = OBSTACLE;
			} else if (Math.abs(x - WIDTH_WORLD / 2) < 2 && Math.abs(y - HEIGHT_WORLD / 2) < 2) {
				world[x][y] = EMPTY;
			} else if (Math.random() < PROB_OBSTACLE) {
				world[x][y] = OBSTACLE;
			} else {
				world[x][y] = EMPTY;
			}
		}
	}
	placeGoal();
	printWorld();
}

function placeGoal() {
	var ghost = {
		x: WIDTH_WORLD / 2,
		y: HEIGHT_WORLD / 2
	};

	var angle = Math.random() * 2 * Math.PI;
	
	for (var i = 0; i < STEPS; i++) {
		var ratio = Math.abs(Math.tan(angle));
		var inverted = ratio > 1;
		
		if (inverted) {
			ratio = 1 / ratio;
		}

		if (Math.random() > ratio) {
			if (Math.cos(angle) > 0) {
				if (world[ghost.x + 1][ghost.y] != OBSTACLE) {
					ghost.x++;
				}
			} else {
				if (world[ghost.x - 1][ghost.y] != OBSTACLE) {
					ghost.x--;
				}
			}
		} else {
			if (Math.sin(angle) > 0) {
				if (world[ghost.x][ghost.y + 1] != OBSTACLE) {
					ghost.y++;
				}
			} else {
				if (world[ghost.x][ghost.y - 1] != OBSTACLE) {
					ghost.y--;
				}
			}
		}
	}

	world[ghost.x][ghost.y] = GOAL;
}

function drawWorld() {
	ctx.clearRect(0, 0, cvs.width, cvs.height);
	ctx.save();
		ctx.translate((-player.x + WIDTH_WORLD) * 25 + WIDTH_WORLD, (-player.y + HEIGHT_WORLD) * 25);
		for (var y = 0; y < HEIGHT_WORLD; y++) {
			for (var x = 0; x < WIDTH_WORLD; x++) {
				if (world[x][y] == EMPTY) {
					ctx.fillStyle = "black";
				} else if (world[x][y] == OBSTACLE) {
					ctx.fillStyle = "white";
				} else if (world[x][y] == GOAL) {
					ctx.fillStyle = "green";
				} else {
					ctx.fillStyle = "red";
				}
				ctx.fillRect(x * 25, y * 25, 25, 25);
			}
		}

		ctx.fillStyle = "blue";
		ctx.fillRect(player.x * 25, player.y * 25, 25, 25);
	ctx.restore();
}

function printWorld() {
	var str = "";
	for (var y = 0; y < HEIGHT_WORLD; y++) {
		for (var x = 0; x < WIDTH_WORLD; x++) {
			if (world[x][y] == EMPTY) {
				str += "  ";
			} else if (world[x][y] == OBSTACLE) {
				str += "[]";
			} else if (world[x][y] == GOAL) {
				str += "!!";
			} else {
				str += "??";
			}
		}
		str += "\n";
	}
	console.log(str);
}

function step() {
	var moved = false;

	if (controls.W && world[Math.floor(player.x)][Math.floor(player.y - SPEED + .125)] != OBSTACLE
			&& world[Math.floor(player.x + .75)][Math.floor(player.y - SPEED + .125)] != OBSTACLE) {
		player.y -= SPEED;
		moved = true;
	}
	if (controls.S && world[Math.floor(player.x)][Math.floor(player.y + SPEED + .875)] != OBSTACLE
			&& world[Math.floor(player.x + .75)][Math.floor(player.y + SPEED + .875)] != OBSTACLE) {
		player.y += SPEED;
		moved = true;
	}
	if (controls.A && world[Math.floor(player.x - SPEED + .125)][Math.floor(player.y)] != OBSTACLE
			&& world[Math.floor(player.x - SPEED + .125)][Math.floor(player.y + .75)] != OBSTACLE) {
		player.x -= SPEED;
		moved = true;
	}
	if (controls.D && world[Math.floor(player.x + SPEED + .875)][Math.floor(player.y)] != OBSTACLE
			&& world[Math.floor(player.x + SPEED + .875)][Math.floor(player.y + .75)] != OBSTACLE) {
		player.x += SPEED;
		moved = true;
	}

	if (world[Math.floor(player.x)][Math.floor(player.y)] == GOAL) {
		TOUCH_GOAL.play();
		gameOver = true;
	} else if ((controls.W || controls.A || controls.S || controls.D) && !moved) {
		TOUCH_BLOCK.play();
	}
	// drawWorld();
}

$(document).ready(function() {
	cvs = document.getElementById('canvas');
	ctx = cvs.getContext('2d');

	$(document).mousedown(function(e) {
		pingStartX = e.pageX;
		pingStartY = e.pageY;
	});
	$(document).mousemove(function(e) {
		if (pingStartX != -1) {
			pingEndX = e.pageX;
			pingEndY = e.pageY;
			drawPing();
		}
	});
	$(document).mouseup(function(e) {
		sendPing(Math.PI / 2 - Math.atan2(pingEndX - pingStartX, pingEndY - pingStartY));
		pingStartX = -1;
		pingStartY = -1;
		pingEndX = -1;
		pingEndY = -1;
	});
	$(document).on("keydown", function(e) {
		controls[String.fromCharCode(e.which)] = true;
	});
	$(document).on("keyup", function(e) {
		controls[String.fromCharCode(e.which)] = false;
	});
	const loop = setInterval(function() {
		step();
		if (gameOver) {
			clearInterval(loop);
		}
	}, DELAY);
});

function drawPing() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";

	var angle = Math.PI / 2 - Math.atan2(pingEndX - pingStartX, pingEndY - pingStartY);
	var r = Math.min(canvas.width / 2, Math.sqrt(Math.pow(pingEndX - pingStartX, 2) + Math.pow(pingEndY - pingStartY, 2)));

	ctx.beginPath();
	ctx.moveTo(cvs.width / 2, cvs.height / 2);
	ctx.arc(cvs.width / 2, cvs.height / 2, r, angle - PING_WIDTH / 2, angle + PING_WIDTH / 2);
	ctx.fill();
}

function toIndex(x, y) {
	var asIndex = {
		x: x,
		y: y
	}
}

function sendPing(angle) {
	PING.currentTime = 0;
	PING.play();
	
	var ticks = 0;
	var ping = {
		x: player.x,
		y: player.y
	};

	var xmod = Math.cos(angle) < 0 ? 1 : 0;
	var ymod = Math.sin(angle) < 0 ? 1 : 0;

	while (world[Math.min(Math.floor(ping.x + xmod), WIDTH_WORLD - 1)][Math.min(Math.floor(ping.y + ymod), HEIGHT_WORLD - 1)] != OBSTACLE
		&& world[Math.min(Math.floor(ping.x + xmod), WIDTH_WORLD - 1)][Math.min(Math.floor(ping.y + ymod), HEIGHT_WORLD - 1)] != GOAL) {
		
		ping.x += Math.cos(angle) / 16;
		ping.y += Math.sin(angle) / 16;
		ticks++;
	}

	setTimeout(function() {
		var pinged = world[Math.min(Math.floor(ping.x + xmod), WIDTH_WORLD - 1)][Math.min(Math.floor(ping.y + ymod), HEIGHT_WORLD - 1)];
		
		if (pinged == OBSTACLE) {
			PING_BLOCK.currentTime = 0;
			PING_BLOCK.play();
		} else if (pinged == GOAL) {
			PING_GOAL.currentTime = 0;
			PING_GOAL.play();
		}
	}, ticks * 10);
}

function isCanvasSupported(){
	var elem = document.createElement('canvas');
	return !!(elem.getContext && elem.getContext('2d'));
}