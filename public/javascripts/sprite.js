class Sprite {
    constructor(img, totCols, totRows) {
        console.log("img", img)
        this.totCols = totCols;
        this.totRows = totRows;
        this.animations = {};
        this.width = null;
        this.height = null;
        this.img = img;
        this.frameHeight = null;
        this.frameWidth = null;
        this.ctx = null;
        this.next = 0;
        this.lastFrameTime = 0
    }

    load(ctx) {
        this.ctx = ctx
        this.width = this.img.width;
        this.height = this.img.height;
        this.frameHeight = Math.floor(this.height / this.totRows);
        this.frameWidth = Math.floor(this.width / this.totCols);
    }


    animate(name, duration, row, startAtCol = 0, endAtCol = this.totCols) {

        let frames = [];

        let xStart = this.frameWidth * startAtCol;
        let yStart = row * this.frameHeight;
        
        let xEnd = this.frameWidth * startAtCol + this.frameWidth;
        let yEnd = this.frameHeight * row + this.frameHeight;
  
        
        for (let i = startAtCol; i < endAtCol; i++) {
            frames.push({ xStart, yStart, xEnd, yEnd })
            xStart = xEnd;
            xEnd = this.frameWidth * (i + 1) + this.frameWidth
            
        }

        this.animations[name] = {
            duration,
            frames
        };
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
   
        const now = new Date().getTime()
        const anim = this.animations[animationName]

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
        this.next = 0
    }
}

