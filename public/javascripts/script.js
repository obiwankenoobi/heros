

const ctx = document.getElementById("canvas").getContext("2d");
let tileW = 40, tileH = 40;
const viewport = new Viewport(tileW, tileH)
let mapW = 20, mapH = 20; // width and height of map

let keyDownPressedTime; // when key was pressed
let keyUpPressedTime; // when key was up
let player; // my player (Character object)

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

function isObjEmpty(obj) {
    return Object.entries(obj).length === 0 && obj.constructor === Object
  }
  

function toIndex(row, col) {
    /**
     ** helper to calculate the index based on the [row, col]
     */
    
    return (col * mapW) + row;
    
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
	0, 1, 2, 3, 4, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 0,
	0, 3, 2, 3, 4, 4, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 1, 0,
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
            if (monsters[i].row === player.tileTo[0] && monsters[i].col === player.tileTo[1]) {
                console.log("under attack")
                underAttack = true;
            } 
        }
    } else {

        frameCount++;
    }

    // if we not moving now
    if (!player.processMovment(currentFrameTime)) {
        // based on the key pressed set the new [row, col] values
        if (directionKeyDown[38] && player.tileFrom[1] > 0) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] - 1)]]) {
                // up
                player.tileTo[1] -= 1;
            } else {
                direction = null;
            }

        } 

        else if (directionKeyDown[40] && player.tileFrom[1] < mapH - 1) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0], player.tileFrom[1] + 1)]]) {
                // down
                player.tileTo[1] += 1;
            } else {
                direction = null;
            }
        } 

        else if (directionKeyDown[37] && player.tileFrom[0] > 0) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0] - 1, player.tileFrom[1])]]) {
                // right
                player.tileTo[0] -= 1;
            } else {
                direction = null;
            }
        } 

        else if (directionKeyDown[39] && player.tileFrom[0] < mapW - 1) {
            if (safeAreas[gameMap[toIndex(player.tileFrom[0] + 1, player.tileFrom[1])]]) {
                // left
                player.tileTo[0] += 1;
            } else {
                direction = null;
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
    
                    // based on the key pressed set the new [row, col] values
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
            switch(gameMap[((y*mapW) + x)]) {
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

            const { hero } = herosOnline[players[key].characterState.characterIdx];
            const { characterState } = players[key];

            if (characterState.powerInState) {
                let powersOffSetX = 0;
                let powersOffSetY = 0;

                switch(powersKeys[characterState.powerInState]) {
                    case 0: {
                        powersOffSetX = -34;
                        powersOffSetY = -22;
                        break;
                    }
                    case 1: {
                        powersOffSetX = -32;
                        powersOffSetY = -10;
                        break;
                    }
                }
                const { power } = herosPowersOnline[powersKeys[characterState.powerInState]];
                power.run(viewport.offset[0] + players[key].position[0] + powersOffSetX, viewport.offset[1] + players[key].position[1] + powersOffSetY, characterState.powerInState);
            } else if (characterState.fightMoveInState) {
                console.log("characterState.fightMoveInState", characterState.fightMoveInState)
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
                        
                        // if (characterState.lastDirectionLeftRight === 37) {
                
                        //     hero.run(
                        //         viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                        //         viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                        //         "81", false);
                        // } else {
                        //     hero.run(
                        //         viewport.offset[0] + players[key].position[0]  + fightingOffSetX, 
                        //         viewport.offset[1] + players[key].position[1]  + fightingOffSetY, 
                        //         "811", false);
                        // }
        
                        break;
                    }

                    default:
                }
        
            } else if (characterState.underAttack) {
      
                let fightingOffSetX = 0;
                let fightingOffSetY = 0;
               
                
                if (characterState.lastDirectionLeftRight === 37) {
                    console.log("lastDirectionLeftRight", characterState.lastDirectionLeftRight)
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
                // we put this block here to prevent the animation to start when
                // the animation of fighting is on
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
                    hero.run(viewport.offset[0] + players[key].position[0], viewport.offset[1] + players[key].position[1],characterState.lastDirection, true);
                }
            }
            ctx.closePath();

        }
     }


    /**
     ** Drawing player
     */

    if (direction) {
        console.log("heros[characterIdx]", heros)
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
            //hero.reset(0)
               // hero.run(viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1], lastDirection, true);
        }
        ctx.closePath();
    } else if (powerInState) {
        let powersOffSetX = 0;
        let powersOffSetY = 0;

        switch(powersKeys[powerInState]) {
            case 0: {
                powersOffSetX = -34;
                powersOffSetY = -22;
                break;
            }
            case 1: {
                powersOffSetX = -32;
                powersOffSetY = -10;
                break;
            }
        }
        const { power } = herosPowers[powersKeys[powerInState]];
        power.run(viewport.offset[0] + player.position[0] + powersOffSetX, viewport.offset[1] + player.position[1] + powersOffSetY, powerInState);

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
        }

    } else if (underAttack) {
      
        let fightingOffSetX = 0;
        let fightingOffSetY = 0;
        const { hero } = heros[characterIdx];
        
        if (lastDirectionLeftRight === 37) {
            console.log("lastDirectionLeftRight", lastDirectionLeftRight)
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


   // if (!underAttack && !fightMoveInState) {

   // }




    /**
     ** Draw Monster
     */

     for (const m in monsters) {

         if (monsters.hasOwnProperty(m)) {
            const { monsterAnim, monsterState: { lastDirectionMonster, directionMonster }, monster, monsterCharacterId } = monsters[m];

            switch(monsterCharacterId) {
                case 0: {
                    monsterOffSetX = -34;
                    monsterOffSetY = -22;
                    breakmonster
                }
                case 1: {
                    monsterOffSetX = 0;
                    monsterOffSetY = 0;
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


    const monstersOnMove = {}
    if (!isObjEmpty(monsters)) {
        for (const monster in monsters) {
            
            monstersOnMove[monster] = {
                id: monsters[monster].id,
                position: monsters[monster].monster.position,
                monsterState: monsters[monster].monsterState,
                monsterCharacterId: monsters[monster].monsterCharacterId,
                row: monsters[monster].monster.tileTo[0],
                col: monsters[monster].monster.tileTo[1],
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
                    underAttack
                },
                monsters: monstersOnMove
            });
        }

        
    


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
    



    let rowCol = randomSpawn();
    let row = rowCol[0];
    let col = rowCol[1];



    while (gameMap[toIndex(row, col)] !== 1) {
        rowCol = randomSpawn()
        row = randomSpawn()[0];
        col = randomSpawn()[1];
    }

    // new player init
    player = new Character(row, col);
    socket = io.connect("http://localhost:3000");
    characterIdx = Math.floor(Math.random() * 5).toString();

    /**
     ** Initial all images for my player
     */
    for (let idx = 0; idx < characters.length; idx++) {
        let hero;
        hero = new Sprite("../images/spritexb-" + idx + ".png" , 13, 21);
        hero.load(ctx);
        hero.animate("40", 100, 10, 0, 9); // down
        hero.animate("37", 100,  9, 0, 9); // left 
        hero.animate("39", 100, 11, 0, 9); // right 
        hero.animate("38", 100,  8, 0, 9); // up


        switch (idx) {
            case 0:
                hero.animate("81"   , 100, 5, 0, 8); // q (fight - left)
                hero.animate("811"  , 100, 7, 0, 8); // q (fight - right)
                hero.animate("8111" , 100, 4, 0, 8); // q (fight - up)
                hero.animate("81111", 100, 6, 0, 8); // q (fight - dowm)
            break;

            case 1:
                hero.animate("81"   , 100, 13, 0, 6); // q (fight - left)
                hero.animate("811"  , 100, 15, 0, 6); // q (fight - right)
                hero.animate("8111" , 100, 12, 0, 6); // q (fight - up)
                hero.animate("81111", 100, 14, 0, 6); // q (fight - dowm)
            break;


            case 2:
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)        
            break;

            case 3:
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)
            break;

            case 4:
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
        heros.push({ hero, direction, lastDirection });
    }

    /**
     ** Initial all images for online players
     */
    for (let idx = 0; idx < characters.length; idx++) {
        let hero;
        hero = new Sprite("../images/spritexb-" + idx + ".png" , 13, 21);
        hero.load(ctx);
        hero.animate("40", 100, 10, 0, 9); // down
        hero.animate("37", 100,  9, 0, 9); // left 
        hero.animate("39", 100, 11, 0, 9); // right 
        hero.animate("38", 100,  8, 0, 9); // up

        switch (idx) {
            case 0:
                hero.animate("81"   , 100, 5, 0, 8); // q (fight - left)
                hero.animate("811"  , 100, 7, 0, 8); // q (fight - right)
                hero.animate("8111" , 100, 4, 0, 8); // q (fight - up)
                hero.animate("81111", 100, 6, 0, 8); // q (fight - dowm)
            break;

            case 1:
                hero.animate("81"   , 100, 13, 0, 6); // q (fight - left)
                hero.animate("811"  , 100, 15, 0, 6); // q (fight - right)
                hero.animate("8111" , 100, 12, 0, 6); // q (fight - up)
                hero.animate("81111", 100, 14, 0, 6); // q (fight - dowm)
            break;


            case 2:
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)        
            break;

            case 3:
                hero.animate("81"   , 100, 17, 2);     // q (fight - left)
                hero.animate("811"  , 100, 19, 2);     // q (fight - right)
                hero.animate("8111" , 100, 16, 2);     // q (fight - up)
                hero.animate("81111", 100, 18, 2);     // q (fight - dowm)
            break;

            case 4:
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
        herosOnline.push({ hero, direction, lastDirection });
    }
     



    socket.on("heartbeat", data => {
        
        if (started) {
            players = data.players;
            for (const m in data.monsters) {
        
                const monster = data.monsters[m];
                monsters[m].monsterState = monster.monsterState
                monsters[m].monster.position = monster.position
                monsters[m].monsterCharacterId = monster.monsterCharacterId
                monsters[m].row = monster.row
                monsters[m].col = monster.col
                monsters[m].id = monster.id
                
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
                monster = new Character(data.monsters[i].row, data.monsters[i].col);
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
                    row: data.monsters[i].row,
                    col: data.monsters[i].col,
                    monsterCharacterId: data.monsters[i].monsterCharacterId,
                    position: data.monsters[i].position
                    
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
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            const now = new Date().getTime()

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
                heros[characterIdx].hero.animations[key].duration = 50;
            }
        }

        // fighting keys
        if (fightKeyDown.hasOwnProperty(e.keyCode.toString())) {
            fightMoveInState = e.keyCode.toString();
            for (const key in directionKeyDown) {
                directionKeyDown[key] = false;
            }
           
        }

        // powers keys
        if (powersKeys.hasOwnProperty(e.keyCode.toString())) {
            powerInState = e.keyCode.toString();
        }


    });

    window.addEventListener("keyup", e => {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            directionKeyDown[e.keyCode] = false;
        }
        if (e.keyCode === 32) {
            player.deleyMove = 400;
            for (const key in heros[characterIdx].hero.animations) {
                heros[characterIdx].hero.animations[key].duration = 100;
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