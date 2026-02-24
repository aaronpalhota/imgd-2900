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

// Four tiles above for score, chute, & buffer
// Two tiles below for bombs left
const GRID_X = 10;
const GRID_Y = 18;
const GAME_X = [1,GRID_X - 2];
const GAME_Y = [4,GRID_Y - 3];
const MAX_FILE_H = GAME_Y[1] - GAME_Y[0];
const BOMB_SPAWN_Y = GAME_Y[0] - 1;

const CHUTE_Y = GAME_Y[0] - 2;

const GRAVITY_UPDATE = 10;
const BOMBS_PER_STAGE = 10;
const FILES_PER_STAGE = 25;

// Environment constants
const BG_COLOR = 0x008080;
// Tab constants
const HEADER_COLOR = 0x000080;
const HEADER_TEXT_COLOR = PS.COLOR_WHITE;
const BODY_COLOR = 0xc0c0c0;
const SIDE_COLOR = 0xa0a0a0;
const TEXT_COLOR = PS.COLOR_BLACK;
const OUTLINE_COLOR = PS.COLOR_BLACK;
const CLOSE_COLOR = PS.COLOR_RED;
const MIN_COLOR = PS.COLOR_YELLOW;
const MAX_COLOR = 0x009619;
const BUTTON_GLYPH = 0x2B24;
const BORDER = 2;

// Bomb constants
const BOMB_GLYPH = 0x1F4A3;

// Chute constants
const CHUTE_COLOR = 0x606060;
const CHUTE_GLYPH = 0x21d3;
const CHUTE_GLYPH_COLOR = PS.COLOR_WHITE;
const CHUTE_BORDER = 4;
const CHUTE_BORDER_COLOR = 0x404040;
const CHUTE_LEFT_ARROW = 0x2190;
const CHUTE_RIGHT_ARROW = 0x2192;

// Space IDs
const TILE_IDS = {
    clear: 0,
    file: 1,
    bomb: 2,
    folder: 3
}

const TILE_STYLES = {
    [TILE_IDS.file]: {
        color: 0xe7c9a9,
        glyph: 0x1F4C4,
    }
}

// Bomb

function Bomb() {
    this.x = position;
    this.y = CHUTE_Y + 1;
}

const MOVE_SOUND = "fx_click";
const GRAVITY_SOUND = "fx_swoosh";
const SHOOT_SOUND = "fx_silencer";
const EXPLODE_SOUND = "fx_blast1";

let position = 4;
let scoreAtStart = 0;
let score = 0;
let currentLevel = 0;
let bombsLeft = BOMBS_PER_STAGE;
let gameActive = true;
let gravityTimer;

let bombs = [];
let tiles = [];

PS.init = function( system, options ) {
    // Load sounds
    PS.audioLoad(MOVE_SOUND);
    PS.audioLoad(GRAVITY_SOUND);
    PS.audioLoad(SHOOT_SOUND);
    PS.audioLoad(EXPLODE_SOUND);

    PS.gridSize(GRID_X, GRID_Y);
    PS.statusText("Portfolio Cleanup")
    PS.gridColor(PS.COLOR_DARK_GRAY)

    // Set all border & BG color
    for (let x = 0; x < GRID_X; x++) {
        for (let y = 0; y < GRID_Y; y++) {
            PS.borderColor(x, y, OUTLINE_COLOR);
            PS.color(x,y,BG_COLOR);
        }
    }

    renderBG();
    buildLevel();
    renderGame();
};

function buildLevel() {
    let gameWidth = GAME_X[1] - GAME_X[0];
    let gameHeight = GAME_Y[1] - GAME_Y[0];
    // Build the game space array
    for (let x = 0; x < gameWidth; x++) {
        tiles[x] = []
        for (let y = 0; y < gameHeight; y++) {
            tiles[x][y] = TILE_IDS.clear;
        }
    }

    // Initialize variables
    scoreAtStart = score;
    bombsLeft = BOMBS_PER_STAGE;
    gameActive = true;
    bombs = [];

    if (currentLevel == 0) {
        // Set up the tutorial level
        position = 3;
        tiles[5][gameHeight] = TILE_IDS.file;
        return;
    }

    PS.seed(currentLevel);
}

let scoreTimer;
const SCORE_TICKS = 60;
function printScore(increment) {
    if (scoreTimer) { PS.timerStop(scoreTimer)}

    if (increment == 0)  {
        printString(0, 1, score.toString(), TEXT_COLOR, GRID_X);
    } else {
        printString(0, 1, score.toString() + " +" + increment.toString(), TEXT_COLOR, GRID_X);

        scoreTimer = PS.timerStart(SCORE_TICKS, function() {
            printScore(0);
            PS.timerStop(scoreTimer);
            scoreTimer = null;
        })
    }
}

function printBombs() {
    for (let x = 0; x < GRID_X; x++) {
        if (x < bombsLeft) {
            PS.glyph(x,GRID_Y-1,BOMB_GLYPH);
        } else {
            PS.glyph(x,GRID_Y-1,0);
        }
    }
}

function renderBG() {
    // Color the sides
    for (let y = GAME_Y[0] - 2; y <= GAME_Y[1]; y++) {
        PS.color(0,y,SIDE_COLOR);
        PS.color(GRID_X - 1, y, SIDE_COLOR);

        PS.border(0, y, {top: 0, left: 0, right: BORDER, bottom: 0, equal: false, width: 0});
        PS.border(GRID_X - 1, y, {top: 0, left: BORDER, right: 0, bottom: 0, equal: false, width: 0})
    }

    for (let x = GAME_X[0]; x <= GAME_X[1]; x++) {
        for (let y = GAME_Y[0]-2; y <= GAME_Y[1]; y++) {
            PS.border(x,y,0);
        }
    }

    drawWindow(0,0, GRID_X, 2, "SCORE");
    drawWindow(0,GAME_Y[1]+1, GRID_X, 2, "BOMBS");

    printScore(0);
    printBombs();
}

function explodeBombIndex(bombIndex) {
    let x = bombs[bombIndex].x;
    let y = bombs[bombIndex].y;

    bombs.splice(bombIndex,1);
}

function gravityTick() {
    let gravityAffected = false;
    let exploded = false;
    let explodeIndices = [];

    for (let i = 0; i < bombs.length; i++) {
        gravityAffected = true;
        bombs[i].y += 1;
        let tileX = bombs[i].x - GAME_X[0];
        let tileY = bombs[i].y - GAME_Y[0];

        if (bombs[i].y == GAME_Y[1] || tiles[tileX][tileY+1] != TILE_IDS.clear) {
            // Add to array in reverse order
            explodeIndices.unshift(i);
        }
    }

    for (let n = 0; n < explodeIndices.length; n++) {
        exploded = true;
        explodeBombIndex(explodeIndices[0]);
    }


    if (exploded) {
        PS.audioPlay(EXPLODE_SOUND)
    }
    if (gravityAffected) {
        PS.audioPlay(GRAVITY_SOUND, {volume: 0.1});
    } else {
        PS.timerStop(gravityTimer);
        gravityTimer = null;
    }

    renderGame();
}

function renderGame() {
    // Clear game space
    for (let x = GAME_X[0]; x <= GAME_X[1]; x++) {
        for (let y = GAME_Y[0] - 2; y <= GAME_Y[1]; y++) {
            PS.color(x,y,BG_COLOR);
            PS.glyph(x,y,0);
            PS.border(x,y,0);
        }
    }

    // Render chute
    PS.color(position,CHUTE_Y,CHUTE_COLOR);
    PS.glyph(position,CHUTE_Y,CHUTE_GLYPH);
    PS.glyphColor(position,CHUTE_Y,CHUTE_GLYPH_COLOR);
    PS.borderColor(position,CHUTE_Y,CHUTE_BORDER_COLOR);
    PS.border(position,CHUTE_Y,
        {top: 0, left: CHUTE_BORDER, right: CHUTE_BORDER, bottom: 0, equal: false, width: 0});

    // Additional chute movement arrows
    if (position > GAME_X[0]) {
        PS.glyph(position - 1, CHUTE_Y, CHUTE_LEFT_ARROW)
        PS.glyphColor(position - 1, CHUTE_Y, CHUTE_GLYPH_COLOR);
    }
    if (position < GAME_X[1]) {
        PS.glyph(position + 1, CHUTE_Y, CHUTE_RIGHT_ARROW)
        PS.glyphColor(position + 1, CHUTE_Y, CHUTE_GLYPH_COLOR);
    }

    // Render bombs
    for (let i = 0; i < bombs.length; i++) {
        let x = bombs[i].x;
        let y = bombs[i].y;

        PS.glyph(x,y,BOMB_GLYPH);
    }

    // Render files
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            let id = tiles[x][y];
            if (id != TILE_IDS.clear) {
                PS.color(x + GAME_X[0], y + GAME_Y[0], TILE_STYLES[id].color);
                PS.glyph(x + GAME_X[0], y + GAME_Y[0], TILE_STYLES[id].glyph);
            }
        }
    }
}

function printString(x,y,string,color,buffer) {
    // Clear the buffer
    for (let i = 0; (i < buffer); i++) {
        PS.glyph(x+i, y, 0);
    }

    // Print the string
    for (let i = 0; (i < string.length) && (i < buffer); i++) {
        let char = string.charCodeAt(i);
        PS.glyph(x + i, y, char);
        PS.glyphColor(x + i, y, color);
    }
}

function drawWindow(x,y,w,h,title) {
    // Color
    for (let a = x; a < x + w; a++) {
        PS.color(a,y,HEADER_COLOR);
    }
    for (let a = x; a < x + w; a++) {
        for (let b = y + 1; b < y + h; b++) {
            PS.color(a,b,BODY_COLOR);
        }
    }

    // Borders, sides
    for (let a = x + 1; a < x + w - 1; a++) {
        PS.border(a, y, {top: BORDER, left: 0, right: 0, bottom: 0, equal: false, width: 0});
        PS.border(a, y+h-1, {top: 0, left: 0, right: 0, bottom: BORDER, equal: false, width: 0});
    }

    // Borders, corners
    PS.border(x,y,{top: BORDER, left: BORDER, right: 0, bottom: 0, equal: false, width: 0})
    PS.border(x+w-1,y,{top: BORDER, left: 0, right: BORDER, bottom: 0, equal: false, width: 0})
    PS.border(x,y+h-1,{top: 0, left: BORDER, right: 0, bottom: BORDER, equal: false, width: 0})
    PS.border(x+w-1,y+h-1,{top: 0, left: 0, right: BORDER, bottom: BORDER, equal: false, width: 0})

    // Title
    printString(x,y,title,HEADER_TEXT_COLOR,w)

    // Glyphs
    for (let a = x+w-3; a < x + w; a++) {
        PS.glyph(a,y,BUTTON_GLYPH);
    }
    PS.glyphColor(x+w-3,y,MAX_COLOR);
    PS.glyphColor(x+w-2,y,MIN_COLOR);
    PS.glyphColor(x+w-1,y,CLOSE_COLOR);
}

function fireBomb() {
    if (bombsLeft < 1) {
        return;
    }

    bombsLeft = bombsLeft - 1;
    let bomb = new Bomb();

    bombs.push(bomb);
    PS.audioPlay(SHOOT_SOUND);
    printBombs();
    renderGame();

    if (!gravityTimer) {
        gravityTimer = PS.timerStart(GRAVITY_UPDATE, gravityTick);
    }
}

function move(direction) {
    let success = true;
    position += direction;

    if (position < GAME_X[0]) {
        success = false;
        position = GAME_X[0];
    } else if (position > (GAME_X[1])) {
        success = false;
        position = GAME_X[1];
    }

    if (success) {
        // Play success audio & render new pos
        PS.audioPlay(MOVE_SOUND);
        renderGame();
    }
}

function moveLeft() { move(-1); }
function moveRight() { move(1); }

PS.keyDown = function( key, shift, ctrl, options ) {
    if (!gameActive) {
        return;
    }

    switch( key ) {
        case (PS.KEY_ARROW_LEFT):
            moveLeft();
            break;
        case (PS.KEY_ARROW_RIGHT):
            moveRight();
            break;
        case (PS.KEY_SPACE):
            fireBomb();
            break;
    }
}