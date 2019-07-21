class Sprite {
    constructor(path, totCols, totRows) {
        this.path = path;
        this.totCols = totCols;
        this.totRows = totRows;
        this.animations = {};
        this.width = null;
        this.height = null;
        this.img = null;
        this.frameHeight = null;
        this.frameWidth = null;
        this.ctx = null;
        this.next = 0;
        this.lastFrameTime = 0
    }

    load(ctx) {
        this.ctx = ctx
        this.img = new Image()
        this.img.src = this.path;

        this.width = this.img.width;
        this.height = this.img.height;
        this.frameHeight = Math.floor(this.height / this.totRows);
        this.frameWidth = Math.floor(this.width / this.totCols);


    }

    // animate(name, duration, row /* 0 based */) {
    //     let frames = [];
 
    //     let xStart = 0;
    //     let yStart = row * this.frameHeight;
    //     let xEnd = Math.floor(this.width / this.totCols);
    //     let yEnd = Math.floor((this.height / this.totRows) + this.frameHeight);

    //     for (let i = 1; i <= this.totCols; i++) {
    //         frames.push({ xStart, yStart, xEnd, yEnd })
    //         xStart = xEnd;
    //         xEnd = this.frameWidth * i + this.frameWidth
    //     }
    //     this.animations[name] = {
    //         duration,
    //         frames
    //     };
    // }

    animate(name, duration, row, startAtCol = 0, endAtCol = this.totCols) {

        let frames = [];

        let xStart = this.frameWidth * startAtCol;
        let yStart = row * this.frameHeight;
        
        let xEnd = this.frameWidth * startAtCol + this.frameWidth;
        let yEnd = this.frameHeight * row + this.frameHeight;
  
        
        console.log("name", name)
        
        for (let i = startAtCol; i < endAtCol; i++) {
            console.log(i, {xStart, xEnd})
            frames.push({ xStart, yStart, xEnd, yEnd })
            xStart = xEnd;
            xEnd = this.frameWidth * (i + 1) + this.frameWidth
            
        }
        console.log("frames", frames)

       // console.log(debuggingArr)
        this.animations[name] = {
            duration,
            frames
        };

        console.log("name", name)
        console.log("frames", frames)
        console.log("path", this.path)
        console.log("=======================")
        console.log("=======================")
        console.log("=======================")
    }

    /**
     * 
     * @param {Number} x - X position to draw the animation
     * @param {Number} y - Y position to draw the animation
     * @param {String} animationName - Name of animation
     * @param {Boolean} stop - to stop animation
     * @param {Number} startAt - Index to start animation at
     * @param {Number} stopAt - Index to end animation at
     */
    run(x, y, animationName, stop = false) {
        //if (this.next > stopAt) { this.next = startAt; console.log("resetting"); }
        const now = new Date().getTime()
        const anim = this.animations[animationName]

        // console.log("-------------------------------")
        // console.log("-------------------------------")
        // console.log("-------------------------------")
        // console.log("animationName", animationName)
        // console.log("this.animations", this.animations)
        // console.log("anim", anim)
        // console.log("anim.frames", anim.frames)
        // console.log("anim.frames[this.next];", anim.frames[this.next])
        // console.log("this.next", this.next)
        // console.log("anim.length - 1", anim.frames.length - 1)
        if (this.path.includes("spritexb-")) {
            // console.log(this.next)
        }
        if (this.next >= anim.frames.length) { this.next = 0; }
        const { xStart, yStart } = anim.frames[this.next];
        this.ctx.drawImage(this.img, xStart, yStart, this.frameWidth, this.frameHeight, x - 15, y - 40, this.frameWidth, this.frameHeight );
        
        if (!stop) {
            
            if (now - this.lastFrameTime >= anim.duration) {
                this.next++;
                this.lastFrameTime = new Date().getTime();
            }
           
        }
    }

    reset() {
        console.log("reset")
        this.next = 0
    }
}

