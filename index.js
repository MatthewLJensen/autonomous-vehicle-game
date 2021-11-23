var canvas = document.getElementById("myCanvas")
var ctx = canvas.getContext("2d")
ctx.canvas.width = window.innerWidth
ctx.canvas.height = window.innerHeight

// Game Variables
var score = 0
var gameStarted = false

// User input variables
var rightPressed = false
var leftPressed = false
var upPressed = false
var downPressed = false


// Wall Variables
var Walls = []
var numWalls = 15
var maxWallHeight = canvas.height / 10
var minWallHeight = canvas.height / 15
var maxWallWidth = canvas.width / 15
var minWallWidth = canvas.width / 25

function randomDirection() {
    return Math.floor(Math.random() * 4)
}

// Obstacle Variables
var Obstacles = []
var numObstacles = 12
const Direction = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
}

// Goal Variables
var goalLocation

// player object
var player


// Helper Functions to find random points
function randomWallHeight() {
    return Math.floor(Math.random() * (maxWallHeight - minWallHeight)) + minWallHeight
}
function randomWallWidth() {
    return Math.floor(Math.random() * (maxWallWidth - minWallWidth)) + minWallWidth
}
function randomCanvasY() {
    return Math.floor(Math.random() * canvas.height)
}
function randomCanvasX() {
    return Math.floor(Math.random() * canvas.width)
}


class Wall {
    constructor(height = randomWallHeight(), width = randomWallWidth(), x = randomCanvasX(), y = randomCanvasY()) {
        this.height = height
        this.width = width
        this.x = x
        this.y = y
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = "rgb(0,0,0)"
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.closePath()
    }
}
function drawWalls() {
    for (var i = 0; i < Walls.length; i++) {
        Walls[i].draw()
    }
}

// a moving circle that must avoid the walls
class Obstacle {
    constructor(radius = 20, x = randomCanvasX(), y = randomCanvasY(), speed = 1, direction = randomDirection()) {
        this.radius = radius
        this.x = x
        this.y = y
        this.speed = speed
        this.direction = direction

        while (detectWallCollisions(this, false) || detectObstacleCollisions(this, false) || detectEdgeCollisions(this, false)) { // this should prevent obstacles from spawning in illegal locations
            this.x = randomCanvasX()
            this.y = randomCanvasY()
        }

    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = "rgb(255,0,0)"
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.closePath()
    }
    updatePosition() {
        if (this.direction == Direction.UP) {
            this.y += this.speed
        } else if (this.direction == Direction.DOWN) {
            this.y -= this.speed
        } else if (this.direction == Direction.LEFT) {
            this.x -= this.speed
        } else if (this.direction == Direction.RIGHT) {
            this.x += this.speed
        }
    }
    changeDirection() {
        if (this.direction == Direction.UP) {
            this.direction = Direction.DOWN
        } else if (this.direction == Direction.DOWN) {
            this.direction = Direction.UP
        } else if (this.direction == Direction.LEFT) {
            this.direction = Direction.RIGHT
        } else if (this.direction == Direction.RIGHT) {
            this.direction = Direction.LEFT
        }
    }
}
function drawObstacles() {
    for (var i = 0; i < Obstacles.length; i++) {
        Obstacles[i].draw();
    }
}
function updateObstacles() {
    for (var i = 0; i < Obstacles.length; i++) {
        Obstacles[i].updatePosition();
    }
}

// the player is a triange, controlleed by the arrow keys
class Player {
    constructor(size = 40, x = 30, y = canvas.height / 2, speed = 0, direction = 0) {
        this.size = size
        this.length = size
        this.height = size * Math.sqrt(3) / 2
        this.x = x
        this.y = y
        this.speed = speed
        this.direction = direction
    }


    draw() {
        // got a little help from here: https://stackoverflow.com/a/38238458

        var radians = this.direction * Math.PI / 180;
        ctx.translate(this.x, this.y);
        ctx.rotate(radians);

        ctx.beginPath();
        ctx.moveTo(this.size * Math.cos(0), this.size * Math.sin(0));  // not sure if this is necessary

        for (var i = 1; i <= 3; i += 1) {
            ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 3), this.size * Math.sin(i * 2 * Math.PI / 3));
            //console.log(this.size * Math.cos(i * 2 * Math.PI / 3))
            //console.log(this.size * Math.sin(i * 2 * Math.PI / 3))
        }
        ctx.closePath();

        ctx.fillStyle = "#59D5F7";
        ctx.fill();
        ctx.rotate(-radians);
        ctx.translate(-this.x, -this.y);
    }

    updatePosition() {
        this.x += this.speed * Math.cos(this.direction * Math.PI / 180)
        this.y += this.speed * Math.sin(this.direction * Math.PI / 180)

        // update direction
        if (rightPressed) {
            this.direction += 1
        }
        if (leftPressed) {
            this.direction -= 1
        }

        // update speed
        if (upPressed) {
            this.increaseSpeed()
        }
        if (downPressed) {
            this.decreaseSpeed()
        }

    }


    increaseSpeed() {
        if (this.speed < 4) {
            this.speed += .02
        }
    }
    decreaseSpeed() {
        if (this.speed > .02) {
            this.speed -= .02
        } else if (this.speed > 0 && this.speed <= .02) {
            this.speed = 0
        }
    }

    detectCollisions() {
        let triangularPoints = []

        for (var i = 1; i <= 3; i += 1) {
            let points = rotatePoints(this.size * Math.cos(i * 2 * Math.PI / 3) + this.x, this.size * Math.sin(i * 2 * Math.PI / 3) + this.y, this.x, this.y, this.direction)
            triangularPoints.push(points[0])
            triangularPoints.push(points[1])
        }

        // loops through triangular lines
        for (var j = 0; j < 6; j += 2) {

            // loops through wall lines
            for (var i = 0; i < Walls.length; i++) {
                if (linesIntersect(Walls[i].x, Walls[i].y, Walls[i].x + Walls[i].width, Walls[i].y, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check top line on wall
                    linesIntersect(Walls[i].x, Walls[i].y + Walls[i].height, Walls[i].x + Walls[i].width, Walls[i].y + Walls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check bottom line on wall
                    linesIntersect(Walls[i].x, Walls[i].y, Walls[i].x, Walls[i].y + Walls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check left line on wall
                    linesIntersect(Walls[i].x + Walls[i].width, Walls[i].y, Walls[i].x + Walls[i].width, Walls[i].y + Walls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6])) {     // check right line on wall

                    // a collision has occured with a wall. Remove the wall.
                    Walls.splice(i, 1)
                }

            }

            // loops through obstacles
            for (var i = 0; i < Obstacles.length; i++) {
                if (lineIntersectsObstacle(triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6], Obstacles[i])) {
                    //a collision has occured with an obstacle
                    Obstacles.splice(i, 1)
                }
            }

            // loops through canvas boundaries
            if (linesIntersect(0, 0, canvas.width, 0, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(0, 0, 0, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(canvas.width, 0, canvas.width, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(0, canvas.height, canvas.width, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6])) {

                //reset game
                init()
            }

            // Check against goal location
            if (lineIntersectsObstacle(triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6], goalLocation)) {
                // a goal has been reached
                
                // increment score
                score += 1
                
                // load new goal location
                goalLocation.updatePosition()
            }

        }
        // //covers over blue triangle with orange triange using the same points
        // ctx.beginPath();
        // ctx.lineTo(triangularPoints[0], triangularPoints[1]);
        // ctx.lineTo(triangularPoints[2], triangularPoints[3]);
        // ctx.lineTo(triangularPoints[4], triangularPoints[5]);
        // ctx.fillStyle = "#FFA500";
        // ctx.fill();
        // ctx.closePath();
    }


}

// The goal is a circle that the player must reach to progress the game
class Goal {
    constructor(radius = 30, x = randomCanvasX(), y = randomCanvasY()) {
        this.radius = radius
        this.x = x
        this.y = y

        while (detectWallCollisions(this, false) || detectObstacleCollisions(this, false) || detectEdgeCollisions(this, false)) { // this should prevent obstacles from spawning in illegal locations
            this.x = randomCanvasX()
            this.y = randomCanvasY()
        }

    }

    draw() {
        ctx.beginPath()
        ctx.fillStyle = "#FFA500"
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.closePath()
    }

    updatePosition() {
        this.x = randomCanvasX()
        this.y = randomCanvasY()
        while (detectWallCollisions(this, false) || detectObstacleCollisions(this, false) || detectEdgeCollisions(this, false)) { // this should prevent obstacles from spawning in illegal locations
            this.x = randomCanvasX()
            this.y = randomCanvasY()
        }
    }
}

// Collision Logic

// Obstacle on wall collision logic
// loops through all obstacles and checks if they have collided with any walls
function wallCollisionDetection(changeDirection = true) {
    for (var j = 0; j < Obstacles.length; j++) {
        if (detectWallCollisions(Obstacles[j])) {
            if (changeDirection) {
                Obstacles[j].changeDirection()
            }
            return true
        }
    }
    return false;
}
// detects if the obstacle has collided with any walls
function detectWallCollisions(obstacle) { // sometiemes an obstacle can get stuck in a wall. This might be because the obstacle is moving too fast and is embedded in the wall and so it continues to collide even when its direction is reversed
    for (var i = 0; i < Walls.length; i++) {
        if (Walls[i].x + Walls[i].width > obstacle.x - obstacle.radius &&
            Walls[i].x < obstacle.x + obstacle.radius &&
            Walls[i].y + Walls[i].height > obstacle.y - obstacle.radius &&
            Walls[i].y < obstacle.y + obstacle.radius) {
            return true
        }
    }
    return false
}

// Obstacle on obstacle Collision logice
// detects if the obstacle has collided with another obstacle
function obstacleCollisionDetection(changeDirection = true) {
    for (var i = 0; i < Obstacles.length; i++) {
        detectObstacleCollisions(Obstacles[i], changeDirection)
    }
    return false
}
// detects if the obstacle has collided with another obstacle
function detectObstacleCollisions(obstacle, changeDirection = true) {
    for (var j = 0; j < Obstacles.length; j++) {
        if (obstacle != Obstacles[j]) {
            if (obstacle.x < Obstacles[j].x + Obstacles[j].radius &&
                obstacle.x + obstacle.radius > Obstacles[j].x - Obstacles[j].radius &&
                obstacle.y < Obstacles[j].y + Obstacles[j].radius &&
                obstacle.y + obstacle.radius > Obstacles[j].y - Obstacles[j].radius) {
                if (changeDirection) {
                    Obstacles[j].changeDirection()
                    obstacle.changeDirection()
                }
                return true
            }
        }
    }
    return false
}

// obstacle on edge collision logic
// loops through all obstacles and checks if they have collided with any edge
function edgeDetection(changeDirection = true) {
    for (var i = 0; i < Obstacles.length; i++) {
        detectEdgeCollisions(Obstacles[i], changeDirection)
    }
}

// detects if the obstacle has collided with any edges
function detectEdgeCollisions(obstacle, changeDirection = true) {
    if (obstacle.x + obstacle.radius > canvas.width || obstacle.x - obstacle.radius < 0) {
        if (changeDirection) {
            obstacle.changeDirection()
        }
        return true
    }
    if (obstacle.y + obstacle.radius > canvas.height || obstacle.y - obstacle.radius < 0) {
        if (changeDirection) {
            obstacle.changeDirection()
        }
        return true
    }
    return false
}

// checks for any collisions
function detectCollisions() {
    wallCollisionDetection()
    obstacleCollisionDetection()
    edgeDetection()
}

// rotate point (x1, y1) around another point (x2, y2) by a certain angle
function rotatePoints(x1, y1, x2, y2, angle) {
    var x = x1 - x2;
    var y = y1 - y2;
    var radians = angle * Math.PI / 180;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    var newX = x * cos - y * sin;
    var newY = x * sin + y * cos;

    return [newX + x2, newY + y2];
}

// checks if 2 lines intersect
function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    if (denominator == 0) {
        return false;
    }
    var a = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
    var b = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));
    var ta = a / denominator;
    var tb = b / denominator;
    if (ta > 0 && ta < 1 && tb > 0 && tb < 1) {
        return true;
    }
    return false;
}

// takes in 2 points and returns the general form line equation
function getLineEquation(x1, y1, x2, y2) {
    let a = y2 - y1;
    let b = x1 - x2;
    //let c = (y1 * (x1-x2)) + (x1 * (y2 - y1));
    let c = (y1 * x2) - (x1 * y2);
    return [a, b, c];
}

// determines if a line segment (x1, y1) to (x2, y2) intersects with an obstacle
function lineIntersectsObstacle(x1, y1, x2, y2, obstacle) {

    var A = obstacle.x - x1
    var B = obstacle.y - y1
    var C = x2 - x1
    var D = y2 - y1

    var dot = A * C + B * D
    var len_sq = C * C + D * D
    var param = -1
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq

    var xx, yy

    if (param < 0) {
        xx = x1
        yy = y1
    }
    else if (param > 1) {
        xx = x2
        yy = y2
    }
    else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    var dx = obstacle.x - xx
    var dy = obstacle.y - yy
    let dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < obstacle.radius) {
        return true
    } else {
        return false
    }
}


// setup user input
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    }
    else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
    else if (e.key == "Up" || e.key == "ArrowUp") {
        upPressed = true;
    }
    else if (e.key == "Down" || e.key == "ArrowDown") {
        downPressed = true;
    }
}
function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    }
    else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
    else if (e.key == "Up" || e.key == "ArrowUp") {
        upPressed = false;
    }
    else if (e.key == "Down" || e.key == "ArrowDown") {
        downPressed = false;
    }
}



// initialize variables
function init() {
    if (!gameStarted) {
        gameStarted = true
    }else{
        score -= 10
    }
    // generate player
    player = new Player();

    // Clear and Generate obstacles
    Obstacles = [];
    for (var i = 0; i < numObstacles; i++) {
        obs = new Obstacle();
        Obstacles.push(obs);
    }

    // Clear and Generate walls
    Walls = [];
    for (var i = 0; i < numWalls; i++) {
        obs = new Wall()
        Walls.push(obs)
    }

    goalLocation = new Goal()

}



init()



// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)




    drawWalls()



    // detects if any obstacle collisions have occurred
    detectCollisions()

    updateObstacles()

    drawObstacles()


    player.draw()
    player.updatePosition()

    player.detectCollisions()

    goalLocation.draw()



}
var interval = setInterval(draw, 10);

