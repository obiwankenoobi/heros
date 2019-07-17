

const ctx = document.getElementById("canvas").getContext("2d");
let tileW = 40, tileH = 40;
let mapW = 20, mapH = 20;
let player;
let players = [];
let socket;
let currentSecond = 0, frameCount = 0, framesLastSecond = 0;
let lastFrameTime = 0;
let hero;
let direction = "40";
let lastDirection = "40";
let heros = []
let characterIdx;
let characters= [
    "../images/spritexb-1.png",
    "../images/spritexb-2.png",
    "../images/spritexb-3.png",
    "../images/spritexb-4.png",
    "../images/spritexb-5.png",
]
const keysDown = {
    37: false, 
    38: false,
    39: false,
    40: false
}

class Character {
   constructor(row, col) {
       this.tileFrom    = [row, col];   // where player come from [row, col]
       this.tileTo      = [row, col];   // where player is going [row, col]
       this.timeMoved   = 0;            // when movment started
       this.dimentsions = [32, 32];     // size of character [width, height]
       this.position    = [this.calcPosition(row, col)[0], this.calcPosition(row, col)[1]];     // position in [x, y] relative to top-left corner
       this.deleyMove   = 400;          // how long it take to move 1 tile in ml
   } 


   calcPosition(row, col) {
        return  [
            row * tileW + (tileW - this.dimentsions[0]) / 2,
            col * tileH + (tileH - this.dimentsions[1]) / 2
        ]
   }

   placeAt(row, col) {
        this.tileFrom = [row, col];
        this.tileTo   = [row, col];
        this.position = [
            (row * tileW) + ((tileW - this.dimentsions[0]) / 2), 
            (col * tileH) + ((tileH - this.dimentsions[1]) / 2)
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
            direction = null;
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
            // up
            player.tileTo[1] -= 1;
        } 
        else if (keysDown[40] && player.tileFrom[1] < mapH - 1 && gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] + 1)] === 1) {
            // down
            player.tileTo[1] += 1;
        } 
        else if (keysDown[37] && player.tileFrom[0] > 0 && gameMap[toIndex(player.tileFrom[0] - 1, player.tileFrom[1])] === 1) {
            // right
            player.tileTo[0] -= 1;
        } 
        else if (keysDown[39] && player.tileFrom[0] < mapW - 1 && gameMap[toIndex(player.tileFrom[0] + 1, player.tileFrom[1])] === 1) {
            // left
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
     ** Drawing online players
     */
    for (const key in players) {
        if (key !== socket.id) {


            ctx.beginPath()
            ctx.rect(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1], player.dimentsions, player.dimentsions);

            const { hero } = heros[players[key].characterState.characterIdx];
            const { characterState } = players[key];
            console.log(hero);
            console.log(characterState);
            switch(characterState.direction) {
                case 37:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"37");
                    break;
        
                case 38:;
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"38");
                    break;;
        
                case 39:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"39");
                    break;
        
                case 40:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"40");
                    break;
        
                default:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],characterState.lastDirection, true);
            }
            ctx.closePath();

        }
     }


    /**
     ** Drawing player
     */
    ctx.beginPath();
    ctx.rect(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1], player.dimentsions, player.dimentsions);
    const { hero } = heros[characterIdx]
    switch(direction) {
        case 37:
            hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],"37");
            break;

        case 38:
            hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],"38");
            break;

        case 39:
            hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],"39");
            break;

        case 40:
            hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],"40");
            break;

        default:
            hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],lastDirection, true);
    }
    ctx.closePath();




    socket.emit("move", { position:player.position, id:socket.id, characterState: { direction, lastDirection, characterIdx }  });

    ctx.fillStyle = "#ff0000"
    ctx.fillText("FPS:" + framesLastSecond, 10, 20);
    lastFrameTime = currentFrameTime;
    requestAnimationFrame(drawGame);
}

function randomSpawn() {
    return [Math.ceil(Math.random() * 18), Math.ceil(Math.random() * 18)]
}

function randomColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}

(function() {

    let rowCol = randomSpawn()
    let row = rowCol[0];
    let col = rowCol[1];

    while (gameMap[toIndex(row, col)] !== 1) {
        rowCol = randomSpawn()
        row = randomSpawn()[0];
        col = randomSpawn()[1]
    }

    // new player init
    player = new Character(row, col)
    socket = io.connect("http://localhost:3000");


    characterIdx = Math.floor(Math.random() * 5).toString();

    for (let idx = 0; idx < characters.length; idx++) {
        let hero;
        hero = new Sprite("../images/spritexb-" + idx + ".png" , 4, 4);
        hero.load(ctx);
        hero.animate("40", 100, 0); // down
        hero.animate("37", 100, 1); // right 
        hero.animate("39", 100, 2); // left 
        hero.animate("38", 100, 3); // up
        heros.push({ hero, direction, lastDirection })
    }


    socket.emit("start", { position:player.position, id:socket.id, characterState: { direction, lastDirection, characterIdx } });

    socket.on("heartbeat", data => {
        players = data;
    });


    window.addEventListener("keydown", e => {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            keysDown[e.keyCode] = true;
            direction = e.keyCode;
            lastDirection = e.keyCode.toString();
        }
    });

    window.addEventListener("keyup", e => {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            keysDown[e.keyCode] = false;

        }
    });


    viewport.screen = [
        document.getElementById("canvas").width,
        document.getElementById("canvas").height,
    ];

    requestAnimationFrame(drawGame);
    ctx.font = "bold 14pt sans-sarif";
})()