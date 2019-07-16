

const ctx = document.getElementById("canvas").getContext("2d");
let tileW = 40, tileH = 40;
let mapW = 20, mapH = 20;

let currentSecond = 0, frameCount = 0, framesLastSecond = 0;
let lastFrameTime = 0;

const keysDown = {
    37: false, 
    38: false,
    39: false,
    40: false
}

class Character {
   constructor() {
       this.tileFrom    = [1, 1];   // where player come from [row, col]
       this.tileTo      = [1, 1];   // where player is going [row, col]
       this.timeMoved   = 0;        // when movment started
       this.dimentsions = [30, 30]; // size of character [width, height]
       this.position    = [45, 45]; // position in [x, y] relative to top-left corner
       this.deleyMove   = 400;      // how long it take to move 1 tile in ml
   } 

   placeAt(x, y) {
        this.tileFrom = [x, y];
        this.tileTo   = [x, y];
        this.position = [
            (x * tileW) + ((tileW - this.dimentsions[0]) / 2), 
            (y * tileH) + ((tileH - this.dimentsions[1]) / 2)
        ];
   }

   processMovment(t) {
       
        if (this.tileTo[0] === this.tileFrom[0] && this.tileTo[1] === this.tileFrom[1]) {
            /**
             ** Checking if the charecter is moving by comparing the tileFrom to the tileTo
             */
            return false;
        }

        if (t - this.timeMoved >= this.deleyMove) {
            /**
             ** Here we check if the time passed since starting the move 
             ** is greater than the deley we set, if so it means the charecter is arrived 
             ** to it's destination.
             */
            this.placeAt(this.tileTo[0], this.tileTo[1])

        } else {
         
            // here we are calculating the starting (x, y) position 
            // THIS IS NOT GETTING DRAWED TO THE CANVAS
            /**
             ** Why it works?
             ** If we remove it, the starting point of the drawing character will not be reset
             ** on each frame so the calculation belowe will start from the wrong position. 
             ** Instead of starting every time from 10 (example number) so it will draw every 1 px like this:
             ** 10 + 1 => draw(11) => 10 + 2 => draw(12) => 10 + 3 => draw(13) => 10 + 4 => draw(14)
             ** it will start from the old position and look like this:
             ** 10 + 1 => draw(11) => 11 + 2 => draw(13) => 13 + 3 => draw(16) => 16 + 4 => draw(20)
             */
            this.position[0] = (this.tileFrom[0] * tileW) + ((tileW - this.dimentsions[0]) / 2);
            this.position[1] = (this.tileFrom[1] * tileH) + ((tileH - this.dimentsions[1]) / 2);

            // this calculate the distance passed from the starting position ^ to this point
            // THIS IS GETTING DRAWED TO THE CANVAS
            /**
             ** Why it works?
             ** This actually draw the current position of our cheracter
             ** it calculate it by first calculating the pixels it needs to move (diff) 
             ** by taking the tileW and dividig it by the deley(ms) we set.
             ** This will give us the distance to move on each ms, then we will multiply it
             ** by the time(ms) passed from the start of the move(ms). 
             ** This will give us the calculation of the pixels to move on each frame
             */
            if (this.tileTo[0] !== this.tileFrom[0]) {
                const diff = (tileW / this.deleyMove) * (t - this.timeMoved);
                this.position[0] += this.tileTo[0] < this.tileFrom[0] ? 0 - diff : diff;
            }

            if (this.tileTo[1] !== this.tileFrom[1]) {
                const diff = (tileH / this.deleyMove) * (t - this.timeMoved);
                this.position[1] += this.tileTo[1] < this.tileFrom[1] ? 0 - diff : diff;
            }

            this.position[0] = Math.round(this.position[0]);
            this.position[1] = Math.round(this.position[1]);

        }

        return true
   }
}

function toIndex(row, col) {
    /**
     ** helper to calculate the index based on the [row, col]
     */
    
    return (col * mapW) + row; // <== from the tutorial and doesnt make sence to me
    //return (row * mapW) + col
}


const player = new Character()

let gameMap = [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
	0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0,
	0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0,
	0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0,
	0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
	0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0,
	0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
	0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
	0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0,
	0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0,
	0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0,
	0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0,
	0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

const viewport = {
    screen     : [0,0], // canvas [width, height]
    startTile  : [0,0], // [row, col] of the starting tile to show
    endTile    : [0,0], // [row, col] of the ending tile to show
    offset     : [0,0], // offset to move [x, y]
    update     : function (px, py) {

        /**
         ** Formula to calculate the offset from the current position
         */
        this.offset[0] = Math.floor((this.screen[0] / 2) - px);
        this.offset[1] = Math.floor((this.screen[1] / 2) - py);

        /**
         ** Calculating the index position of the tile falling under the dead center of the camera position
         */
        const tile = [
            Math.floor(px / tileW),
            Math.floor(py / tileH)
        ];

        /**
         ** Formula to calculate the starting index to draw and the end index to draw
         */
        this.startTile[0] = tile[0] - 1 - Math.ceil((this.screen[0] / 2) / tileW);
        this.startTile[1] = tile[1] - 1 - Math.ceil((this.screen[1] / 2) / tileH);

        if (this.startTile[0] < 0) { this.startTile[0] = 0; }
        if (this.startTile[1] < 0) { this.startTile[1] = 0; }

        this.endTile[0] = tile[0] + 1 + Math.ceil((this.screen[0] / 2) / tileW)
        this.endTile[1] = tile[1] + 1 + Math.ceil((this.screen[1] / 2) / tileH)

        if (this.endTile[0] >= 0) { this.endTile[0] = mapW - 1; }
        if (this.endTile[1] >= 0) { this.endTile[1] = mapH - 1; }

    }
}

function drawGame() {
    const sec = Math.floor(Date.now() / 1000); // counting seconds
    const currentFrameTime = Date.now();
    const timeElapsed = currentFrameTime - lastFrameTime;

    if (sec !== currentSecond) { 
        currentSecond = sec; 
        framesLastSecond = frameCount;
        frameCount = 1;
    } else {
        frameCount++;
    }

    // if we not moving now
    if (!player.processMovment(currentFrameTime)) {
        // based on the key pressed set the new [row, col] values
        if (keysDown[38] && player.tileFrom[1] > 0 && gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] - 1)] === 1) {
            player.tileTo[1] -= 1;
        } 
        else if (keysDown[40] && player.tileFrom[1] < mapH - 1 && gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] + 1)] === 1) {
        
            player.tileTo[1] += 1;
        } 
        else if (keysDown[37] && player.tileFrom[0] > 0 && gameMap[toIndex(player.tileFrom[0] - 1, player.tileFrom[1])] === 1) {
            player.tileTo[0] -= 1;
        } 
        else if (keysDown[39] && player.tileFrom[0] < mapW - 1 && gameMap[toIndex(player.tileFrom[0] + 1, player.tileFrom[1])] === 1) {
            player.tileTo[0] += 1;
        }

        // update the {timeMoved} with the current timestemp
        if (player.tileFrom[0] !== player.tileTo[0] || player.tileFrom[1] !== player.tileTo[1]) {
            player.timeMoved = currentFrameTime;
        }
    }

    viewport.update(
        player.position[0] + (player.dimentsions[0] / 2), 
        player.position[1] + (player.dimentsions[1] / 2)
    );

    
    /**
     ** Drawing black bg under the map
     */
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, viewport.screen[0], viewport.screen[1])
    
    for (let y = viewport.startTile[1]; y <= viewport.endTile[1]; y++) {
        for (let x = viewport.startTile[0]; x <= viewport.endTile[0]; x++) {
            switch(gameMap[((y*mapW) + x)]) {
                case 0: 
                    ctx.fillStyle = "#999"
                    break;
                default: 
                    ctx.fillStyle = "#eee"
            } 
            /**
             ** Drawing tiles
             */
            ctx.fillRect(
                viewport.offset[0] + x * tileW, 
                viewport.offset[1] + y * tileH, 
                tileW, 
                tileH
            );
        }
    }

    /**
     ** Drawing player
     */
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(
        viewport.offset[0] + player.position[0], 
        viewport.offset[1] + player.position[1], 
        player.dimentsions[0], 
        player.dimentsions[1]
    );

    ctx.fillStyle = "#ff0000"
    ctx.fillText("FPS:" + framesLastSecond, 10, 20);
    lastFrameTime = currentFrameTime;
    requestAnimationFrame(drawGame);
}

(function() {
    window.addEventListener("keydown", e => {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            keysDown[e.keyCode] = true
            
        }
    })
    window.addEventListener("keyup", e => {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            keysDown[e.keyCode] = false
        }
    })

    viewport.screen = [
        document.getElementById("canvas").width,
        document.getElementById("canvas").height,
    ]

    requestAnimationFrame(drawGame);
    ctx.font = "bold 14pt sans-sarif";
})()