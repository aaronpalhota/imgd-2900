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
const GAME_H = GAME_Y[1] - GAME_Y[0];
const GAME_W = GAME_X[1] - GAME_X[0] + 1;

const CHUTE_Y = GAME_Y[0] - 2;

// Gameplay constants
const GRAVITY_UPDATE = 8;
const BOMBS_PER_STAGE = 10;
const MIN_FILES_PER_STAGE = 15;
const MAX_FILES_PER_STAGE = 25;
const BLAST_RADIUS = 1;

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
const BLAST_COLOR = PS.COLOR_RED;
const BLAST_DURATION = 4;

// Laser constants
const LASER_COLOR = 0x159999;
const LASER_BORDER = 20;

// Chute constants
const CHUTE_COLOR = 0x606060;
const CHUTE_GLYPH = 0x21d3;
const CHUTE_GLYPH_COLOR = PS.COLOR_WHITE;
const CHUTE_BORDER = 4;
const CHUTE_BORDER_COLOR = 0x404040;
const CHUTE_LEFT_ARROW = 0x2190;
const CHUTE_RIGHT_ARROW = 0x2192;

// Score constants
let POINTS_PER_FILE = 50;
let POINTS_PER_BOMB = 100;
let POINTS_PER_LEVEL = 1000;

// Space IDs
const TILE_IDS = {
clear: 0,
file: 1,
folder: 2, // Turn into a file on explosion
bomb: 3, // Destroy additional blocks upon explosion
virus: 4, // Unaffected by gravity AND spawn garbage
garbage: 5 // Functions like a normal file
}

const TILE_STYLES = {
[TILE_IDS.file]: {
    color: 0xe7c9a9,
    glyph: 0x1F4C4,
},
[TILE_IDS.folder]: {
    color: 0xbd9f80,
    glyph: 0x1F4C1,
},
[TILE_IDS.bomb]: {
    color: 0xe36159,
    glyph: 0x1F9E8,
},
[TILE_IDS.virus]: {
    color: 0xac63d4,
    glyph: 0x1F47E,
},
[TILE_IDS.garbage]: {
    color: 0x49454d,
    glyph: 0x1F5D1,
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
const WIN_SOUND = "fx_tada";
const LOSE_SOUND = "fx_bloink";
const POINTS_SOUND = "fx_coin1";

let position = 4;
let scoreAtStart = 0;
let score = 0;
let currentLevel = 0;
let bombsLeft = BOMBS_PER_STAGE;
let tilesLeft = MIN_FILES_PER_STAGE;
let virusesLeft = 0;
let gameActive = true;
let gravityTimer;
let results = false;

let bombs = [];
let tiles = [];
let blasts = [];

PS.init = function( system, options ) {
// Load sounds
PS.audioLoad(MOVE_SOUND);
PS.audioLoad(GRAVITY_SOUND);
PS.audioLoad(SHOOT_SOUND);
PS.audioLoad(EXPLODE_SOUND);

PS.gridSize(GRID_X, GRID_Y);
PS.statusText("Portfolio Cleanup");
PS.gridColor(PS.COLOR_GRAY_DARK);
PS.statusColor(PS.COLOR_WHITE);

// Set all border & BG color
for (let x = 0; x < GRID_X; x++) {
    for (let y = 0; y < GRID_Y; y++) {
        PS.borderColor(x, y, OUTLINE_COLOR);
        PS.color(x,y,BG_COLOR);
    }
}

buildLevel();
};

function buildLevel() {
// Build the game space array
for (let x = 0; x < GAME_W; x++) {
    tiles[x] = []
    blasts[x] = []
    for (let y = 0; y <= GAME_H; y++) {
        tiles[x][y] = TILE_IDS.clear;
        blasts[x][y] = 0;
    }
}

// Initialize variables
if (gravityTimer) {
    PS.timerStop(gravityTimer);
    gravityTimer = null;
}
score = scoreAtStart;
results = false;
bombsLeft = BOMBS_PER_STAGE;
tilesLeft = MIN_FILES_PER_STAGE;
virusesLeft = 0;
bombs = [];

if (currentLevel == 0) {
    // Set up the tutorial level
    position = 3;
    tilesLeft = 1;
    bombsLeft = 3;
    tiles[5][GAME_H] = TILE_IDS.file;

    renderBG();
    renderGame();

    gameActive = true;
    return;
}

// Blow up the seed
PS.seed(currentLevel * 93923021939);

// Increase the # of blocks based on level
tilesLeft += Math.min(currentLevel - 1, MAX_FILES_PER_STAGE - MIN_FILES_PER_STAGE);

let specialTiles = {};

// If level > 10, spawn 0-5 bombs
// Also increments the tile count by 3 for each
if (currentLevel > 10) {
    let folderCount = PS.random(6) - 1;

    for (let i = 0; i < folderCount; i++) {
        tilesLeft += 3;
        specialTiles[PS.random(tilesLeft - 1)] = TILE_IDS.bomb;
    }
}
// If level > 5, spawn 0-3 folders
if (currentLevel > 5) {
    let folderCount = PS.random(4) - 1;

    for (let i = 0; i < folderCount; i++) {
        specialTiles[PS.random(tilesLeft - 1)] = TILE_IDS.folder;
    }
}
// If level > 15, spawn 0-1 viruses
if (currentLevel > 15) {
    let folderCount = PS.random(2) - 1;

    for (let i = 0; i < folderCount; i++) {
        virusesLeft++;
        specialTiles[PS.random(tilesLeft - 1)] = TILE_IDS.virus;
    }
}

let rowStacks = [];
for (let x = 0; x < GAME_W; x++) {
    rowStacks[x] = 0;
}

for (let i = 0; i < tilesLeft; i++) {
    let x = PS.random(GAME_W) - 1;

    while(rowStacks[x] >= GAME_H) {
        x++;
        if (x >= GAME_W) {
            x = 0;
        }
    }

    let y = GAME_H - rowStacks[x];
    rowStacks[x] += 1;
    if (specialTiles[i]) {
        tiles[x][y] = specialTiles[i];
    } else {
        tiles[x][y] = TILE_IDS.file;
    }
}

renderBG();
renderGame();
PS.audioPlay(MOVE_SOUND);

gameActive = true;
}

function spawnGarbage() {
let x = PS.random(GAME_W) - 1;

while(tiles[x][0] != TILE_IDS.clear || x == position - GAME_X[0]) {
    x++;
    if (x > GAME_W) {
        x = 0;
    }
}

let y = 0;

tiles[x][y] = TILE_IDS.garbage;
tilesLeft += 1;
}

const SCORE_DELAY_TICKS = 10;
let scoreDelayTimer;
let lastIncrement;
function printScoreDelay(increment) {
if (scoreDelayTimer) {
    PS.timerStop(scoreDelayTimer);
    scoreDelayTimer = null;

    printScore(lastIncrement);
}

scoreDelayTimer = PS.timerStart(SCORE_DELAY_TICKS, function() {
    printScore(increment);
    PS.audioPlay(POINTS_SOUND, {volume:0.3});
});
    lastIncrement = increment;
}

let scoreTimer;
const SCORE_TICKS = 60;
function printScore(increment) {
    if (scoreTimer) {
        PS.timerStop(scoreTimer);
        scoreTimer = null;
    }
    if (scoreDelayTimer) {
        PS.timerStop(scoreDelayTimer);
        scoreDelayTimer = null;
    }

    if (increment == 0) {
        printString(0, 1, score.toString(), TEXT_COLOR, GRID_X);
    } else {
        printString(0, 1, score.toString() + " +" + increment.toString(), TEXT_COLOR, GRID_X);

        scoreTimer = PS.timerStart(SCORE_TICKS, function() {
            printScore(0);
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

function explodeTile(x,y) {
    if (x < GAME_X[0] || x > GAME_X[1] || y < GAME_Y[0] || y > GAME_Y[1]) {
        return 0;
    }

    let tileX = x - GAME_X[0];
    let tileY = y - GAME_Y[0];

    blasts[tileX][tileY] = BLAST_DURATION;

    if (tiles[tileX][tileY] && tiles[tileX][tileY] != TILE_IDS.clear) {
        switch (tiles[tileX][tileY]) {
            case TILE_IDS.file:
            case TILE_IDS.garbage:
                tiles[tileX][tileY] = TILE_IDS.clear;
                tilesLeft -= 1;
                return 1;
            case TILE_IDS.folder:
                tiles[tileX][tileY] = TILE_IDS.file;
                return 0;
            case TILE_IDS.bomb:
                tiles[tileX][tileY] = TILE_IDS.clear;
                explodeBomb(x, y, 1);
                tilesLeft -= 1;
                return 1;
            case TILE_IDS.virus:
                tiles[tileX][tileY] = TILE_IDS.clear;
                tilesLeft -= 1;
                virusesLeft -= 1;
                return 1;
        }
    }

    return 0;
}

function explodeBomb(x, y, r) {
    let filesDestroyed = 0;

    for (let a = x - r; a <= x + r; a++) {
        for (let b = y - r; b <= y + r; b++) {
            filesDestroyed += explodeTile(a,b);
        }
    }

    let points = filesDestroyed * POINTS_PER_FILE;
    score += points;
    printScoreDelay(points);
}

const RESULT_Y = 6
function createResultWindow(line1, line2, line3) {
    drawWindow(1, RESULT_Y, GRID_X - 2, 4, "LEVEL")
    printString(1, RESULT_Y + 1, line1, TEXT_COLOR, GRID_X-2);
    printString(1, RESULT_Y + 2, line2, TEXT_COLOR, GRID_X-2);
    printString(1, RESULT_Y + 3, line3, TEXT_COLOR, GRID_X-2);
}

function printLevelComplete() {
    let points = bombsLeft * POINTS_PER_BOMB + POINTS_PER_LEVEL;

    createResultWindow("CLEANED!", "+" + points.toString(), "→SPACE");

    return points;
}

function levelComplete() {
    let points = printLevelComplete();

    results = true;
    gameActive = false;
    score += points;
    currentLevel += 1;
    scoreAtStart = score;
    printScoreDelay(points);
    PS.audioPlay(WIN_SOUND);
}

function levelFailed() {
    createResultWindow("FAILED.", tilesLeft.toString() + " LEFT", "⟳SPACE");
    results = true;
    gameActive = false;
    PS.audioPlay(LOSE_SOUND);
}

function handleTileGravity() {
    let affected = false;

    for (let y = GAME_H; y > 0; y--) {
        for (let x = 0; x < GAME_W; x++) {
            let tile = tiles[x][y];
            let tileAbove = tiles[x][y - 1];

            if (tile == TILE_IDS.clear && tileAbove != TILE_IDS.clear && tileAbove != TILE_IDS.virus) {
                // Block can fall
                tiles[x][y] = tileAbove;
                tiles[x][y - 1] = TILE_IDS.clear;
                affected = true;
            }
        }
    }

    return affected;
}

function blendBlast(x, y, saturation) {
    let blastRGB = [];
    let tileRGB = [];
    let borderRGB = [];
    let rgb1 = [];
    let rgb2 = [];
    PS.unmakeRGB(BLAST_COLOR, blastRGB);
    PS.unmakeRGB(PS.color(x,y), tileRGB);
    PS.unmakeRGB(PS.borderColor(x,y), borderRGB)
    for (let i = 0; i < 3; i++) {
        rgb1[i] = (blastRGB[i] * saturation + tileRGB[i] * BLAST_DURATION) / (saturation + BLAST_DURATION);
        rgb2[i] = (blastRGB[i] * saturation + borderRGB[i] * BLAST_DURATION) / (saturation + BLAST_DURATION);
    }
    PS.color(x, y, PS.makeRGB(rgb1[0],rgb1[1],rgb1[2]))
    PS.borderColor(x, y, PS.makeRGB(rgb2[0],rgb2[1],rgb2[2]))
}

function renderBlastOverlay() {
    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            if (blasts[x][y] > 0) {
                blendBlast(x + GAME_X[0], y + GAME_Y[0], blasts[x][y])
            }
        }
    }
}

function tickBlastOverlay() {
    let affected = false;

    for (let x = 0; x < tiles.length; x++) {
        for (let y = 0; y < tiles[x].length; y++) {
            if (blasts[x][y] > 0) {
                blasts[x][y]--;
                affected = true;
            }
        }
    }

    return affected;
}

function gravityTick() {
    let bombGravityApplied = false;
    let tileGravityApplied = handleTileGravity();
    let blastAffected = tickBlastOverlay();
    let exploded = false;
    let explodeIndices = [];

    // Check to see if any bombs can explode
    for (let i = 0; i < bombs.length; i++) {
        bombGravityApplied = true;
        bombs[i].y += 1;
        let tileX = bombs[i].x - GAME_X[0];
        let tileY = bombs[i].y - GAME_Y[0];

        if (bombs[i].y == GAME_Y[1] || tiles[tileX][tileY + 1] != TILE_IDS.clear) {
            // Add to array in reverse order
            explodeIndices.unshift(i);
        }
    }

    // Make bombs explode
    for (let n = 0; n < explodeIndices.length; n++) {
        exploded = true;
        let x = bombs[explodeIndices[n]].x;
        let y = bombs[explodeIndices[n]].y;

        bombs.splice(explodeIndices[n],1);
        explodeBomb(x,y,BLAST_RADIUS);
    }

    if (exploded) {
        PS.audioPlay(EXPLODE_SOUND);
    }
    if (bombGravityApplied || tileGravityApplied) {
        PS.audioPlay(GRAVITY_SOUND, {volume: 0.1});
    } else if (!blastAffected) {
        PS.timerStop(gravityTimer);
        gravityTimer = null;
    }

    renderGame();

    // Check win condition
    if (tilesLeft == 0 && gameActive) {
        gameActive = false;
        levelComplete();
    } else if (bombsLeft == 0 && !gravityTimer && gameActive) {
        gameActive = false;
        levelFailed();
    }
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

    // Render chute arrows
    for (let y = -1; y <= GAME_H; y++) {
        if (y != -1 && tiles[position - GAME_X[0]][y] != TILE_IDS.clear) {
            // Tile breaks laser line of sight
            break;
        }
        let gameY = y + GAME_Y[0];
        PS.color(position, gameY, LASER_COLOR);
        PS.borderColor(position, gameY, BG_COLOR);
        PS.border(position, gameY,
            {top: 0, left: LASER_BORDER, right: LASER_BORDER, bottom: 0, equal: false, width: 0});
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
                PS.fade(x + GAME_X[0], y + GAME_Y[0], 0);
                PS.color(x + GAME_X[0], y + GAME_Y[0], TILE_STYLES[id].color);
                PS.glyph(x + GAME_X[0], y + GAME_Y[0], TILE_STYLES[id].glyph);
                PS.glyphColor(x + GAME_X[0], y + GAME_Y[0], PS.COLOR_WHITE);
            }
        }
    }

    // Blast effect
    renderBlastOverlay();

    // Results handling
    if (results) {
        printLevelComplete();
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
        PS.border(a,y,0);
        PS.borderColor(a,y,OUTLINE_COLOR);
    }
    for (let a = x; a < x + w; a++) {
        for (let b = y + 1; b < y + h; b++) {
            PS.color(a,b,BODY_COLOR);
            PS.border(a,b,0);
            PS.borderColor(a,b,OUTLINE_COLOR);
        }
    }

    // Borders, sides
    for (let a = x + 1; a < x + w - 1; a++) {
        PS.border(a, y, {top: BORDER, left: 0, right: 0, bottom: 0, equal: false, width: 0});
        PS.border(a, y+h-1, {top: 0, left: 0, right: 0, bottom: BORDER, equal: false, width: 0});
    }
    for (let b = y + 1; b < y + h - 1; b++) {
        PS.border(x, b, {top: 0, left: BORDER, right: 0, bottom: 0, equal: false, width: 0});
        PS.border(x+w-1, b, {top: 0, left: 0, right: BORDER, bottom: 0, equal: false, width: 0});
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

    for (let i = 0; i < virusesLeft; i++) {
        spawnGarbage();
    }

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
        if (results && key == PS.KEY_SPACE) {
            buildLevel();
        }
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
