/**
 * Created by Lior on 17/09/2015.
 */
// GLOBAL VARIABLES
var tileHeight = 5,
    tileWidth = 5,
    stageHeight = 770,
    stageWidth = 1340,
    landColor = 0x00BC00,
    seaColor = 0x0000C8,
    mountainColor = 0x8C8C8C,
    landMinimum = 0,
    mountainMinimum = 60,
    chunkHeight = 20,
    chunkWidth = 20;

// MOTION VARIABLES
var gain = $('#gain').val(),
    octaves = $('#octaves').val(),
    lacunarity = $('#lacunarity').val(),
    frequency = $('#frequency ').val();

var simplex = new SimplexNoise();

var renderer = new PIXI.WebGLRenderer(stageWidth - (chunkWidth * tileWidth * 2), stageHeight - (chunkHeight * tileHeight * 2));
//var renderer = new PIXI.WebGLRenderer(stageWidth, stageHeight); // Real size where you can see the real time terrain generation

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
stage.x -= chunkWidth*tileWidth; // Delete these two lines if you want to see the real time terrain generation
stage.y -= chunkHeight*tileHeight;
var graphics = new PIXI.Graphics();
var size = (stageHeight / tileHeight) * (stageWidth / tileWidth);
var mapContainer = new PIXI.ParticleContainer(size, {});
stage.addChild(mapContainer);
var tiles = [];
var chunksContainer = new PIXI.Container();
var chunks = [];
var xPos = 0, yPos = 0;
stage.addChild(chunksContainer);

graphics.beginFill(landColor);
graphics.drawRect(0, 0, tileWidth, tileHeight);
graphics.endFill();

graphics.beginFill(seaColor);
graphics.drawRect(0, tileHeight + 1, tileWidth, tileHeight);
graphics.endFill();

graphics.beginFill(mountainColor);
graphics.drawRect(0, tileHeight * 2 + 1, tileWidth, tileHeight);
graphics.endFill();
var tilesTextures = graphics.generateTexture();

var landTexture = new PIXI.Texture(tilesTextures.baseTexture, new PIXI.Rectangle(0, 0, tileWidth, tileHeight));
var seaTexture = new PIXI.Texture(tilesTextures.baseTexture, new PIXI.Rectangle(0, tileHeight + 1, tileWidth, tileHeight));
var mountainTexture = new PIXI.Texture(tilesTextures.baseTexture, new PIXI.Rectangle(0, tileHeight * 2 + 1, tileWidth, tileHeight));

function noiseMotion(xin, yin) {
    var total = 0.0;
    var freq = frequency;
    var amplitude = gain;
    for (i = 0; i < octaves; ++i) {
        total += simplex.noise(xin * freq, yin * freq) * amplitude;
        freq *= lacunarity;
        amplitude *= gain;
    }
    return total;
}

function initializeMap(){
    for (var i = 0; i < stageWidth / tileWidth; i++) {
        tiles[i] = [];
        for (var j = 0; j < stageHeight / tileHeight; j++) {
            tiles[i][j] = new PIXI.Sprite(seaTexture);
            tiles[i][j].x = i * tileWidth;
            tiles[i][j].y = j * tileHeight;
            mapContainer.addChild(tiles[i][j]);
        }
    }
}

function drawMap() {
    refreshValues();
    //mapContainer.removeChildren();
    //for (var i = 0; i < stageWidth / tileWidth; i++) {
    //        for (var j = 0; j < stageHeight / tileHeight; j++) {
    //        var tile = generateTile(i, j);
    //        tile.x = i * tileWidth;
    //        tile.y = j * tileHeight;
    //        mapContainer.addChild(tile);
    //    }
    //}
    //renderer.render(stage);
    drawMapInChunks();
    return false;
}

function drawNewMap(){
    simplex = new SimplexNoise();
    drawMap();
}

function refreshValues(){
    gain = $('#gain').val();
    octaves = $('#octaves').val();
    lacunarity = $('#lacunarity').val();
    frequency = $('#frequency').val();
}

function initChunks(){
    for(var i = 0; i < (stageWidth / tileWidth) / chunkWidth; i ++) {
        chunks[i] = [];
    }
}

initChunks();

function drawMapInChunks(){
    refreshValues();
    chunksContainer.removeChildren();
    for(var i = 0; i < (stageWidth / tileWidth) / chunkWidth; i ++){
        for(var j = 0; j < (stageHeight / tileHeight) / chunkHeight; j ++){
            var chunk = loadChunk(xPos + (i* chunkWidth), yPos + (j * chunkHeight), xPos + (i*chunkWidth) + chunkWidth, yPos + (j*chunkHeight) + chunkHeight);
            chunk.x = i * tileWidth * chunkWidth;
            chunk.y = j * tileHeight * chunkHeight;
            chunksContainer.addChild(chunk);
            chunks[i][j] = chunk;
            //renderer.render(chunksContainer);
        }
    }
}

function moveMap(byX, byY){
    chunksContainer.x -= byX;
    chunksContainer.y -= byY;
    var reset = false;
    if(chunksContainer.x <= -chunkWidth*tileWidth){
        reset = true;
        for(var i = 0; i < Math.abs(chunksContainer.x / (chunkWidth * tileWidth)); i++){
            moveRight();
            chunksContainer.x = 0;
        }
    }
    if(chunksContainer.x >= chunkWidth * tileWidth){
        reset = true;
        for(var i = 0; i < chunksContainer.x / (chunkWidth * tileWidth); i++){
            moveLeft();
            chunksContainer.x = 0;
        }
    }
    if(chunksContainer.y <= -chunkHeight*tileHeight){
        reset = true;
        for(var i = 0; i < Math.abs(chunksContainer.y / (chunkHeight * tileHeight)); i++){
            moveDown();
            chunksContainer.y = 0;
        }
    }
    if(chunksContainer.y >= chunkHeight*tileHeight){
        reset = true;
        for(var i = 0; i < chunksContainer.y / (chunkHeight * tileHeight); i++){
            moveUp();
            chunksContainer.y = 0;
        }
    }
    //renderer.render(chunksContainer);
}

function loadChunk(startX, startY, endX, endY){
    var container = new PIXI.ParticleContainer();
    for(var i = 0; i < endX - startX; i++){
        for(var j = 0; j < endY - startY; j++){
            var tile = generateTile(i + startX, j + startY);
            tile.x = i * tileWidth;
            tile.y = j * tileHeight;
            container.addChild(tile);
        }
    }
    return container;
}

function shiftChunks(byX, byY){
    for(var i in chunks){
        for(var j in chunks[i]){
            chunks[i][j] = chunks[i + byX][j + byY];
        }
    }
}

function moveDown(){
    yPos += chunkHeight;
    for(var i = 0; i < chunks.length; i++){
        for(var j = 0; j < chunks[i].length; j++){
            if(j == chunks[i].length - 1){
                var chunk = loadChunk(xPos + (i * chunkWidth), yPos + (j*chunkHeight), xPos + (i * chunkWidth) + chunkWidth, yPos + (j*chunkHeight) + chunkHeight);
                chunksContainer.addChild(chunk);
                chunks[i][j] = chunk;
            }else {
                if(j == 0){
                    chunksContainer.removeChild(chunks[i][j]);
                }
                chunks[i][j] = chunks[i][j + 1];
            }
            chunks[i][j].x = i * tileWidth * chunkWidth;
            chunks[i][j].y = j * tileHeight * chunkHeight;
        }
    }
    //renderer.render(chunksContainer);
}

function moveUp(){
    yPos -= chunkHeight;
    for(var i= 0; i < chunks.length; i++){
        for(var j = chunks[i].length - 1; j >= 0; j--){
            if(j == 0){
                var chunk = loadChunk(xPos + (i * chunkWidth), yPos + (j*chunkHeight), xPos + (i * chunkWidth) + chunkWidth, yPos + (j*chunkHeight) + chunkHeight);
                chunksContainer.addChild(chunk);
                chunks[i][j] = chunk;
            } else {
                if(j == chunks[i].length - 1){
                    chunksContainer.removeChild(chunks[i][j]);
                }
                chunks[i][j] = chunks[i][j - 1];
            }
            chunks[i][j].x = i * tileWidth * chunkWidth;
            chunks[i][j].y = j * tileHeight * chunkHeight;
        }
    }
    //renderer.render(chunksContainer);
}

function moveRight(){
    xPos += chunkWidth;
    for(var i = 0; i < chunks.length; i++){
        for(var j = 0; j < chunks[i].length; j++){
            if(i == chunks.length - 1){
                var chunk = loadChunk(xPos + (i * chunkWidth), yPos + (j*chunkHeight), xPos + (i * chunkWidth) + chunkWidth, yPos + (j*chunkHeight) + chunkHeight);
                chunksContainer.addChild(chunk);
                chunks[i][j] = chunk;
            }else {
                if(i == 0){
                    chunksContainer.removeChild(chunks[i][j]);
                }
                chunks[i][j] = chunks[i + 1][j];
            }
            chunks[i][j].x = i * tileWidth * chunkWidth;
            chunks[i][j].y = j * tileHeight * chunkHeight;
        }
    }
    //renderer.render(chunksContainer);
}

function moveLeft(){
    xPos -= chunkWidth;
    for(var i= chunks.length - 1; i >= 0 ; i--){
        for(var j = 0; j < chunks[i].length; j++){
            if(i == 0){
                var chunk = loadChunk(xPos + (i * chunkWidth), yPos + (j*chunkHeight), xPos + (i * chunkWidth) + chunkWidth, yPos + (j*chunkHeight) + chunkHeight);
                chunksContainer.addChild(chunk);
                chunks[i][j] = chunk;
            } else {
                if(i == chunks.length - 1){
                    chunksContainer.removeChild(chunks[i][j]);
                }
                chunks[i][j] = chunks[i - 1][j];
            }
            chunks[i][j].x = i * tileWidth * chunkWidth;
            chunks[i][j].y = j * tileHeight * chunkHeight;
        }
    }
    //renderer.render(chunksContainer);
}

function generateTile(noiseX, noiseY){
    return new PIXI.Sprite(
        noiseMotion(noiseX, noiseY) > landMinimum ? (noiseMotion(noiseX,noiseY) > mountainMinimum ? mountainTexture : landTexture) : seaTexture
    );
}

var xSpeed = 0;
var ySpeed = 0;
var moveSpeed = 2;

$('body').keydown(function (event) {
        switch(event.which){
            case 37: xSpeed = -moveSpeed; break;
            case 39: xSpeed = moveSpeed; break;
            case 38: ySpeed = moveSpeed; break;
            case 40: ySpeed = -moveSpeed; break;
        }
});

$('body').keyup(function (event) {
    switch(event.which){
        case 37:
        case 39: xSpeed = 0; break;
        case 38:
        case 40: ySpeed = 0; break;
    }
});

function update(){
    moveMap(xSpeed, ySpeed);

    renderer.render(stage);

    requestAnimationFrame(update);
}

drawMap();

update();