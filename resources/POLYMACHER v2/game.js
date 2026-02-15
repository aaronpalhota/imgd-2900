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

// Game state structure uses data arrays instead of objects
// These arrays are parsed to objects on call of undo
function GameState(parent, poly, inert) {
    this.parent = parent;
    this.poly = poly;
    this.inert = inert;
}

const COLORS = {
    red: {
        base: PS.COLOR_RED,
        accent: PS.COLOR_VIOLET
    },
    green: {
        base: 0x11d411,
        accent: PS.COLOR_VIOLET
    },
    blue: {
        base: 0x3293e3,
        accent: PS.COLOR_VIOLET
    }
}

const SPACE_IDS = {
    clear: 0,
    wall: 1,
    parentWall: 2,
    burner: 3,
    redPaint: 11,
    greenPaint: 12,
    bluePaint: 13,
}

var GRID_X = 9;
var GRID_Y = 9;

const DARKEN = 12
const GRID_COLOR = PS.COLOR_BLACK;
const BACKGROUND_COLOR = PS.COLOR_WHITE;
const WALL_COLOR = PS.COLOR_GRAY;
const GOAL_COLOR = PS.COLOR_YELLOW;
const BURNER_COLOR = PS.COLOR_ORANGE;
const BURNER_GLYPH = 0x263C
const BURNER_GLYPH_COLOR = PS.COLOR_RED;
const BORDER_WIDTH= 6
const PARENT_GLYPH= 0x1F441
const GOAL_COLOR_GLYPH = 0x25A0
const TEXT_COLOR = PS.COLOR_WHITE;

const WIN_TICKS = 60

const WIN_SOUND = "fx_coin3"
const RESET_SOUND = "fx_blast3"
const COLLISION_SOUND = "fx_shoot7"
const MOVE_SOUND = "fx_rip"
const STICK_SOUND = "fx_squish"
const BURN_SOUND = "fx_squink"
const DEATH_SOUND = "fx_scratch"
const UNDO_SOUND = "fx_chirp2"

// polyBlocks stored as x,y components
let parentBlock = null;
let polyBlocks = [];
let inertBlocks = [];
let space = [];
let goals = [];
let gameStates = [];
let glyphs = [];

let isPlayerControlling = false;
let currentLevel = 0
let isParentAlive = true;

// Debug variables
const DEBUG_LAST = false
const DEBUG_ID = true
const ID_TO_DEBUG = 18

const LEVELS = [
    {
        name: "EMPTY HALL",
        parent: [1,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,6,4,6],
            ["clears",4,2,7,2],
            ["clears",4,3,4,5],
            ["goal",7,2,"any"],
            ["glyphs",0,0,"WASD:MOVE"],
            ["glyphs",0,8,"←↑↓→:MOVE"]
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
            ["block",4,6,"red"],
            ["glyphs",1,0,"R:RESET"],
            ["glyphs",1,8,"Z: UNDO"]
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
            ["goal",3,2,"any"],
        ]
    },
    {
        name: "REVOLVE",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,2,6,6],
            ["wall",4,4],
            ["wall",2,6],
            ["wall",6,2],
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
        name: "BURNER",
        parent: [1,2,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,2,7,2],
            ["clears",3,3,4,3],
            ["clears",4,4,4,6],
            ["burner",4,6],
            ["goal",7,2,"any"],
            ["block",3,3,"red"]
        ]
    },
    {
        name: "CAUTERIZE",
        parent: [2,4,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,2,6,6],
            ["walls",5,3,5,5],
            ["burner",4,4],
            ["goal",6,4,"any"],
            ["block",3,4,"red"],
            ["block",2,3,"red"],
            ["block",2,5,"red"]
        ]
    },
    {
        name: "OBSTRUCT",
        parent: [6,5,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",3,2,5,4],
            ["clears",1,4,7,6],
            ["walls",1,6,3,6],
            ["walls",4,5,4,6],
            ["burner",5,6],
            ["goal",1,5,"any"],
            ["goal",3,5,"any"],
            ["block",3,2,"red"],
            ["block",5,2,"red"],
            ["block",2,5,"red"]
        ]
    },
    {
        name: "SACRIFICE",
        parent: [4,5,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,2,7,6],
            ["burner",6,3],
            ["burner",4,3],
            ["burner",2,3],
            ["goal",5,3,"any"],
            ["goal",3,3,"any"],
            ["goal",4,6,"any"],
            ["block",3,6,"red"],
            ["block",2,6,"red"],
            ["block",6,6,"red"],
            ["block",5,6,"red"],
        ]
    },
    {
        name: "LOCK AND KEY",
        parent: [1,4,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,2,4,6],
            ["clears",6,4,7,5],
            ["clear",5,4],
            ["burner",1,2],
            ["burner",1,6],
            ["goal",6,5,"any"],
            ["goal",7,5,"any"],
            ["block",3,4,"red"],
            ["block",4,4,"red"],
        ]
    },
    {
        name: "TRANSFORM",
        parent: [2,5,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,3,4,7],
            ["clears",5,1,6,5],
            ["burner",5,4],
            ["goal",5,1,"any"],
            ["goal",6,1,"any"],
            ["goal",6,2,"any"],
            ["block",2,3,"red"],
            ["block",4,6,"red"],
            ["block",6,3,"red"]
        ]
    },
    {
        name: "JUT OUT",
        parent: [2,7,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,2,7,6],
            ["clears",3,1,5,1],
            ["clears",1,7,3,7],
            ["walls",2,2,2,3],
            ["walls",6,2,6,3],
            ["walls",4,5,4,6],
            ["burner",5,1],
            ["goal",6,5,"any"],
            ["goal",7,6,"any"],
            ["goal",7,5,"any"],
            ["block",3,6,"red"],
            ["block",1,4,"red"],
            ["block",3,1,"red"]
        ]
    },
    {
        name: "HOTPLATE",
        parent: [5,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",3,2,6,6],
            ["clears",2,4,2,5],
            ["burner",4,6],
            ["goal",3,3,"any"],
            ["goal",3,6,"any"],
            ["block",5,3,"red"],
            ["block",2,4,"red"],
            ["block",6,4,"red"]
        ]
    },
    {
        name: "FEED THE FLAME",
        parent: [4,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",2,1,4,7],
            ["clears",5,2,6,6],
            ["wall",6,6],
            ["burner",3,3],
            ["burner",4,3],
            ["goal",2,2,"any"],
            ["goal",4,1,"any"],
            ["block",2,7,"red"],
            ["block",5,4,"red"],
            ["block",3,1,"red"],
            ["block",5,2,"red"],
            ["block",6,2,"red"]
        ]
    },
    {
        name: "TWO MORE ROOMS",
        parent: [5,6,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",1,1,7,3],
            ["clears",1,5,6,7],
            ["clear",2,4],
            ["clear",5,4],
            ["burner",1,2],
            ["burner",6,7],
            ["block",3,3,"red"],
            ["block",3,6,"red"],
            ["block",2,5,"red"],
            ["block",1,6,"red"],
            ["block",7,1,"red"],
            ["block",6,1,"red"],
            ["goal",5,1,"any"],
            ["goal",5,7,"any"],
            ["goal",7,2,"any"],
        ]
    },
    {
        name: "YOU WIN",
        parent: [4,4,"red"],
        data: [
            ["walls",0,0,8,8],
            ["clears",3,3,5,5],
            ["glyphs",1,0,"THX FOR"],
            ["glyphs",1,1,"PLAYING"],
            ["glyphs",1,7,"YOU WIN"],
            ["glyphs",3,8,"[ ]"],
            ["glyph",4,8,PARENT_GLYPH]
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
    PS.audioLoad(BURN_SOUND);
    PS.audioLoad(DEATH_SOUND);
    PS.audioLoad(UNDO_SOUND);

	PS.gridSize( GRID_X, GRID_Y );

    if (DEBUG_LAST) {
        currentLevel = LEVELS.length - 2;
    } else if (DEBUG_ID) {
        currentLevel = ID_TO_DEBUG;
    }

    PS.gridColor(GRID_COLOR);
    PS.statusColor(BACKGROUND_COLOR)
	PS.statusText( "POLYMACHER" );

    parseLevel(currentLevel)
    render()

    isPlayerControlling = true;
};

function cleanWalls() {
    for (let x = 0; x < GRID_X; x++) {
        space[x] = [];
        for (let y = 0; y < GRID_Y; y++) {
            space[x][y] = SPACE_IDS.clear;
        }
    }
}

function addToMultiArray(xStart,yStart,xEnd,yEnd,val) {
    for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
            space[x][y] = val;
        }
    }
}

function addWalls(xStart,yStart,xEnd,yEnd) {
    addToMultiArray(xStart,yStart,xEnd,yEnd,SPACE_IDS.wall);
}

function addClears(xStart,yStart,xEnd,yEnd) {
    addToMultiArray(xStart,yStart,xEnd,yEnd,SPACE_IDS.clear);
}

function parseToGlyphs(x,y,string) {
    for (let i = 0; i < string.length; i++) {
        let char = string.charCodeAt(i);
        glyphs.push([x + i, y, char]);
    }
}

function parseLevel(id) {
    isPlayerControlling = false;
    isParentAlive = true;

    // Reset level data
    parentBlock = null
    polyBlocks = [];
    inertBlocks = [];
    cleanWalls();
    goals = [];
    gameStates = [];
    glyphs = [];

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
                space[elm[1]][elm[2]] = SPACE_IDS.wall;
                break;
            case "clears":
                addClears(elm[1],elm[2],elm[3],elm[4]);
                break;
            case "clear":
                space[elm[1]][elm[2]] = SPACE_IDS.clear;
                break;
            case "goal":
                goals.push(new GameObject(elm[1], elm[2], elm[3]));
                break;
            case "block":
                inertBlocks.push(new GameObject(elm[1], elm[2], elm[3]));
                break;
            case "burner":
                space[elm[1]][elm[2]] = SPACE_IDS.burner;
                break;
            case "glyphs":
                parseToGlyphs(elm[1],elm[2],elm[3]);
                break;
            case "glyph":
                glyphs.push([elm[1],elm[2],elm[3]])
        }
    })

    checkInertBlocks()
    isPlayerControlling = true;
}

function darkenColor(color, mult=1) {
    let rgb = []
    PS.unmakeRGB(color, rgb)
    rgb[0] -= DARKEN * mult
    rgb[1] -= DARKEN * mult
    rgb[2] -= DARKEN * mult

    return PS.makeRGB(rgb[0],rgb[1],rgb[2])
}

function colorChecker(x,y,color) {
    if ((x + y) % 2 == 1) {
        let darkColor = darkenColor(color)

        PS.color(x, y, darkColor)
    } else {
        PS.color(x,y,color)
    }
}

function render() {
    // Render empty white grid & walls
    for (let x = 0; x < GRID_X; x++) {
        for (let y = 0; y < GRID_Y; y++) {
            switch (space[x][y]) {
                case SPACE_IDS.wall:
                    colorChecker(x,y,WALL_COLOR);
                    PS.border(x, y, 0);
                    PS.glyph(x, y, 0);
                    break;
                case SPACE_IDS.burner:
                    PS.color(x,y,BURNER_COLOR);
                    PS.border(x, y, 0);
                    PS.glyph(x, y, BURNER_GLYPH);
                    PS.glyphColor(x, y, BURNER_GLYPH_COLOR)
                    break;
                default:
                    colorChecker(x,y,BACKGROUND_COLOR);
                    PS.border(x, y, 0);
                    PS.glyph(x, y, 0);
                    break;
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

    // Render inert blocks

    inertBlocks.forEach(function (block, index) {
        let x = block.x;
        let y = block.y;
        let color = block.color;

        PS.color(x, y, darkenColor(COLORS[color].base, 2));
        PS.border(x, y, BORDER_WIDTH);
        PS.borderColor(x, y, darkenColor(COLORS[color].accent, 4));
    });

    // Render poly blocks
    polyBlocks.forEach(function (block, index) {
        let x = block.x;
        let y = block.y;
        let color = block.color;

        PS.color(x, y, COLORS[color].base);
        PS.border(x, y, BORDER_WIDTH);
        PS.borderColor(x, y, COLORS[color].accent);
    });

    // Render glyphs
    glyphs.forEach(function (glyph, index) {
        let x = glyph[0];
        let y = glyph[1];
        let char = glyph[2];

        PS.glyph(x, y, char);
        PS.glyphColor(x, y, TEXT_COLOR);
    })

    // Render parent block face if its alive
    if (isParentAlive) {
        PS.glyph(parentBlock.x, parentBlock.y, PARENT_GLYPH);
        PS.glyphColor(parentBlock.x, parentBlock.y, COLORS[parentBlock.color].accent);
    }
}

function isMovementValid(x, y) {
    let valid = true
    polyBlocks.forEach(function (block, index) {
        // Check bounds of movement
        if (block.x + x < 0 || block.x + x >= GRID_X || block.y + y < 0 || block.y + y >= GRID_Y) {
            valid = false
        } else if (space[block.x + x][block.y + y] == SPACE_IDS.wall) {
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
    if (goals.length == 0) {
        return false;
    }

    for (let i = 0; i < goals.length; i++) {
        // Check that every goal is fulfilled
        let fulfilled = false;

        // Check poly blocks
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

        if (fulfilled) {
            continue;
        }

        // Check inert blocks
        for (let j = 0; j < inertBlocks.length; j++) {
            if (goals[i].x == inertBlocks[j].x && goals[i].y == inertBlocks[j].y) {
                // Some block occupies the spot
                if (goals[i].color == "any" || goals[i].color == inertBlocks[j].color) {
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

function destroyBlocks(indexesToRemove) {
    // Iterate through indexes backwards
    for (let i = indexesToRemove.length - 1; i >= 0; i--) {
        let indexRemoving = indexesToRemove[i];

        if (polyBlocks[indexRemoving] == parentBlock) {
            // Kill the parent block
            isParentAlive = false;
        }
        polyBlocks.splice(indexRemoving, 1);
    }

    // Add the remaining blocks back to inert blocks
    for (let i = 0; i < polyBlocks.length; i++) {
        let block = polyBlocks[i];
        if (block != parentBlock) {
            inertBlocks.push(block);
        }
    }

    if (isParentAlive) {
        PS.audioPlay(BURN_SOUND)
        polyBlocks = [parentBlock];
    } else {
        PS.audioPlay(DEATH_SOUND)
        polyBlocks = []
    }
    checkInertBlocks();
}

function makeGameState() {
    let currentParent = [parentBlock.x, parentBlock.y, parentBlock.color];
    let currentPolyBlocks = [];
    let currentInertBlocks = [];

    for (let i = 0; i < polyBlocks.length; i++) {
        let block = polyBlocks[i];
        currentPolyBlocks.push([block.x, block.y, block.color]);
    }

    for (let i = 0; i < inertBlocks.length; i++) {
        let block = inertBlocks[i];
        currentInertBlocks.push([block.x, block.y, block.color]);
    }

    // Create game state
    let state = new GameState(currentParent, currentPolyBlocks, currentInertBlocks);

    gameStates.push(state);
}

function move(x, y) {
    if (!isMovementValid(x,y)) {
        PS.audioPlay(COLLISION_SOUND, {volume: 0.3})
        return;
    }

    // Make game state prior to movement
    makeGameState();

    PS.audioPlay(MOVE_SOUND, {volume: 0.15})

    let indexesToDestroy = []

    for (let i = 0; i < polyBlocks.length; i++) {
        let block = polyBlocks[i];
        block.x += x;
        block.y += y;

        if (space[block.x][block.y] == SPACE_IDS.burner) {
            indexesToDestroy.push(i);
        }
    }

    // If there are any blocks to destroy, destroy them
    if (indexesToDestroy.length > 0) {
        destroyBlocks(indexesToDestroy)
    }

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

function reset() {
    PS.audioPlay(RESET_SOUND)
    parseLevel(currentLevel);
    render();
}

function undo() {
    if (gameStates.length < 1) {
        PS.audioPlay(COLLISION_SOUND, {volume: 0.3});
        return;
    }

    // Reset current values
    parentBlock = null;
    polyBlocks = [];
    inertBlocks = [];

    let lastGameState = gameStates[gameStates.length - 1];

    // Parse values in last game state
    let lastParent = lastGameState.parent;
    parentBlock = new GameObject(lastParent[0], lastParent[1], lastParent[2]);
    polyBlocks.push(parentBlock)

    for (let i = 0; i < lastGameState.poly.length; i++) {
        let block = lastGameState.poly[i];
        if (block[0] != parentBlock.x || block[1] != parentBlock.y) {
            polyBlocks.push(new GameObject(block[0], block[1], block[2]));
        }
    }

    for (let i = 0; i < lastGameState.inert.length; i++) {
        let block = lastGameState.inert[i];
        inertBlocks.push(new GameObject(block[0], block[1], block[2]));
    }

    gameStates.splice(gameStates.length - 1, 1);
    PS.audioPlay(UNDO_SOUND);
    isParentAlive = true;
    render();
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
            reset();
            break;
        case 122:
            // Undo
            undo();
            break;
    }

    // If no movement caused, return
    if (!(x == 0 && y == 0) && isParentAlive) {
        move(x, y);
    }
}
