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
        this.last = 0
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

    animate(name, duration, row /* 0 based */) {
        let frames = [];
 
        let xStart = 0;
        let yStart = row * this.frameHeight;
        let xEnd = Math.floor(this.width / this.totCols);
        let yEnd = Math.floor((this.height / this.totRows) + this.frameHeight);

        for (let i = 1; i <= this.totCols; i++) {
            frames.push({ xStart, yStart, xEnd, yEnd })
            xStart = xEnd;
            xEnd = this.frameWidth * i + this.frameWidth
        }
        this.animations[name] = {
            duration,
            frames
        };
    }

    run(x, y, animationName) {
        this.ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        const now = new Date().getTime()
        const anim = this.animations[animationName]
   
        const { xStart, yStart } = anim.frames[this.next];
        this.ctx.drawImage(this.img, xStart, yStart, this.frameWidth, this.frameHeight, x, y, this.frameWidth, this.frameHeight );

        if (now - this.last >= anim.duration) {
            this.next++;
            this.last = new Date().getTime()
            if (this.next >= anim.frames.length) { this.next = 0; }
        }
    }
}

const ctx1 = document.getElementById("canvas1").getContext("2d");
const hero = new Sprite("../images/spritexb-2471.png", 4, 4);
hero.load(ctx1);
hero.animate("walkRight", 200, 0);
const start = new Date().getTime()



function run() {
    hero.run(0,0,"walkRight")
    requestAnimationFrame(run);
}

run()