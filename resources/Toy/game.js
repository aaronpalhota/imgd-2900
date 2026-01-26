"use strict"; // Do NOT remove this directive!

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

const GRID_X = 15;
const GRID_Y = 12;

const LINE_DRAW_TICKS = 8;
const BOARD_ERASE_TICKS = 8;

const COLORS =
    [PS.COLOR_RED,
    PS.COLOR_ORANGE,
    PS.COLOR_YELLOW,
    PS.COLOR_GREEN,
    PS.COLOR_BLUE,
    PS.COLOR_VIOLET]
const ERASE_COLOR = PS.COLOR_BLACK;
const CLEAN_COLOR = PS.COLOR_WHITE;
const ERASE_SOUND = "perc_conga_low"
const XYLO_SEQUENCE = ["xylo_c5", "xylo_e5", "xylo_g5", "xylo_a5",
    "xylo_c6", "xylo_a5", "xylo_g5", "xylo_e5", "xylo_c5"]
const LINE_OPTIONS = {"volume": 0.25}

let isHorizontal = true
let erasing = false;

PS.init = function( system, options ) {
	PS.gridSize( GRID_X, GRID_Y );

	PS.statusText( "Plaid Toy" );

    // Load sound effects
    PS.audioLoad(ERASE_SOUND)
};

/*
PS.touch ( x, y, data, options )
Called when the left mouse button is clicked over bead(x, y), or when bead(x, y) is touched.
This function doesn't have to do anything. Any value returned is ignored.
[x : Number] = zero-based x-position (column) of the bead on the grid.
[y : Number] = zero-based y-position (row) of the bead on the grid.
[data : *] = The JavaScript value previously associated with bead(x, y) using PS.data(); default = 0.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

function blend(a,b) {
    return (a + b) / 2
}

function linePlaySound(offset, isHorizontal) {
    PS.audioPlay("fx_drip2", LINE_OPTIONS);
}

function dynamicColor(x, y, color) {
    let rgbA = []
    let rgbB = []

    // Get the color of the tile
    PS.unmakeRGB(PS.color(x,y), rgbA)
    PS.unmakeRGB(color, rgbB)

    let newColor = PS.makeRGB(blend(rgbA[0],rgbB[0]),blend(rgbA[1],rgbB[1]),blend(rgbA[2],rgbB[2]));
    PS.color(x,y,newColor)
}

function paintHorizontalLine(x, y, color, offset = 0) {
    if (erasing) {
        return;
    }

    let success = false
    if (offset === 0) {
        dynamicColor(x, y, color)
        success = true;
    } else {
        if (x - offset >= 0) {
            dynamicColor(x - offset, y, color)
            success = true;
        }
        if (x + offset < GRID_X) {
            dynamicColor(x + offset, y, color)
            success = true;
        }
    }

    if (success) {
        // Play sound
        linePlaySound(offset, true);

        // Recurse
        let timer = PS.timerStart(LINE_DRAW_TICKS, function() {
            paintHorizontalLine(x, y, color, offset + 1);
            PS.timerStop(timer);
        })
    }
}

function paintVerticalLine(x, y, color, offset = 0) {
    if (erasing) {
        return;
    }

    let success = false
    if (offset === 0) {
        dynamicColor(x, y, color)
        success = true;
    } else {
        if (y - offset >= 0) {
            dynamicColor(x, y - offset, color)
            success = true;
        }
        if (y + offset < GRID_Y) {
            dynamicColor(x, y + offset, color)
            success = true;
        }
    }

    if (success) {
        // Play sound
        linePlaySound(offset, false);

        // Recurse
        let timer = PS.timerStart(LINE_DRAW_TICKS, function() {
            paintVerticalLine(x, y, color, offset + 1);
            PS.timerStop(timer);
        })
    }
}

function clean(y) {
    for (let x = 0; x < GRID_X; x++) {
        PS.color(x, y, CLEAN_COLOR);
    }
}

function erase(y) {
    if (y >= GRID_Y) {
        erasing = false;
        return;
    }

    PS.audioPlay("perc_conga_low")
    for (let x = 0; x < GRID_X; x++) {
        PS.color(x, y, ERASE_COLOR)
    }

    let timer = PS.timerStart(BOARD_ERASE_TICKS, function() {
        clean(y)
        erase(y + 1);
        PS.timerStop(timer);
    })
}

PS.touch = function( x, y, data, options ) {
    let randomColor = COLORS[PS.random(COLORS.length) - 1];

    if (isHorizontal) {
        paintHorizontalLine(x, y, randomColor);
    } else {
        paintVerticalLine(x, y, randomColor);
    }

    isHorizontal = !isHorizontal;
};

/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function( key, shift, ctrl, options ) {
	if (key == PS.KEY_SPACE) {
        erasing = true;
        isHorizontal = true;
        erase(0)
    }
};
