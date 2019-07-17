class Viewport {
    constructor(tileW, tileH) {
        this.screen     = [0,0]; // canvas [width, height]
        this.startTile  = [0,0]; // [row, col] of the starting tile to show
        this.endTile    = [0,0]; // [row, col] of the ending tile to show
        this.offset     = [0,0]; // offset to move [x, y]
        this.tileW      = tileW;
        this.tileH      = tileH;
    }


    update(px, py) {
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

