


const ctx = document.getElementById("canvas").getContext("2d");
let tileW = 32, tileH = 32;
const viewport = new Viewport(tileW, tileH)
let mapW = 20, mapH = 20; // width and height of map

// tiles
let grass;
let lightGrass;
let waterfall;

let keyDownPressedTime; // when key was pressed
let keyUpPressedTime; // when key was up
let player; // my player (Character object)

let stats; // for my stats 

let started = false; // if game started
let players = []; // array of players in the game
let monsters = {}; // object of monsters in the game

let socket; // socket instance
let currentSecond = 0, frameCount = 0, framesLastSecond = 0; // frames count
let lastFrameTime = 0; // last frame time in ms

let underAttack = false; // player is under attack

let monsterDirection = "40"; // monster direction (need to check if needed)
let powerInState = ""; // current power move in state
let fightMoveInState = ""; // current fight move in state

let direction = "40"; // current direction
let lastDirection = "40"; // last direction that we moved to
let lastDirectionLeftRight = "37" // last diretion which was left or right


let heros = []; // array of heros to choose from (Character obj[])
let herosOnline = []; // array of heros to choose from for online players (Character obj[]) 
let herosPowers = []; // Sprite[] for powers
let herosPowersOnline = [];// Sprite[] for powers for online users
let characterIdx; 


const characters= [
    "../images/spritexb-0.png",
    "../images/spritexb-1.png",
    "../images/spritexb-2.png",
    "../images/spritexb-3.png",
    "../images/spritexb-4.png",

];


const powers = [
    "../images/power-0.png",
    "../images/power-1.png"
]

const powersKeys = { 69:0, 82:1 }

const directionKeyDown = {
    37: false, 
    38: false,
    39: false,
    40: false,

    81: false // fighting
}

const powersKeyDown = {
    69: false, 
    82: false
}

const fightKeyDown = {
    81: false
}


class Stats {
    constructor() {
        this.life = 100;
        this.mana = 100;
        this.exp = 100;
        this.ctx = null;
        this.lifeWidth = this.life * 0.01 ;
        this.manaWidth = this.mana * 0.01 ;
        this.expWidth = this.exp * 0.01;
        this.frame;
        this.stats;
    }

    load(ctx) {
        this.frame = new Image()
        this.stats = new Image()
        this.ctx = ctx;
        this.stats.src = "../images/ui_stats.png"
        this.frame.src = "../images/ui_frame.png"

        // return new Promise((resolve, reject) => {
        //     stats.onload = function() {
        //         this.frame.onload = resolve;
        //     }
        // });

    }

    drawFrame() {
      ctx.drawImage(this.frame, 10, 10, this.frame.width, this.frame.height)
    }

    decrease(name, value) {
        this[name] = this.name - value;
        this[`${name}Width`] = this[`${name}Width`] - value
    }

    increase(name, value) {
        this[name] = this.name + value;
        this[`${name}Width`] = this[`${name}Width`] + value
    }

    drawLife() {
        ctx.drawImage(
            this.stats, 0, 0, 
            this.stats.width, 
            16, 82, 18 ,
            this.stats.width * this.lifeWidth, 
            16)
    }

    drawMana() {
        ctx.drawImage(
            this.stats, 0, 32, 
            this.stats.width, 
            16, 82, 50 ,
            this.stats.width * this.manaWidth, 
            16)
    }

    drawExp() {
        ctx.drawImage(
            this.stats, 0, 20, 
            this.stats.width, 
            16, 82, 38 ,
            this.stats.width * this.expWidth, 
            16)
    }

    draw() {
        this.drawFrame()
        this.drawMana()
        this.drawLife()
        this.drawExp()
    }
}


class Character {
   constructor(x, y) {
       this.tileFrom    = [x, y];   // where player come from [x, y]
       this.tileTo      = [x, y];   // where player is going [x, y]
       this.timeMoved   = 0;            // when movment started
       this.dimentsions = [32, 32];     // size of character [width, height]
       this.position    = [this.calcPosition(x, y)[0], this.calcPosition(x, y)[1]];     // position in [x, y] relative to top-left corner
       this.deleyMove   = 400;          // how long it take to move 1 tile in ml
   } 


   calcPosition(x, y) {
        return  [
            x * tileW + (tileW - this.dimentsions[0]) / 2,
            y * tileH + (tileH - this.dimentsions[1]) / 2
        ]
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

function isObjEmpty(obj) {
    return Object.entries(obj).length === 0 && obj.constructor === Object
  }
  

function toIndex(x, y) {
    /**
     ** helper to calculate the index based on the [x, y]
     */
    
    return (y * mapW) + x;
    
}




const gameMap = [
	0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 2, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2, 2, 0,
	0, 2, 3, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2, 2, 0,
	0, 2, 3, 1, 4, 4, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 0,
	0, 2, 3, 1, 1, 4, 4, 1, 2, 3, 3, 2, 1, 1, 2, 1, 0, 0, 0, 0,
	0, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 2, 4, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0,
	0, 1, 1, 1, 1, 2, 4, 4, 4, 4, 4, 1, 1, 1, 2, 2, 2, 2, 1, 0,
	0, 1, 1, 1, 1, 2, 3, 2, 1, 1, 4, 1, 1, 1, 1, 3, 3, 2, 1, 0,
	0, 1, 2, 2, 2, 2, 1, 2, 1, 1, 4, 1, 1, 1, 1, 1, 3, 2, 1, 0,
	0, 1, 2, 3, 3, 2, 1, 2, 1, 1, 4, 4, 4, 4, 4, 4, 4, 2, 4, 4,
	0, 1, 2, 3, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0,
	0, 1, 2, 3, 4, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 2, 1, 0,
	0, 3, 2, 3, 4, 4, 1, 2, 2, 2, 2, 2, 2, 2, 1, 3, 1, 2, 1, 0,
	0, 3, 2, 3, 4, 4, 3, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 3, 0,
	0, 3, 2, 3, 4, 1, 3, 2, 1, 3, 1, 1, 1, 2, 1, 1, 1, 2, 3, 0,
	0, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 1, 2, 2, 2, 2, 2, 3, 0,
	0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 4, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}


function drawGame() {

    const sec = Math.floor(Date.now() / 1000); // counting seconds
    const currentFrameTime = Date.now();
    const timeElapsed = currentFrameTime - lastFrameTime;
    let safeAreas = {
        1: true,
        2: true,
        3: true,
        4: false
    };

    if (sec !== currentSecond) { 
        
        currentSecond = sec; 
        framesLastSecond = frameCount;
        frameCount = 1;
        underAttack = false;
        for (const i in monsters) {
            if (monsters[i].tileTo[0] === player.tileTo[0] && 
                monsters[i].tileTo[1] === player.tileTo[1] && !monsters[i].isDead) {
                
                underAttack = true;
                stats.decrease("life", 0.1)
                console.log(stats.lifeWidth)
            } 



            if (fightMoveInState) {
                if (
                    // monsteer from ours right
                    (monsters[i].tileTo[0] - 1 === player.tileTo[0] && // monster one tile right to us
                    monsters[i].tileTo[1]  === player.tileTo[1] && 
                    lastDirection === "39") || 

                    // monster form our left
                    (monsters[i].tileTo[0] + 1 === player.tileTo[0] && // monster one tile left to us
                        monsters[i].tileTo[1]  === player.tileTo[1] && // monster is right to player
                        lastDirection === "37") ||

                    // monster form our top
                    (monsters[i].tileTo[0]  === player.tileTo[0] && // monster one tile left to us
                        monsters[i].tileTo[1] + 1 === player.tileTo[1] && // monster is right to player
                        lastDirection === "38") ||

                    // monster form our bottom
                    (monsters[i].tileTo[0]  === player.tileTo[0] && // monster one tile left to us
                        monsters[i].tileTo[1] - 1 === player.tileTo[1] && // monster is right to player
                        lastDirection === "40") 
                    ) {
                       // monstersKilled[i] = monsters[i];
                        monsters[i].isDead = true;
                    
                    }
            }




        }
    } else {
        frameCount++;
    }

  

    // if we not moving now
    if (!player.processMovment(currentFrameTime)) {
        // based on the key pressed set the new [x, y] values
        if (directionKeyDown[38] && player.tileFrom[1] > 0) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] - 1)]]) {
                // up
                player.tileTo[1] -= 1;
            } else {
                //direction = null;
            }

        } 

        else if (directionKeyDown[40] && player.tileFrom[1] < mapH - 1) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] + 1)]]) {
                // down
                player.tileTo[1] += 1;
            } else {
                //direction = null;
            }
        } 

        else if (directionKeyDown[37] && player.tileFrom[0] > 0) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0] - 1, player.tileFrom[1])]]) {
                // right
                player.tileTo[0] -= 1;
            } else {
                //direction = null;
            }
        } 

        else if (directionKeyDown[39] && player.tileFrom[0] < mapW - 1) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0] + 1, player.tileFrom[1])]]) {
                // left
                player.tileTo[0] += 1;
            } else {
               // direction = null;
            }
        }

        // update the {timeMoved} with the current timestemp
        if (player.tileFrom[0] !== player.tileTo[0] || player.tileFrom[1] !== player.tileTo[1]) {
            player.timeMoved = currentFrameTime;
        }
    }


        // ####################### MONSTER MOVMENT #######################
        for (const i in monsters) {
            if (monsters.hasOwnProperty(i)) {
                
                const { monsterState: { monsterDirectionKeyDown } , monster } = monsters[i];
                if (!monster.processMovment(currentFrameTime)) {
    
                    // based on the key pressed set the new [x, y] values
                    if (monsterDirectionKeyDown[38] && monster.tileFrom[1] > 0) {
                        if (safeAreas[gameMap[toIndex(monster.tileFrom[0], monster.tileFrom[1] - 1)]]) {
                            // up
                            monster.tileTo[1] -= 1;
                        } 
                        else {
                            monsterDirection = null;
                        }
            
                    } 
            
                    else if (monsterDirectionKeyDown[40] && monster.tileFrom[1] < mapH - 1) {
                        if (safeAreas[gameMap[toIndex(monster.tileFrom[0], monster.tileFrom[1] + 1)]]) {
                            // down
                            monster.tileTo[1] += 1;
                        } 
                        else {
                            monsterDirection = null;
                        }
                    } 
            
                    else if (monsterDirectionKeyDown[37] && monster.tileFrom[0] > 0) {
                        if (safeAreas[gameMap[toIndex(monster.tileFrom[0] - 1, monster.tileFrom[1])]]) {
                            // right
                            monster.tileTo[0] -= 1;
                        } 
                        else {
                            monsterDirection = null;
                        }
                    } 
            
                    else if (monsterDirectionKeyDown[39] && monster.tileFrom[0] < mapW - 1) {
                        if (safeAreas[gameMap[toIndex(monster.tileFrom[0] + 1, monster.tileFrom[1])]]) {
                            // left
                            monster.tileTo[0] += 1;
                        } else {
                            monsterDirection = null;
                        }
                    }
            
                    // update the {timeMoved} with the current timestemp
                    if (monster.tileFrom[0] !== monster.tileTo[0] || monster.tileFrom[1] !== monster.tileTo[1]) {
                        monster.timeMoved = currentFrameTime;
                    }
                }
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
            const currentIdxVal = gameMap[((y*mapW) + x)] 
            switch(currentIdxVal) {
                case 0: 
                    ctx.fillStyle = "#999";
                    break;
                case 1:
                    ctx.fillStyle = "#99cc99";
                    break;
                case 3: 
                    ctx.fillStyle = "#3C583B";
                    break;
                case 2:
                    ctx.fillStyle = "#ffdb99";
                    break;
                case 4:
                    ctx.fillStyle = "#7fbfff";
                    break;
                default: 
                    ctx.fillStyle = "#eee";
            } 
            /**
             ** Drawing tiles
             */
            if (currentIdxVal === 1) {
                ctx.drawImage(lightGrass, viewport.offset[0] + x * tileW, viewport.offset[1] + y * tileH)
                
            } else if (currentIdxVal === 3) {
                ctx.drawImage(grass, viewport.offset[0] + x * tileW, viewport.offset[1] + y * tileH)
            } else if (currentIdxVal === 4) {
                waterfall.run(
                    viewport.offset[0] + x * tileW + 15, 
                    viewport.offset[1] + y * tileH + 40, 
                    "waterfall")
                console.log("waterfall", waterfall)
            } else {
                ctx.fillRect(
                    viewport.offset[0] + x * tileW, 
                    viewport.offset[1] + y * tileH, 
                    tileW, 
                    tileH
                );
            }

        }
    }





    /**
     ** Drawing online players
     */    
    for (const key in players) {
        if (key !== socket.id) {

            ctx.beginPath()
            ctx.rect(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1], player.dimentsions, player.dimentsions);

            const { hero } = herosOnline[players[key].characterState.characterIdx];
            const { characterState } = players[key];

            if (characterState.powerInState) {
                let powersOffSetX = 0;
                let powersOffSetY = 0;
                
                switch(powersKeys[characterState.powerInState]) {
                    case 0: {
                        powersOffSetX = - 18;
                        powersOffSetY = - 10;
                        break;
                    }
                    case 1: {
                        powersOffSetX = - 16;
                        powersOffSetY = 11;
                        break;
                    }
                }
                const { power } = herosPowersOnline[powersKeys[characterState.powerInState]];
                power.run(viewport.offset[0] + players[key].position[0] + powersOffSetX, viewport.offset[1] + players[key].position[1] + powersOffSetY, characterState.powerInState);
            } 
            
            if (characterState.direction) {
               switch(characterState.direction) {
                case 37:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"37");
                    break;
        
                case 38:;
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"38");
                    break;
        
                case 39:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"39");
                    break;
        
                case 40:
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],"40");
                    break;
        
                default:
                    break;
                }

            } else if (characterState.fightMoveInState) {
                
                let fightingOffSetX = 0;
                let fightingOffSetY = 0;
                
                switch(characterState.fightMoveInState) {
        
                    case "81": {
                        fightingOffSetX = 0;
                        fightingOffSetY = 0;
                        switch (characterState.lastDirection) {
                            case "37":
                            hero.run(
                                viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                                viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                                "81", false);
                            break;
                
                            case "38":
                                hero.run(
                                    viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                                    viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                                    "8111", false);
                                break;
                    
                            case "39":
                                hero.run(
                                    viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                                    viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                                    "811", false);
                                break;
                    
                            case "40":
                                hero.run(
                                    viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                                    viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                                    "81111", false);
                                break;
                    
                            default:
                                break;
                        }
                        break;
                    }

                    default:
                        break;
                }
        
            } else if (characterState.underAttack) {
      
                let fightingOffSetX = 0;
                let fightingOffSetY = 0;
               
                
                if (characterState.lastDirectionLeftRight === 37) {
                  
                    hero.run(
                        viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                        viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                        "underAttackRight", false);
                } else {
                    hero.run(
                        viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                        viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                        "underAttackLeft", false);
                }

            } else {
                // if none of the above 
                // simply show the standing sprite
                // in the last direction we moved
                hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],characterState.lastDirection, true);
            }
            ctx.closePath();
        }
     }


    /**
     ** Drawing player
     */

     
    if (powerInState) {
        let powersOffSetX = 0;
        let powersOffSetY = 0;

        switch(powersKeys[powerInState]) {
            case 0: {
                powersOffSetX = - 18;
                powersOffSetY = - 10;
                break;
            }
            case 1: {
                powersOffSetX = - 16;
                powersOffSetY = 11;
                break;
            }
        }
        const { power } = herosPowers[powersKeys[powerInState]];
        power.run(viewport.offset[0] + player.position[0] + powersOffSetX, viewport.offset[1] + player.position[1] + powersOffSetY, powerInState);

    } 

    
    
    if (direction) {

        const { hero } = heros[characterIdx]; 
        ctx.beginPath();
        let playerOffSetX = 0;
        let playerOffSetY = 0;
        ctx.rect(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1], player.dimentsions, player.dimentsions);
    
        switch(direction) {
            
            case 37:
                hero.run(viewport.offset[0] + player.position[0] + playerOffSetX, viewport.offset[1] + player.position[1] + playerOffSetY,"37");
                break;
    
            case 38:
                hero.run(viewport.offset[0] + player.position[0] + playerOffSetX, viewport.offset[1] + player.position[1] + playerOffSetY,"38");
                break;
    
            case 39:
                hero.run(viewport.offset[0] + player.position[0] + playerOffSetX, viewport.offset[1] + player.position[1] + playerOffSetY,"39");
                break;
    
            case 40:
                hero.run(viewport.offset[0] + player.position[0] + playerOffSetX, viewport.offset[1] + player.position[1] + playerOffSetY,"40");
                break;

            default:
                break;
        }

    } else if (fightMoveInState) {

        let fightingOffSetX = 0;
        let fightingOffSetY = 0;
        const { hero } = heros[characterIdx];
        
        switch(fightMoveInState) {

            case "81": {
                fightingOffSetX = 0;
                fightingOffSetY = 0;
                
                switch (lastDirection) {
                    case "37":
                        hero.run(
                            viewport.offset[0] + player.position[0] + fightingOffSetX, 
                            viewport.offset[1] + player.position[1] + fightingOffSetY, 
                            "81", false);
                    break;
        
                    case "38":
                        hero.run(
                            viewport.offset[0] + player.position[0] + fightingOffSetX, 
                            viewport.offset[1] + player.position[1] + fightingOffSetY, 
                            "8111", false);
                        break;
            
                    case "39":
                        hero.run(
                            viewport.offset[0] + player.position[0] + fightingOffSetX, 
                            viewport.offset[1] + player.position[1] + fightingOffSetY, 
                            "811", false);
                        break;
            
                    case "40":
                        hero.run(
                            viewport.offset[0] + player.position[0] + fightingOffSetX, 
                            viewport.offset[1] + player.position[1] + fightingOffSetY, 
                            "81111", false);
                        break;
            
                    default:
                        break;
                }
            }

            default:
                break;
        }

    } else if (underAttack) {
      
        let fightingOffSetX = 0;
        let fightingOffSetY = 0;
        const { hero } = heros[characterIdx];
        
        if (lastDirectionLeftRight === 37) {
       
            hero.run(
                viewport.offset[0] + player.position[0] + fightingOffSetX, 
                viewport.offset[1] + player.position[1] + fightingOffSetY, 
                "underAttackRight", false);
        } else {
            hero.run(
                viewport.offset[0] + player.position[0] + fightingOffSetX, 
                viewport.offset[1] + player.position[1] + fightingOffSetY, 
                "underAttackLeft", false);
        }

    } else  {
        // if none of the above 
        // simply show the standing sprite
        // in the last direction we moved
        const { hero } = heros[characterIdx];
        hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1],lastDirection, true);
    }
    ctx.closePath();



    /**
     ** Draw Monster
     */

     for (const m in monsters) {

         if (monsters.hasOwnProperty(m)) {
             if (!monsters[m].isDead) {             
                const { monsterAnim, monsterState: { lastDirectionMonster, directionMonster }, monster, monsterCharacterId } = monsters[m];
                let monsterOffSetX = 0;
                let monsterOffSetY = 0;
                switch(monsterCharacterId) {
                    case 0: {
                        monsterOffSetX = 0;
                        monsterOffSetY = 0;
                        breakmonster
                    }
                    case 1: {
                        monsterOffSetX = 5;
                        monsterOffSetY = 20;
                        break;
                    }
                }


                ctx.beginPath();
                ctx.rect(viewport.offset[0] + monster.position[0], viewport.offset[1] + monster.position[1], monster.dimentsions, monster.dimentsions);
                
                switch(directionMonster) {
                    
                    case 37:
                        monsterAnim.run(viewport.offset[0] + monster.position[0] + monsterOffSetX, viewport.offset[1] + monster.position[1] + monsterOffSetY , "37");
                        break;
            
                    case 38:
                        monsterAnim.run(viewport.offset[0] + monster.position[0] + monsterOffSetX, viewport.offset[1] + monster.position[1] + monsterOffSetY , "38");
                        break;
            
                    case 39:
                        monsterAnim.run(viewport.offset[0] + monster.position[0] + monsterOffSetX, viewport.offset[1] + monster.position[1] + monsterOffSetY , "39");
                        break;
            
                    case 40:
                        monsterAnim.run(viewport.offset[0] + monster.position[0] + monsterOffSetX, viewport.offset[1] + monster.position[1] + monsterOffSetY , "40");
                        break;
            
                    default:
                        monsterAnim.run(viewport.offset[0] + monster.position[0] + monsterOffSetX, viewport.offset[1] + monster.position[1], lastDirectionMonster, true);
                }
                ctx.closePath();
            }
         }
     }


    const monstersOnMove = {}
    if (!isObjEmpty(monsters)) {
        for (const monster in monsters) {
            
            monstersOnMove[monster] = {
                id: monsters[monster].id,
                position: monsters[monster].monster.position,
                monsterState: monsters[monster].monsterState,
                monsterCharacterId: monsters[monster].monsterCharacterId,
                tileTo:monsters[monster].monster.tileTo,
                isDead:monsters[monster].isDead
            }

         
        }

    }

   // if (monstersmonsters.length) {
        if (started) {
            
            socket.emit("move", { 
                position: player.position, 
                id: socket.id, 
                characterState: { 
                    direction, 
                    lastDirection, 
                    characterIdx,
                    powerInState,
                    lastDirectionLeftRight,
                    fightMoveInState,
                    underAttack,
                    row: player.tileTo[0],
                    col: player.tileTo[1]
                },
                monsters: monstersOnMove,
            });


        }

        
    



    ctx.fillStyle = "#ff0000"
    ctx.fillText("FPS:" + framesLastSecond, ctx.canvas.width - 70, ctx.canvas.height - 20);
    lastFrameTime = currentFrameTime;


    stats.draw()
    // ctx.beginPath()
    // ctx.fillStyle = "#ff0000"
    // ctx.fillRect(20, 20, 40, 10);
    // ctx.closePath()


    requestAnimationFrame(drawGame);
}

function randomSpawn() {
    return [Math.ceil(Math.random() * 18), Math.ceil(Math.random() * 18)]
}

function randomColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}

(async function() {
    



    let xy = randomSpawn();
    let x = xy[0];
    let y = xy[1];



    while (gameMap[toIndex(x, y)] !== 1) {
        xy = randomSpawn()
        x = randomSpawn()[0];
        y = randomSpawn()[1];
    }

    // new player init
    player = new Character(x, y);
    stats = new Stats();
    stats.load(ctx)
    socket = io.connect("http://localhost:3000");
    characterIdx = Math.floor(Math.random() * 5).toString();


    grass = new Image()
    lightGrass = new Image()
    grass.src = "../images/32x32_grass.png"
    lightGrass.src = "../images/32x32_light_grass.png"

    waterfall = new Sprite("../images/32x32_water.png", 4, 1)
    waterfall.load(ctx)
    waterfall.animate("waterfall", 800, 0, 0 , 3)

    /**
     * 
     * @param {Array} arrToPushAnimationTo the holder for the animations
     * @param {Number} idx the current index we at in the images array
     * @param {String} direction default direction for the animation
     * @param {String} lastDirection default last direction for the animation
     */
    async function initAnimations(arrToPushAnimationTo, idx, direction, lastDirection) {
        let hero;
        hero = new Sprite("../images/spritexb-" + idx + ".png" , 13, 21);
        hero.load(ctx);
        console.log("loaded")
        hero.animate("40", 50, 10, 1, 9); // down
        hero.animate("37", 50,  9, 1, 9); // left 
        hero.animate("39", 50, 11, 1, 9); // right 
        hero.animate("38", 50,  8, 1, 9); // up
        console.log("hero", hero)
        switch (idx) {
            case 0:
                // spear 
                hero.animate("81"   , 100, 5, 3, 8); // q (fight - left)
                hero.animate("811"  , 100, 7, 3, 8); // q (fight - right)
                hero.animate("8111" , 100, 4, 3, 8); // q (fight - up)
                hero.animate("81111", 100, 6, 3, 8); // q (fight - dowm)
            break;

            case 1:
                // sward
                hero.animate("81"   , 100, 13, 0, 6); // q (fight - left)
                hero.animate("811"  , 100, 15, 0, 6); // q (fight - right)
                hero.animate("8111" , 100, 12, 0, 6); // q (fight - up)
                hero.animate("81111", 100, 14, 0, 6); // q (fight - dowm)
            break;


            case 2:
                // arrow
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)        
            break;

            case 3:
                // arrow
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)
            break;

            case 4:
                // dagger
                hero.animate("81"   , 100, 13, 0, 6);  // q (fight - left)
                hero.animate("811"  , 100, 15, 0, 6);  // q (fight - right)
                hero.animate("8111" , 100, 12, 0, 6);  // q (fight - up)
                hero.animate("81111", 100, 14, 0, 6);  // q (fight - dowm)
            break;
        
            default:
                break;
        }

        hero.animate("underAttackRight", 100, 5, 7, 9); // under attack - right
        hero.animate("underAttackLeft", 100, 7, 7, 9); // under attack - left
        arrToPushAnimationTo.push({ hero, direction, lastDirection });
    }


    /**
     ** Initial all images for my player
     */
    for (let idx = 0; idx < characters.length; idx++) {
        initAnimations(heros, idx, direction, lastDirection) 
    }

    /**
     ** Initial all images for online players
     */
    for (let idx = 0; idx < characters.length; idx++) {
        initAnimations(herosOnline, idx, direction, lastDirection) 
    }
     



    socket.on("heartbeat", data => {
        
        if (started) {
            players = data.players;
            
            for (const m in data.monsters) {
                // deleting monster that has been killed from client

                if (monsters[m]) {
                    const monster = data.monsters[m];
                    monsters[m].monsterState = monster.monsterState
                    monsters[m].monster.position = monster.position
                    monsters[m].monsterCharacterId = monster.monsterCharacterId
                    monsters[m].tileTo = monster.tileTo
                    monsters[m].id = monster.id
                    monsters[m].isDead = monster.isDead;

                
                } 
            }
        }
        
    });



    

    function createNewPowersAnim(arrOfHeros, idx, name, powersCols) {
        let power;
        power = new Sprite("../images/power-" + idx + ".png" , powersCols, 1);
        power.load(ctx);
        power.animate(name, 100, 0);
        arrOfHeros.push({ power });
    }



    /**
     ** Initial all powers for online players
     */
    createNewPowersAnim(herosPowersOnline, 0, "69", 25)
    createNewPowersAnim(herosPowersOnline, 1, "82", 20)




    /**
     ** Initial all powers for player
     */
    createNewPowersAnim(herosPowers, 0, "69", 25)
    createNewPowersAnim(herosPowers, 1, "82", 20)

    socket.on("start", data => {

        for (const i in data.monsters) {
            if (data.monsters.hasOwnProperty(i)) {
                
                const element = data.monsters[i];
                monster = new Character(data.monsters[i].tileTo[0], data.monsters[i].tileTo[1]);
                monster.deleyMove = 600;
                let monsterAnim;
                monsterAnim = new Sprite("../images/monster-" + 1 + ".png" , 3, 8);
        
                monsterAnim.load(ctx);
                monsterAnim.animate("40", 200, 0); // down
                monsterAnim.animate("37", 200, 7); // right 
                monsterAnim.animate("39", 200, 6); // left 
                monsterAnim.animate("38", 200, 3); // up

                monster.position = 
                    data.monsters[i].position;

                monsters[data.monsters[i].id] = {
                    monsterAnim, 
                    monster,
                    monsterState: data.monsters[i].monsterState,
                    id: data.monsters[i].id,
                    tileTo: data.monsters[i].tileTo,
                    monsterCharacterId: data.monsters[i].monsterCharacterId,
                    position: data.monsters[i].position,
                    isDead:data.monsters[i].isDead
                }
            }
        }
        
        started = true;

        
    })

    function start() {
        
        socket.emit("start", { 
            position: player.position, 
            id: socket.id, 
            characterState: { 
                direction, 
                lastDirection, 
                characterIdx, 
                powerInState 
            }
        });
    }


    start();



    
    window.addEventListener("keydown", e => {

        console.log(e.keyCode)

        // powers keys
        if (powersKeys.hasOwnProperty(e.keyCode.toString())) {
            powerInState = e.keyCode.toString();
        }


        if (e.keyCode >= 37 && e.keyCode <= 40 && !fightMoveInState) { 
            console.log("direction", direction)
            // {!fightMoveInState} wont allow walk and fight togeaher
            // remember if left or right was lasrt direction
            if (e.keyCode === 37 || e.keyCode === 39) {
                lastDirectionLeftRight = e.keyCode;
            }

            directionKeyDown[e.keyCode] = true;
            direction = e.keyCode;

            // only set last direction of key pressed isnt
            // fighting
            if (e.keyCode.toString() !== "81") {
                lastDirection = e.keyCode.toString();
            }

            // reset all key pressed except the current one            
            for (const key in directionKeyDown) {
                if (key !== e.keyCode.toString()) {
                    directionKeyDown[key] = false;
                }
            }
        }

        // speed up
        if (e.keyCode === 32) {
            player.deleyMove = 200;
            for (const key in heros[characterIdx].hero.animations) {
                heros[characterIdx].hero.animations[key].duration = 20;
            }
            console.log("direction", direction)
        }

        // fighting keys
        if (fightKeyDown.hasOwnProperty(e.keyCode.toString())) {
            fightMoveInState = e.keyCode.toString();
            for (const key in directionKeyDown) {
                directionKeyDown[key] = false;
            }
           
        }




    });

    window.addEventListener("keyup", e => {
        const { hero } = heros[characterIdx]; 
        hero.reset();
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            directionKeyDown[e.keyCode] = false;
        }
        if (e.keyCode === 32) {
            player.deleyMove = 400;
            for (const key in heros[characterIdx].hero.animations) {
                heros[characterIdx].hero.animations[key].duration = 50;
            }
        }
        
        if (fightKeyDown.hasOwnProperty(e.keyCode.toString())) {
            fightMoveInState = "";
        }

        if (powersKeys[e.keyCode] || powersKeys[e.keyCode] === 0) {
            powerInState = "";
        }
    });


    viewport.screen = [
        document.getElementById("canvas").width,
        document.getElementById("canvas").height,
    ];

    requestAnimationFrame(drawGame);
    ctx.font = "bold 14pt sans-sarif";
})()