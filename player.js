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