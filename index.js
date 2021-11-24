var canvas = document.getElementById("myCanvas")
var ctx = canvas.getContext("2d")
ctx.canvas.width = window.innerWidth
ctx.canvas.height = window.innerHeight - 20

// ML Variables
enableML = true
const TOTAL = 200;
let agents = [];
let savedAgents = [];
let objects = [];
let counter = 0;
let slider;



// Game Variables
var gameStarted = false

// User input variables
var rightPressed = false
var leftPressed = false
var upPressed = false
var downPressed = false


// Wall Variables
var Walls = []
var numWalls = 0
var maxWallHeight = canvas.height / 10
var minWallHeight = canvas.height / 15
var maxWallWidth = canvas.width / 15
var minWallWidth = canvas.width / 25

function randomDirection() {
    return Math.floor(Math.random() * 4)
}

// MovingWalls variables
var MovingWalls = []
var numMovingWalls = 1
var maxMovingWallHeight = canvas.height / 1.5
var minMovingWallHeight = canvas.height / 3.5


// Obstacle Variables
var Obstacles = []
var numObstacles = 0
const Direction = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
}

// Goal Variables
var numGoals = 0

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
function randomMovingWallHeight() {
    return Math.floor(Math.random() * (maxMovingWallHeight - minMovingWallHeight)) + minMovingWallHeight
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


// walls that start on the right side of the screen and move left. Must be avoided by the agent/player
class MovingWall {
    constructor(height = randomMovingWallHeight(), width = randomWallWidth(), x = canvas.width, y = randomCanvasY(), speed = 10) {
        this.height = height
        this.width = width
        this.x = x
        this.y = y - (this.height / 2) // puts the y at the middle of the moving wall ,so that it doesn't favor the bottom of the screen
        this.speed = speed
        this.space = 200
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = "rgb(0,0,0)"
        ctx.fillRect(this.x, this.y, this.width, this.height)
        ctx.closePath()
    }

    updatePosition() {
        this.x -= this.speed
    }

    detectMapEdgeCollision() {
        if (this.x <= 0) {
            this.x = canvas.width
            this.height = randomMovingWallHeight()
            this.width = randomWallWidth()
            this.y = randomCanvasY() - (this.height / 2)
        }
    }
}
function drawMovingWalls() {
    for (var i = 0; i < MovingWalls.length; i++) {
        MovingWalls[i].draw()
    }
}
function updateMovingWalls() {
    for (var i = 0; i < MovingWalls.length; i++) {
        MovingWalls[i].updatePosition()
        MovingWalls[i].detectMapEdgeCollision()

        // ctx.beginPath()
        // ctx.fillStyle = "rgb(0,0,255)"
        // ctx.fillRect(MovingWalls[i].x, MovingWalls[i].y, 70, 70) //- (MovingWalls[i].height/2), 70, 70)
        // ctx.closePath()

        // ctx.beginPath()
        // ctx.fillStyle = "rgb(0,0,255)"
        // ctx.fillRect(MovingWalls[i].x, MovingWalls[i].y + MovingWalls[i].height, 70, 70) //+ (MovingWalls[i].height/2), 70, 70)
        // ctx.closePath()


    }
}




// the player is a triange, controlleed by the arrow keys, or the neural network
class Agent {
    constructor(brain) {
        this.size = 40
        this.length = 40
        this.height = 40 * Math.sqrt(3) / 2
        this.x = canvas.width / 15
        this.y = canvas.height / 2
        this.speed = 0
        this.direction = 0
        this.score = 0
        this.fitness = 0
        this.hunger = 100
        this.winner = false
        this.inputs = 1 + (4 * numObstacles) + (4 * numWalls) + (2 * numGoals) + (3 * numMovingWalls) // thie first 1 should be 4, if you are sending the agent velocity, direction, and x values, rather than just the y
        if (brain) {
            this.brain = brain.copy();
        } else {
            //console.log(this.inputs)
            this.brain = new NeuralNetwork(this.inputs, 10, 2);
        }
    }

    dispose() {
        this.brain.dispose();
    }

    mutate() {
        this.brain.mutate(0.1);
    }

    think() {
        let inputs = [];
        inputs[0] = this.y /// canvas.height
        //inputs[1] = this.x / canvas.width
        //inputs[2] = this.speed / 4
        //inputs[3] = this.direction % 360

        // out goals into inputs
        for (let i = 0; i < Goals.length; i++) {
            inputs[1 + (2 * i)] = Goals[i].y / canvas.height
            inputs[2 + (2 * i)] = Goals[i].x / canvas.width
        }

        // put obstacles into inputs
        for (let i = 0; i < Obstacles.length; i++) {

            inputs[1 + (4 * i) + (2 * Goals.length)] = Obstacles[i].x / canvas.width
            inputs[2 + (4 * i) + (2 * Goals.length)] = Obstacles[i].y / canvas.height
            inputs[3 + (4 * i) + (2 * Goals.length)] = Obstacles[i].direction / 3
            inputs[4 + (4 * i) + (2 * Goals.length)] = Obstacles[i].speed / 4

        }

        // put walls into inputs
        for (let i = 0; i < Walls.length; i++) {
            let numObsOffset = (Obstacles.length * 4) + (4 * i) + (2 * Goals.length)
            inputs[1 + numObsOffset] = Walls[i].x / canvas.width
            inputs[2 + numObsOffset] = Walls[i].y / canvas.height
            inputs[3 + numObsOffset] = Walls[i].width / maxWallWidth
            inputs[4 + numObsOffset] = Walls[i].height / maxWallHeight
        }

        // put moving walls into inputs
        for (let i = 0; i < MovingWalls.length; i++) {
            let numObsOffset = (Obstacles.length * 4) + (Walls.length * 4) + (4 * i) + (2 * Goals.length)
            inputs[1 + numObsOffset] = (MovingWalls[i].y + MovingWalls[i].height) /// canvas.height // bottom of moving wall
            inputs[2 + numObsOffset] = MovingWalls[i].y /// canvas.height // top of moving wall
            inputs[3 + numObsOffset] = MovingWalls[i].x /// canvas.width // horizontal location
            //inputs[3 + numObsOffset] = MovingWalls[i].height / maxWallHeight
        }


        //console.log(inputs)

        let output = this.brain.predict(inputs);

        if (output[0] >  .5) {
            this.moveUp()
        } 
        if (output[1] > .5) {
            this.moveDown()
       }


        //console.log(output)
        // if (output[0] > output[1]) {
        //     this.turnRight()
        // }
        // if (output[2] > output[3]) {
        //     this.turnLeft()
        // }
        // if (output[4] > output[5]) {
        //     this.increaseSpeed()
        // }
        // if (output[6] > output[7]) {
        //     this.decreaseSpeed()
        // }
    }

    draw() {
        // got a little help from here: https://stackoverflow.com/a/38238458


        var radians = this.direction * Math.PI / 180;
        ctx.translate(this.x, this.y);
        ctx.rotate(radians);

        ctx.beginPath();
        ctx.moveTo(this.size * Math.cos(0), this.size * Math.sin(0));  // not sure if this is necessary

        // draw each line of the triangle
        for (var i = 1; i <= 3; i += 1) {
            ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 3), this.size * Math.sin(i * 2 * Math.PI / 3));
        }
        ctx.closePath();

        if (this.winner) {
            ctx.fillStyle = "#FFA500";
        } else {
            ctx.fillStyle = "#59D5F7";
        }
        ctx.fill();
        ctx.rotate(-radians);
        ctx.translate(-this.x, -this.y);
    }

    updatePosition() {
        this.x += this.speed * Math.cos(this.direction * Math.PI / 180)
        this.y += this.speed * Math.sin(this.direction * Math.PI / 180)
        //this.y += 5
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
    turnRight() {
        this.direction += 1
    }
    turnLeft() {
        this.direction -= 1
    }

    moveUp() {
        this.y -= 15
    }
    moveDown() {
        this.y += 15
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
                    //Walls.splice(i, 1)
                    //console.log("collision")
                    this.hunger = 0

                }

            }

            // loops through obstacles
            for (var i = 0; i < Obstacles.length; i++) {
                if (lineIntersectsObstacle(triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6], Obstacles[i])) {
                    //a collision has occured with an obstacle
                    //Obstacles.splice(i, 1)
                    //this.score -= 1

                    this.hunger = 0
                }
            }

            // loops through canvas boundaries
            if (linesIntersect(0, 0, canvas.width, 0, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(0, 0, 0, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(canvas.width, 0, canvas.width, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||
                linesIntersect(0, canvas.height, canvas.width, canvas.height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6])) {

                //reset game
                //init()

                //this.score -= 1

                this.hunger = 0
            }

            // loops through goalsLocations
            for (var i = 0; i < Goals.length; i++) {
                if (lineIntersectsObstacle(triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6], Goals[i])) {
                    // a goal has been reached
                    // increment score
                    this.score += 200
                    this.hunger += 50

                    // load new goal location
                    Goals[i].updatePosition()
                }
            }


            // loops through movingwall locations. Could be more efficient. Probably only need to check the far left wall at 1 location a certain distance in front of triangle
            for (var i = 0; i < MovingWalls.length; i++) {
                if (linesIntersect(MovingWalls[i].x, MovingWalls[i].y, MovingWalls[i].x + MovingWalls[i].width, MovingWalls[i].y, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check top line on wall
                    linesIntersect(MovingWalls[i].x, MovingWalls[i].y + MovingWalls[i].height, MovingWalls[i].x + MovingWalls[i].width, MovingWalls[i].y + MovingWalls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check bottom line on wall
                    linesIntersect(MovingWalls[i].x, MovingWalls[i].y, MovingWalls[i].x, MovingWalls[i].y + MovingWalls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6]) ||// check left line on wall
                    linesIntersect(MovingWalls[i].x + MovingWalls[i].width, MovingWalls[i].y, MovingWalls[i].x + MovingWalls[i].width, MovingWalls[i].y + MovingWalls[i].height, triangularPoints[j % 6], triangularPoints[(j + 1) % 6], triangularPoints[(j + 2) % 6], triangularPoints[(j + 3) % 6])) {     // check right line on wall

                    // a collision has occured with a wall. Remove the wall.
                    //Walls.splice(i, 1)
                    //console.log("collision")
                    this.hunger = 0

                }

            }


        }
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

// key listeners. S key still needs to be implemented properly
if (enableML) {
    tf.setBackend('cpu');
    function keyPressed() {
        if (key === 'S') {
            let agent = agents[0];
            saveJSON(agent.brain, 'agent.json');
        }
    }
}
else {
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
}


// initialize variables
function init() {
    if (!gameStarted) {
        gameStarted = true
    }

    // Clear and Generate walls
    Walls = []
    for (var i = 0; i < numWalls; i++) {
        obs = new Wall()
        Walls.push(obs)
    }

    // Clear and Generate obstacles
    Obstacles = []
    for (var i = 0; i < numObstacles; i++) {
        obs = new Obstacle();
        Obstacles.push(obs);
    }

    Goals = []
    for (var i = 0; i < numGoals; i++) {
        goal = new Goal();
        Goals.push(goal);
    }

    MovingWalls = []
    for (var i = 0; i < numMovingWalls; i++) {
        movingWall = new MovingWall();
        MovingWalls.push(movingWall);
    }

    // generate player
    if (!enableML) {
        player = new Player();
    } else {
        // create agents
        for (let i = 0; i < TOTAL; i++) {
            agents[i] = new Agent();
        }
        //console.log(agents)

    }

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

    
    drawMovingWalls()
    updateMovingWalls()


    if (!enableML) {
        player.draw()
        player.updatePosition()
        player.detectCollisions()
    } else {
        for (let i = 0; i < agents.length; i++) {

            // agent thinks
            agents[i].think()

            agents[i].draw()
            agents[i].updatePosition()
            agents[i].detectCollisions()


            // if (agents[i].speed > 0.5) {
            //     agents[i].score += .5 //incentivize staying alive and moving
            // } else {
            //     agents[i].hunger -= .2
            // }
            //agents[i].hunger -= .05 // agents get hungry over time


            agents[i].score++ // incentivize staying alive

            // removes agent and saves it
            if (agents[i].hunger <= 0) {
                savedAgents.push(agents.splice(i, 1)[0])
            }



            if (agents.length == 0) {
                MovingWalls = []
                nextGeneration()
                for (var j = 0; j < numMovingWalls; j++) {
                    movingWall = new MovingWall();
                    MovingWalls.push(movingWall);
                }
            }
        }

    }

    for (let i = 0; i < Goals.length; i++) {
        Goals[i].draw()
    }



}

var elem = document.querySelector('input[type="range"]');

var timerId = null;
timerId = setInterval(draw, 100/elem.value)


var rangeValue = function(){
  clearInterval(timerId);
  delay = elem.value;
  timerId = setInterval(draw, 100/delay);
}

elem.addEventListener("input", rangeValue);

//var interval = setInterval(draw, 10);


