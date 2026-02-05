/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!

// Classes
function GameObject(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
}

const COLORS = {
    red: {
        base: PS.COLOR_RED,
        accent: PS.COLOR_VIOLET
    },
    green: {
        base: PS.COLOR_GREEN,
        accent: PS.COLOR_VIOLET
    },
    blue: {
        base: PS.COLOR_BLUE,
        accent: PS.COLOR_VIOLET
    }
}

const OBJ_IDS = {
    clear: 0,
    wall: 1,
    parentWall: 2,
    burner: 3,
    redPaint: 11,
    greenPaint: 12,
    bluePaint: 13,
}

var grid_x = 9;
var grid_y = 9;

const DARKEN = 12
const GRID_COLOR = PS.COLOR_BLACK;
const BACKGROUND_COLOR = PS.COLOR_WHITE;
const WALL_COLOR = PS.COLOR_GRAY;
const GOAL_COLOR = PS.COLOR_YELLOW;
const BORDER_WIDTH= 6
const PARENT_GLYPH= 0x1F441
const GOAL_COLOR_GLYPH = 0x25A0

const WIN_TICKS = 60

const WIN_SOUND = "fx_coin3"
const RESET_SOUND = "fx_blast3"
const COLLISION_SOUND = "fx_shoot7"
const MOVE_SOUND = "fx_rip"
const STICK_SOUND = "fx_squish"

// polyBlocks stored as x,y components
let parentBlock = null;
let polyBlocks = [];
let inertBlocks = [];
let walls = [];
let goals = [];

let isPlayerControlling = false;
let currentLevel = 0;

const LEVELS = [
    {
        name: "EMPTY HALL",
        parent: [1,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,6,4,6],
            ["clears",4,2,7,2],
            ["clears",4,3,4,5],
            ["goal",7,2,"any"]
        ]
    },
    {
        name: "AMASS",
        parent: [1,2,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,2,7,3],
            ["clears",4,4,4,6],
            ["goal",7,2,"any"],
            ["goal",7,3,"any"],
            ["block",4,6,"red"]
        ]
    },
    {
        name: "SOCKET",
        parent: [4,4,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,2,6,6],
            ["clear",4,1],
            ["clear",7,4],
            ["goal",2,5,"any"],
            ["goal",3,6,"any"],
            ["goal",2,6,"any"],
            ["block",4,1,"red"],
            ["block",7,4,"red"]
        ]
    },
    {
        name: "PEEKABOO",
        parent: [5,3,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,3,6,5],
            ["wall",4,3],
            ["goal",2,5,"any"],
            ["goal",3,5,"any"],
            ["block",3,3,"red"],
        ]
    },
    {
        name: "FILE IN LINE",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,1,6,7],
            ["goal",3,3,"any"],
            ["goal",4,3,"any"],
            ["goal",5,3,"any"],
            ["block",4,2,"red"],
            ["block",4,4,"red"],
        ]
    },
    {
        name: "PINCH",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,1,6,4],
            ["clears",3,5,5,7],
            ["wall",4,4],
            ["goal",4,5,"any"],
            ["goal",4,7,"any"],
            ["block",4,2,"red"],
            ["block",4,3,"red"],
        ]
    },
    {
        name: "OPERAND",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",3,2,5,6],
            ["wall",5,2],
            ["wall",3,6],
            ["block",3,5,"red"],
            ["block",5,4,"red"],
            ["goal",3,2,"any"],
            ["goal",4,2,"any"],
            ["goal",4,3,"any"],
        ]
    },

    {
        name: "REVOLVE",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,2,6,6],
            ["wall",4,4],
            ["wall",2,2],
            ["block",2,4,"red"],
            ["block",4,3,"red"],
            ["block",6,4,"red"],
            ["goal",5,5,"any"],
            ["goal",5,6,"any"],
            ["goal",6,5,"any"],
            ["goal",6,6,"any"],
        ]
    },
    {
        name: "GET THROUGH",
        parent: [2,2,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,2,6,6],
            ["walls",2,5,2,6],
            ["wall",5,4],
            ["block",5,3,"red"],
            ["block",6,3,"red"],
            ["block",4,6,"red"],
            ["goal",4,5,"any"],
            ["goal",6,6,"any"],
        ]
    },
    {
        name: "TWO ROOMS",
        parent: [2,3,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,1,3,7],
            ["clears",5,1,7,5],
            ["clear",4,2],
            ["block",2,5,"red"],
            ["block",1,6,"red"],
            ["block",5,4,"red"],
            ["goal",1,1,"any"],
            ["goal",2,1,"any"],
            ["goal",3,1,"any"],
            ["goal",3,2,"any"],
        ]
    },
]

PS.init = function( system, options ) {
    // Load audio
    PS.audioLoad(WIN_SOUND);
    PS.audioLoad(RESET_SOUND);
    PS.audioLoad(COLLISION_SOUND);
    PS.audioLoad(MOVE_SOUND);
    PS.audioLoad(STICK_SOUND);

	PS.gridSize( grid_x, grid_y );

    PS.gridColor(GRID_COLOR);
    PS.statusColor(BACKGROUND_COLOR)
	PS.statusText( "POLYMACHER" );

    parseLevel(currentLevel)
    render()

    isPlayerControlling = true;
};

function cleanWalls() {
    for (let x = 0; x < grid_x; x++) {
        walls[x] = [];
        for (let y = 0; y < grid_y; y++) {
            walls[x][y] = false;
        }
    }
}

function addToMultiArray(xStart,yStart,xEnd,yEnd,val) {
    for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
            walls[x][y] = val;
        }
    }
}

function addWalls(xStart,yStart,xEnd,yEnd) {
    addToMultiArray(xStart,yStart,xEnd,yEnd,true);
}

function addClears(xStart,yStart,xEnd,yEnd) {
    addToMultiArray(xStart,yStart,xEnd,yEnd,false);
}

function parseLevel(id) {
    isPlayerControlling = false;

    // Reset level data
    parentBlock = null
    polyBlocks = [];
    inertBlocks = [];
    cleanWalls();
    goals = [];

    let level = LEVELS[id];

    // Add status text
    PS.statusText("POLYMACHER: " + level.name)

    // Add parent block
    let parentX = level.parent[0];
    let parentY = level.parent[1];
    let parentColor = level.parent[2];

    parentBlock = new GameObject(parentX, parentY, parentColor);
    polyBlocks.push(parentBlock);

    level.data.forEach(function (elm, index) {
        // Check based off the data
        switch(elm[0]) {
            case "walls":
                addWalls(elm[1],elm[2],elm[3],elm[4]);
                break;
            case "wall":
                walls[elm[1]][elm[2]] = true;
                break;
            case "clears":
                addClears(elm[1],elm[2],elm[3],elm[4]);
                break;
            case "clear":
                walls[elm[1]][elm[2]] = false;
                break;
            case "goal":
                goals.push(new GameObject(elm[1], elm[2], elm[3]));
                break;
            case "block":
                inertBlocks.push(new GameObject(elm[1], elm[2], elm[3]));
                break;
        }
    })

    isPlayerControlling = true;
}

function colorChecker(x,y,color) {
    if ((x + y) % 2 == 1) {
        let rgb = []
        PS.unmakeRGB(color, rgb)
        rgb[0] -= DARKEN
        rgb[1] -= DARKEN;
        rgb[2] -= DARKEN;

        PS.color(x, y, rgb[0], rgb[1], rgb[2])
    } else {
        PS.color(x,y,color)
    }
}

function render() {
    // Render empty white grid & walls
    for (let x = 0; x < grid_x; x++) {
        for (let y = 0; y < grid_y; y++) {
            if (walls[x][y]) {
                colorChecker(x, y, WALL_COLOR);
            } else {
                colorChecker(x, y, BACKGROUND_COLOR);
            }
            PS.border(x, y, 0);
            PS.glyph(x, y, 0);
        }
    }

    // Render inert blocks

    inertBlocks.forEach(function (block, index) {
        let x = block.x;
        let y = block.y;
        let color = block.color;

        PS.color(x, y, COLORS[color].base);
        PS.border(x, y, BORDER_WIDTH);
        PS.borderColor(x, y, COLORS[color].accent);
    });


    // Render walls
    for (let x = 0; x < grid_x; x++) {
        for (let y = 0; y < grid_y; y++) {
            if (walls[x][y]) {
                colorChecker(x, y, WALL_COLOR);
            }
        }
    }

    // Render goal blocks
    goals.forEach(function (goal, index) {
        let x = goal.x;
        let y = goal.y;
        let color = goal.color;

        PS.color(x, y, GOAL_COLOR);
        if (color != "any") {
            PS.glyph(x, y, GOAL_COLOR_GLYPH);
            PS.glyphColor(x, y, COLORS[color].base);
        }
    });

    // Render special blocks

    // Render poly blocks
    polyBlocks.forEach(function (block, index) {
        let x = block.x;
        let y = block.y;
        let color = block.color;

        PS.color(x, y, COLORS[color].base);
        PS.border(x, y, BORDER_WIDTH);
        PS.borderColor(x, y, COLORS[color].accent);
    });

    // Render parent block face
    PS.glyph(parentBlock.x, parentBlock.y, PARENT_GLYPH);
    PS.glyphColor(parentBlock.x, parentBlock.y, COLORS[parentBlock.color].accent);
}

function isMovementValid(x, y) {
    let valid = true
    polyBlocks.forEach(function (block, index) {
        // Check bounds of movement
        if (block.x + x < 0 || block.x + x >= grid_x || block.y + y < 0 || block.y + y >= grid_y) {
            valid = false
        } else if (walls[block.x + x][block.y + y]) {
            valid = false
        }
    });
    return valid;
}

function checkInertBlocks() {
    // Check for inert block activations
    for (let i = 0; i < inertBlocks.length; i++) {
        let x = inertBlocks[i].x;
        let y = inertBlocks[i].y;
        let blockFound = false;

        for (let j = 0; j < polyBlocks.length; j++) {
            let xDiff = polyBlocks[j].x - x;
            let yDiff = polyBlocks[j].y - y;

            if ((xDiff * xDiff + yDiff * yDiff) <= 1) {
                // Move inert block to poly blocks
                polyBlocks.push(inertBlocks[i]);
                inertBlocks.splice(i, 1);
                blockFound = true;
                // Recurse over remaining inert blocks
                checkInertBlocks();
                break;
            }
        }

        if (blockFound) {
            return true;
        }
    }

    return false;
}

function isGoalMet() {
    for (let i = 0; i < goals.length; i++) {
        // Check that every goal is fulfilled
        let fulfilled = false;
        for (let j = 0; j < polyBlocks.length; j++) {
            if (goals[i].x == polyBlocks[j].x && goals[i].y == polyBlocks[j].y) {
                // Some block occupies the spot
                if (goals[i].color == "any" || goals[i].color == polyBlocks[j].color) {
                    fulfilled = true;
                    break;
                } else {
                    // Wrong color block occupies the slot
                    return false;
                }
            }
        }

        if (!fulfilled) {
            return false;
        }
    }

    return true
}

function progressLevel() {
    isPlayerControlling = false;
    currentLevel++;
    if (!LEVELS[currentLevel]) {
        PS.debug("Game complete!");
        return;
    }

    parseLevel(currentLevel);
    render();
    isPlayerControlling = true;
}

function move(x, y) {
    if (!isMovementValid(x,y)) {
        PS.audioPlay(COLLISION_SOUND, {volume: 0.3})
        return;
    }

    PS.audioPlay(MOVE_SOUND, {volume: 0.15})

    polyBlocks.forEach(function (block, index) {
        block.x += x;
        block.y += y;
    })

    if (checkInertBlocks()) {
        PS.audioPlay(STICK_SOUND)
    };
    render();

    if (isGoalMet()) {
        PS.audioPlay(WIN_SOUND)
        isPlayerControlling = false
        let timer = PS.timerStart(WIN_TICKS, function() {
            PS.timerStop(timer);

            progressLevel();
        })
    }
}

PS.keyDown = function( key, shift, ctrl, options ) {
    if (!isPlayerControlling) {
        return;
    }

    let x = 0;
    let y = 0;

	switch( key ) {
        case 97:
        case PS.KEY_ARROW_LEFT:
            x = -1;
            break;
        case 100:
        case PS.KEY_ARROW_RIGHT:
            x = 1;
            break;
        case 119:
        case PS.KEY_ARROW_UP:
            y = -1;
            break;
        case 115:
        case PS.KEY_ARROW_DOWN:
            y = 1;
            break;
        case 114:
            // Reset the level
            PS.audioPlay(RESET_SOUND)
            parseLevel(currentLevel);
            render();
    }

    // If no movement caused, return
    if (!(x == 0 && y == 0)) {
        move(x, y);
    }
}
