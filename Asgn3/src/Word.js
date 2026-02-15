// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;

  void main() {
   if(u_whichTexture == -2){ // Use color
       gl_FragColor = u_FragColor;
   }else if(u_whichTexture == -1){ // use UV DEBUG
      gl_FragColor = vec4(v_UV,1.0,1.0);

   }else if(u_whichTexture == 0){
       gl_FragColor = texture2D(u_Sampler0, v_UV);
   }else if(u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
   }else{ // Error, put redlish
       gl_FragColor = vec4(1,0.2,0.2,1);
   }
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Vaiables
let canvas;
let gl;
let a_Position;
let a_UV;

let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;


let g_selectSize = 10.0;
let g_selectType = POINT;
let g_segCount = 20;
let g_globalAngle = 0;
let g_yellowAngle = 0
let g_yellowAnimation = false;

// Koala animation variables
let g_headAngle = 0;
let g_leftArmUpper = -20;
let g_leftArmLower = 0;
let g_rightArmUpper = -20;
let g_rightArmLower = 0;
let g_leftLegUpper = 10;
let g_leftLegLower = -30;
let g_rightLegUpper = 10;
let g_rightLegLower = -30;
let g_earAngle = 0;
let g_koalaAnimation = false;

// Mouse rotation variables (Left over for slider, but not used for FPS camera)
let g_mouseXRotation = 0;
let g_mouseYRotation = 0;

// Poke animation variables
let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_pokeDuration = 3.0; // 3 seconds for complete animation
let g_fallOffset = 0;
let g_koalaRotation = 0;

// Camera Variables (MOVED HERE TO GLOBAL SCOPE)
let g_cameraYaw = -90;   // Start looking down the -Z axis
let g_cameraPitch = -10; // Start looking slightly down

// Minecraft world - 3D array to store cubes
let g_map = [];
for (let x = 0; x < 32; x++) {
    g_map[x] = [];
    for (let y = 0; y < 32; y++) {
        g_map[x][y] = [];
        for (let z = 0; z < 32; z++) {
            g_map[x][y][z] = 0; // 0 = empty, 1 = wall.jpg cube, 2 = CanBreak_wall.jpg cube
        }
    }
}

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connetVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return false;
    }
    
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
        return false;
    }
    
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (u_whichTexture === null) console.log('Failed to get u_whichTexture');
}


function initTextures() {
    // Load texture 0 - wall.jpg
    var image0 = new Image();
    if (!image0) {
        console.log('Failed to create image0 object');
        return false;
    }
    image0.onload = function () { SendTextureToGLSL(image0, 0); };
    image0.src = 'wall.jpg';

    // Load texture 1 - CanBreak_wall.jpg
    var image1 = new Image();
    if (!image1) {
        console.log('Failed to create image1 object');
        return false;
    }
    image1.onload = function () { SendTextureToGLSL(image1, 1); };
    image1.src = 'CanBreak_wall.jpg';

    return true;
}

function SendTextureToGLSL(image, texUnit) {
    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    if (texUnit === 0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_Sampler0, 0);
    } else if (texUnit === 1) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_Sampler1, 1);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    console.log('finished loadTexture unit', texUnit);
}



let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; //White
function addActionsForHtmlUI() {

    //Button Events(Shape Type)
    document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; }; // Green
    document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; }; // Red
    document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllshapes(); };
    document.getElementById('pointButton').onclick = function () { g_selectType = POINT };
    document.getElementById('triButton').onclick = function () { g_selectType = TRIANGLE };
    document.getElementById('circleButton').onclick = function () { g_selectType = CIRCLE };
    document.getElementById("drawMyPicture").onclick = function () { drawMyPicture() };
    document.getElementById("animationYellowOnButton").onclick = function () { g_koalaAnimation = true };
    document.getElementById("animationYellowOffButton").onclick = function () { g_koalaAnimation = false };

    //Slider Events (Color Channels)
    document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value / 100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value / 100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value / 100; });

    // size slider
    document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectSize = this.value; });

    //Segment
    document.getElementById('Segment').addEventListener('mouseup', function () { g_segCount = this.value; });

    //document.getElementById('angleSlide').addEventListener('mouseup', function () { g_globalAngle = this.value; renderAllshapes(); });
    document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllshapes(); });
    document.getElementById('yellowSlide').addEventListener('mousemove', function () { g_yellowAngle = this.value; renderAllshapes(); });
}

function main() {

    setupWebGL(); // set up canvas and gl variables 
    connetVariablesToGLSL() // set up GLSL shader programs and connnect GLSL vcariables

    //set uo actions for the HTML UI elements
    addActionsForHtmlUI()
    
    // Register function (event handler) to be called on a mouse press
    // Handle mouse clicks and Pointer Lock
    canvas.onmousedown = function (ev) {
        // Request game-like pointer lock if we don't have it yet
        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
            return; // Don't place a block on the initial click to lock the mouse
        }

        if (ev.shiftKey) {
            if (!g_pokeAnimation) {
                g_pokeAnimation = true;
                g_pokeStartTime = g_seconds;
            }
        } else if (ev.button === 0) { // Left click
            placeCube();
        } else if (ev.button === 2) { // Right click
            deleteCube();
        }
    };

    // Handle FPS mouse movement
    document.addEventListener('mousemove', function(ev) {
        if (document.pointerLockElement === canvas) {
            // Get relative mouse movement
            let movementX = ev.movementX || 0;
            let movementY = ev.movementY || 0;

            let sensitivity = 0.2;
            g_cameraYaw -= movementX * sensitivity;
            g_cameraPitch -= movementY * sensitivity;

            // Clamp pitch so you can't backflip the camera
            if (g_cameraPitch > 89.0) g_cameraPitch = 89.0;
            if (g_cameraPitch < -89.0) g_cameraPitch = -89.0;

            updateLookAt();
        }
    });

    // Prevent right-click context menu
    canvas.oncontextmenu = function(ev) {
        ev.preventDefault();
        return false;
    };

    document.onkeydown = keydown; // get keybord

    initTextures(gl, 0);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    requestAnimationFrame(tick);
}

var g_shapesList = []; // The array for storing shapes

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var headSphere = new Sphere();
headSphere.segments = 10;
function tick() {
    g_seconds = performance.now() / 100.0 - g_startTime;
    //console.log(g_seconds);

    updateAnimationAngles();

    // Draw everything
    renderAllshapes();

    requestAnimationFrame(tick);
}

function click(ev) {
    [x, y] = convertCoordinatedEvenToGL(ev)

    let point;
    if (g_selectType == POINT) {
        point = new Point();
    } else if (g_selectType == TRIANGLE) {
        point = new Triangle();
    } else {
        point = new Circle();
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectSize;
    g_shapesList.push(point);

    renderAllshapes();
}

function convertCoordinatedEvenToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return ([x, y])
}

function updateAnimationAngles() {
    // Poke animation takes priority
    if (g_pokeAnimation) {
        let elapsedTime = g_seconds - g_pokeStartTime;
        let t = elapsedTime / g_pokeDuration; // normalized time 0 to 1

        if (t < 1.0) {
            // Just falling and tumbling
            let fallCurve = t * t; // accelerate fall

            g_fallOffset = -2.5 * fallCurve;
            g_koalaRotation = 360 * t; // complete rotation

            // Flailing limbs
            g_leftArmUpper = 40 + 30 * Math.sin(t * Math.PI * 6);
            g_rightArmUpper = 40 + 30 * Math.sin(t * Math.PI * 6 + Math.PI);
            g_leftLegUpper = 10 + 40 * Math.sin(t * Math.PI * 5);
            g_rightLegUpper = 10 + 40 * Math.sin(t * Math.PI * 5 + Math.PI);
            g_leftArmLower = -30 * Math.sin(t * Math.PI * 8);
            g_rightArmLower = -30 * Math.sin(t * Math.PI * 8);
            g_earAngle = 10 * Math.sin(t * Math.PI * 12);
        } else {
            // Animation complete - reset to normal
            g_pokeAnimation = false;
            g_fallOffset = 0;
            g_koalaRotation = 0;
            g_headAngle = 0;
            g_leftArmUpper = -20;
            g_leftArmLower = 0;
            g_rightArmUpper = -20;
            g_rightArmLower = 0;
            g_leftLegUpper = 10;
            g_leftLegLower = -30;
            g_rightLegUpper = 10;
            g_rightLegLower = -30;
            g_earAngle = 0;
        }
    } else if (g_koalaAnimation) {
        // Normal animation - Gentle breathing and waving
        console.log("67")
        g_headAngle = 5 * Math.sin(g_seconds * 0.5);

        // Waving arms
        g_leftArmUpper = -20 + 30 * Math.sin(g_seconds);
        g_leftArmLower = -10 * Math.sin(g_seconds * 1.5);

        g_rightArmUpper = -20 + 30 * Math.sin(g_seconds + Math.PI);

        // Ear wiggle
        g_earAngle = 5 * Math.sin(g_seconds * 3);

        // Reset fall variables
        g_fallOffset = 0;
        g_koalaRotation = 0;
    } else {
        // No animation - ensure fall variables are reset
        g_fallOffset = 0;
        g_koalaRotation = 0;
    }
}

function keydown(ev) {
    let forward = [g_at[0] - g_eye[0], g_at[1] - g_eye[1], g_at[2] - g_eye[2]];
    let fLen = Math.sqrt(forward[0] ** 2 + forward[1] ** 2 + forward[2] ** 2);
    forward = [forward[0] / fLen, forward[1] / fLen, forward[2] / fLen];

    let right = [
        forward[1] * g_up[2] - forward[2] * g_up[1],
        forward[2] * g_up[0] - forward[0] * g_up[2],
        forward[0] * g_up[1] - forward[1] * g_up[0]
    ];
    let rLen = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2);
    right = [right[0] / rLen, right[1] / rLen, right[2] / rLen];

    let speed = 0.2;
    let moved = false;

    if (ev.keyCode == 68) { // D
        let newEye = [g_eye[0] + right[0] * speed, g_eye[1] + right[1] * speed, g_eye[2] + right[2] * speed];
        if (!checkCollision(newEye)) { g_eye = newEye; moved = true; }
    } else if (ev.keyCode == 65) { // A
        let newEye = [g_eye[0] - right[0] * speed, g_eye[1] - right[1] * speed, g_eye[2] - right[2] * speed];
        if (!checkCollision(newEye)) { g_eye = newEye; moved = true; }
    } else if (ev.keyCode == 87) { // W
        let newEye = [g_eye[0] + forward[0] * speed, g_eye[1] + forward[1] * speed, g_eye[2] + forward[2] * speed];
        if (!checkCollision(newEye)) { g_eye = newEye; moved = true; }
    } else if (ev.keyCode == 83) { // S
        let newEye = [g_eye[0] - forward[0] * speed, g_eye[1] - forward[1] * speed, g_eye[2] - forward[2] * speed];
        if (!checkCollision(newEye)) { g_eye = newEye; moved = true; }
    } else if (ev.keyCode == 81) { // Q - turn left
        g_cameraYaw -= 5;
        moved = true;
    } else if (ev.keyCode == 69) { // E - turn right
        g_cameraYaw += 5;
        moved = true;
    }

    // Always update g_at to stay anchored to g_eye with current Yaw/Pitch
    if (moved) updateLookAt(); 
}

// Check if position collides with any cube
function checkCollision(pos) {
    let x = Math.floor(pos[0]);
    let y = Math.floor(pos[1]);
    let z = Math.floor(pos[2]);
    
    if (x >= 0 && x < 32 && y >= 0 && y < 32 && z >= 0 && z < 32) {
        return g_map[x][y][z] !== 0; // collision if there's a cube
    }
    return false;
}

// Get cube position in front of camera
function getCubeInFront() {
    let forward = [
        g_at[0] - g_eye[0],
        g_at[1] - g_eye[1],
        g_at[2] - g_eye[2]
    ];
    
    // Check along ray from eye to 5 units away
    for (let dist = 0.5; dist < 5; dist += 0.1) {
        let checkPos = [
            g_eye[0] + forward[0] * dist,
            g_eye[1] + forward[1] * dist,
            g_eye[2] + forward[2] * dist
        ];
        
        let x = Math.floor(checkPos[0]);
        let y = Math.floor(checkPos[1]);
        let z = Math.floor(checkPos[2]);
        
        if (x >= 0 && x < 32 && y >= 0 && y < 32 && z >= 0 && z < 32) {
            if (g_map[x][y][z] !== 0) {
                return {x, y, z, dist, exists: true};
            }
        }
    }
    return {exists: false};
}

// Place cube (called by mouse click)
function placeCube() {
    let target = getCubeInFront();
    
    if (target.exists) {
        // Place cube one step before the hit cube
        let forward = [
            g_at[0] - g_eye[0],
            g_at[1] - g_eye[1],
            g_at[2] - g_eye[2]
        ];
        
        let placePos = [
            g_eye[0] + forward[0] * (target.dist - 0.6),
            g_eye[1] + forward[1] * (target.dist - 0.6),
            g_eye[2] + forward[2] * (target.dist - 0.6)
        ];
        
        let x = Math.floor(placePos[0]);
        let y = Math.floor(placePos[1]);
        let z = Math.floor(placePos[2]);
        
        if (x >= 0 && x < 32 && y >= 0 && y < 32 && z >= 0 && z < 32) {
            if (g_map[x][y][z] === 0) {
                g_map[x][y][z] = 2; // Place CanBreak_wall.jpg cube
            }
        }
    } else {
        // No cube in front, place 3 units away
        let forward = [
            g_at[0] - g_eye[0],
            g_at[1] - g_eye[1],
            g_at[2] - g_eye[2]
        ];
        
        let placePos = [
            g_eye[0] + forward[0] * 3,
            g_eye[1] + forward[1] * 3,
            g_eye[2] + forward[2] * 3
        ];
        
        let x = Math.floor(placePos[0]);
        let y = Math.floor(placePos[1]);
        let z = Math.floor(placePos[2]);
        
        if (x >= 0 && x < 32 && y >= 0 && y < 32 && z >= 0 && z < 32) {
            if (g_map[x][y][z] === 0) {
                g_map[x][y][z] = 2; // Place CanBreak_wall.jpg cube
            }
        }
    }
}

// Delete cube (only CanBreak_wall cubes)
function deleteCube() {
    let target = getCubeInFront();
    
    if (target.exists) {
        // Only delete CanBreak_wall cubes (type 2)
        if (g_map[target.x][target.y][target.z] === 2) {
            g_map[target.x][target.y][target.z] = 0;
        }
    }
}


var g_eye = [0, 0.5, 3];
var g_at = [0, 0, 0];
var g_up = [0, 1, 0];

// Update Look At Function (MOVED TO GLOBAL SCOPE)
function updateLookAt() {
    let radYaw = g_cameraYaw * Math.PI / 180.0;
    let radPitch = g_cameraPitch * Math.PI / 180.0;
    let r = 10; // Distance of the look-at point
    
    // Calculate new target point based on eye position and angles
    g_at[0] = g_eye[0] + r * Math.cos(radPitch) * Math.cos(radYaw);
    g_at[1] = g_eye[1] + r * Math.sin(radPitch);
    g_at[2] = g_eye[2] + r * Math.cos(radPitch) * Math.sin(radYaw);
}

function drawMap(){
    for(x=0;x<32;x++){
        for(y=0;y<32;y++){
            if(x ==0 || x == 31 || y == 0 || y == 31){
                        var wall = new Cube();
                        wall.color = [1.0, 1.0, 1.0, 1.0];
                        wall.matrix.translate(0, -0.75, 0);
                        wall.matrix.scale(0.5, 0.5, 0.5);
                        wall.matrix.translate(x-16,-0.75,y-16);
                        wall.textureNum = 0;
                        wall.renderfast();
                
            }
        }
    }
}

function renderAllshapes() {

    var startTime = performance.now();

    // Clear <canvas> with depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set up projection matrix (perspective)
    var projMatrix = new Matrix4();
    projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

    // Set up view matrix (camera position)
    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
        g_eye[0], g_eye[1], g_eye[2],   // eye position (camera looking from here)
        g_at[0], g_at[1], g_at[2],     // look at point (looking at origin)
        g_up[0], g_up[1], g_up[2]      // up direction
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Set up global rotation matrix (only for slider angles now)
    var globalRotMat = new Matrix4()
        .rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    //draw a cube
    var body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    body.matrix.translate(0, 0, 0.0);
    body.matrix.scale(0.5, 0.3, 0.5);
    body.textureNum = 0;
    body.render();


    //draw the floor
    var floor = new Cube();
    floor.color = [0.0, 1.0, 0.0, 1.0];
    floor.matrix.translate(0, -1.1, 0.0);
    floor.matrix.scale(15, 0, 15);
    floor.matrix.translate(-0.5, 0, -0.5);
    floor.textureNum = -2;
    floor.render();

    
    //draw the skye
    var sky = new Cube();
    sky.color = [0.0, 0.0, 1.0, 0.9];
    sky.matrix.translate(0, -1.5, 0);
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-0.5, 0, -0.5);
    sky.textureNum = -2;
    sky.render();

    // Draw world cubes
    for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 32; y++) {
            for (let z = 0; z < 32; z++) {
                if (g_map[x][y][z] !== 0) {
                    let cube = new Cube();
                    cube.matrix.translate(x, y, z);
                    
                    if (g_map[x][y][z] === 1) {
                        cube.textureNum = 0; // wall.jpg
                    } else if (g_map[x][y][z] === 2) {
                        cube.textureNum = 1; // CanBreak_wall.jpg
                    }
                    
                    cube.render();
                }
            }
        }
    }

    //drawKoala();
    drawMap();

    var duration = performance.now() - startTime;
    sendTextToHTML(" fps: " + Math.floor(10000 / duration), "numdot");
}

function drawKoala() {
    // Koala colors
    var koalaGray = [0.6, 0.6, 0.65, 1.0];
    var koalaDarkGray = [0.4, 0.4, 0.45, 1.0];
    var koalaWhite = [0.95, 0.95, 0.95, 1.0];
    var koalaBlack = [0.1, 0.1, 0.1, 1.0];
    var koalaNose = [0.2, 0.2, 0.2, 1.0];


    // Body (cylinder) - Base of the hierarchy

    var body = new Cylinder();
    body.color = koalaGray;
    body.matrix.translate(0, -0.3 + g_fallOffset, 0);
    body.matrix.rotate(g_koalaRotation, 0, 0, 1); // Apply tumble rotation
    body.matrix.rotate(180, 0, -90, 0);
    body.matrix.scale(0.35, 0.5, 0.35);
    var bodyCoords = new Matrix4(body.matrix);
    body.render();

    // Head (sphere) - connected to body

    var head = new Sphere();
    head.color = koalaGray;
    head.matrix = new Matrix4(bodyCoords);
    head.matrix.translate(0, 1.5, 0);
    head.matrix.rotate(g_headAngle, 0, 1, 0);
    head.matrix.scale(0.85, 0.75, 0.75);
    var headCoords = new Matrix4(head.matrix);
    head.render();

    var leftEar = new Sphere();
    leftEar.color = koalaDarkGray;
    leftEar.matrix = new Matrix4(headCoords);
    leftEar.matrix.translate(-0.8, 0.6, 0);
    leftEar.matrix.rotate(g_earAngle, 0, 0, 1);
    leftEar.matrix.scale(0.55, 0.55, 0.3);
    leftEar.render();

    // Right Ear (sphere)
    var rightEar = new Sphere();
    rightEar.color = koalaDarkGray;
    rightEar.matrix = new Matrix4(headCoords);
    rightEar.matrix.translate(0.8, 0.6, 0);
    rightEar.matrix.rotate(-g_earAngle, 0, 0, 1);
    rightEar.matrix.scale(0.55, 0.55, 0.3);
    rightEar.render();

    // Snout (sphere)
    var snout = new Sphere();
    snout.color = koalaWhite;
    snout.matrix = new Matrix4(headCoords);
    snout.matrix.translate(0, -0.2, 0.85);
    snout.matrix.scale(0.5, 0.4, 0.4);
    snout.render();

    // Nose (small sphere)
    var nose = new Sphere();
    nose.color = koalaNose;
    nose.matrix = new Matrix4(headCoords);
    nose.matrix.translate(0, -0.1, 1.1);
    nose.matrix.scale(0.25, 0.3, 0.2);
    nose.render();

    // Left Eye
    var leftEye = new Sphere();
    leftEye.color = koalaBlack;
    leftEye.matrix = new Matrix4(headCoords);
    leftEye.matrix.translate(-0.35, 0.15, 0.85);
    leftEye.matrix.scale(0.15, 0.15, 0.1);
    leftEye.render();

    // Right Eye
    var rightEye = new Sphere();
    rightEye.color = koalaBlack;
    rightEye.matrix = new Matrix4(headCoords);
    rightEye.matrix.translate(0.35, 0.15, 0.85);
    rightEye.matrix.scale(0.15, 0.15, 0.1);
    rightEye.render();

    // Left Upper Arm (cylinder)
    var leftArmUpper = new Cylinder();
    leftArmUpper.color = koalaGray;
    leftArmUpper.matrix = new Matrix4(bodyCoords);
    leftArmUpper.matrix.translate(0.8, 0.75, 0.3);
    leftArmUpper.matrix.rotate(g_leftArmUpper, 1, 0, 0);
    leftArmUpper.matrix.rotate(-270, 1, 0.7, 1);
    var leftArmUpperCoords = new Matrix4(leftArmUpper.matrix);
    leftArmUpper.matrix.scale(0.25, 0.5, 0.25);
    leftArmUpper.render();

    // Left Lower Arm (cylinder) - connected to upper arm
    var leftArmLower = new Cylinder();
    leftArmLower.color = koalaDarkGray;
    leftArmLower.matrix = new Matrix4(leftArmUpperCoords);
    leftArmLower.matrix.translate(0, 1.0, 0);
    leftArmLower.matrix.rotate(g_leftArmLower, 1, 0, 0);
    var leftArmLowerCoords = new Matrix4(leftArmLower.matrix);
    leftArmLower.matrix.scale(0.25, -0.5, 0.25);
    leftArmLower.render();

    // Left Paw (sphere) - connected to lower arm
    var leftPaw = new Sphere();
    leftPaw.color = koalaBlack;
    leftPaw.matrix = new Matrix4(leftArmLowerCoords);
    leftPaw.matrix.translate(0, 0.1, 0);
    leftPaw.matrix.scale(0.35, 0.35, 0.35);
    leftPaw.render();

    // Right Upper Arm
    var rightArmUpper = new Cylinder();
    rightArmUpper.color = koalaGray;
    rightArmUpper.matrix = new Matrix4(bodyCoords);
    rightArmUpper.matrix.translate(-0.8, 0.75, 0.3);
    rightArmUpper.matrix.rotate(g_rightArmUpper, 1, 0, 0);
    rightArmUpper.matrix.rotate(-270, 90, 0.7, 1);
    var rightArmUpperCoords = new Matrix4(rightArmUpper.matrix);
    rightArmUpper.matrix.scale(0.25, 0.5, 0.25);
    rightArmUpper.render();

    // Right Lower Arm
    var rightArmLower = new Cylinder();
    rightArmLower.color = koalaDarkGray;
    rightArmLower.matrix = new Matrix4(rightArmUpperCoords);
    rightArmLower.matrix.translate(0, 1.0, 0);
    rightArmLower.matrix.rotate(g_rightArmLower, 1, 0, 0);
    var rightArmLowerCoords = new Matrix4(rightArmLower.matrix);
    rightArmLower.matrix.scale(0.25, -0.5, 0.25);
    rightArmLower.render();

    // Right Paw
    var rightPaw = new Sphere();
    rightPaw.color = koalaBlack;
    rightPaw.matrix = new Matrix4(rightArmLowerCoords);
    rightPaw.matrix.translate(0, 0.1, 0);
    rightPaw.matrix.scale(0.35, 0.3, 0.35);
    rightPaw.render();

    // Left Upper Leg
    var leftLegUpper = new Cylinder();
    leftLegUpper.color = koalaGray;
    leftLegUpper.matrix = new Matrix4(bodyCoords);
    leftLegUpper.matrix.translate(-0.5, 0.2, 0.5);
    leftLegUpper.matrix.rotate(120, 90, 0, 1);
    leftLegUpper.matrix.rotate(g_leftLegUpper, 1, 0, 0);
    leftLegUpper.matrix.rotate(-g_rightArmUpper, 1, 0, 0);
    var leftLegUpperCoords = new Matrix4(leftLegUpper.matrix);
    leftLegUpper.matrix.scale(0.3, 0.5, 0.3);
    leftLegUpper.render()

    // Left Lower Leg - connected to upper leg
    var leftLegLower = new Cylinder();
    leftLegLower.color = koalaDarkGray;
    leftLegLower.matrix = new Matrix4(leftLegUpperCoords);
    leftLegLower.matrix.translate(0, 0.8, 0);
    leftLegLower.matrix.rotate(g_leftLegLower, 0, 0.1, 0);
    var leftLegLowerCoords = new Matrix4(leftLegLower.matrix);
    leftLegLower.matrix.scale(0.25, -0.35, 0.25);
    leftLegLower.render();

    // Left Foot - connected to lower leg
    var leftFoot = new Sphere();
    leftFoot.color = koalaBlack;
    leftFoot.matrix = new Matrix4(leftLegLowerCoords);
    leftFoot.matrix.translate(0, 0.25, 0);
    leftFoot.matrix.scale(0.35, 0.3, 0.35);
    leftFoot.render();

    // Right Upper Leg
    var rightLegUpper = new Cylinder();
    rightLegUpper.color = koalaGray;
    rightLegUpper.matrix = new Matrix4(bodyCoords);
    rightLegUpper.matrix.translate(0.5, 0.2, 0.5);
    rightLegUpper.matrix.rotate(120, 90, 0, 1);
    rightLegUpper.matrix.rotate(g_rightLegUpper, 1, 0, 0);
    rightLegUpper.matrix.rotate(-g_leftArmUpper, 1, 0, 0);
    var rightLegUpperCoords = new Matrix4(rightLegUpper.matrix);
    rightLegUpper.matrix.scale(0.3, 0.5, 0.3);
    rightLegUpper.render();

    // Right Lower Leg
    var rightLegLower = new Cylinder();
    rightLegLower.color = koalaDarkGray;
    rightLegLower.matrix = new Matrix4(rightLegUpperCoords);
    rightLegLower.matrix.translate(0, 0.8, 0);;
    rightLegLower.matrix.rotate(g_rightLegLower, 0, 0.1, 0);
    var rightLegLowerCoords = new Matrix4(rightLegLower.matrix);
    rightLegLower.matrix.scale(0.25, -0.35, 0.25);
    rightLegLower.render();


    // Right Foot
    var rightFoot = new Sphere();
    rightFoot.color = koalaBlack;
    rightFoot.matrix = new Matrix4(rightLegLowerCoords);
    rightFoot.matrix.translate(0, 0.25, 0);
    rightFoot.matrix.scale(0.35, 0.3, 0.35);
    rightFoot.render();

    // tree 
    var tree = new Sphere();
    tree.color = [0.588, 0.294, 0, 1.0];
    tree.matrix = new Matrix4(body.matrix);
    tree.matrix.translate(0, -0.5, 1.5);
    tree.matrix.rotate(90, 0, 0, 1);

    tree.matrix.scale(2, 0.3, 0.5);
    tree.render();
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get" + htmlID + "from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}


function drawMyPicture() {
    //clean the canvas
    g_shapesList = [];

    let center = [0, 0];
    let radius = 0.5;


    //  1. Upper semicircle (red)
    for (let i = 0; i < 60; i++) {
        let a1 = Math.PI * i / 60;
        let a2 = Math.PI * (i + 1) / 60;

        let t = new Triangle();
        t.color = [1.0, 0.0, 0.0, 1.0]; // red
        t.points = [
            center[0], center[1],
            Math.cos(a1) * radius, Math.sin(a1) * radius,
            Math.cos(a2) * radius, Math.sin(a2) * radius
        ];
        t.render = function () {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
            drawTriangle(this.points);
        };
        g_shapesList.push(t);
    }


    // 2. Lower semicircle (white)
    for (let i = 0; i < 60; i++) {
        let a1 = Math.PI + Math.PI * i / 60;
        let a2 = Math.PI + Math.PI * (i + 1) / 60;

        let t = new Triangle();
        t.color = [1.0, 1.0, 1.0, 1.0]; // white
        t.points = [
            center[0], center[1],
            Math.cos(a1) * radius, Math.sin(a1) * radius,
            Math.cos(a2) * radius, Math.sin(a2) * radius
        ];
        t.render = function () {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
            drawTriangle(this.points);
        };
        g_shapesList.push(t);
    }

    // 3. Central black rectangle
    let w = 0.10, h = 0.15;

    let rectTris = [
        [-w, h, w, h, -w, -h],
        [w, h, w, -h, -w, -h]
    ];

    rectTris.forEach(v => {
        let t = new Triangle();
        t.color = [0, 0, 0, 1];
        t.points = v;
        t.render = function () {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
            drawTriangle(this.points);
        };
        g_shapesList.push(t);
    });


    // 4. The first letter of my first name  Capitalized

    function addZLine(x1, y1, x2, y2, thickness) {
        //  Calculate the direction perpendicular to the line segment
        let dx = x2 - x1;
        let dy = y2 - y1;
        let len = Math.sqrt(dx * dx + dy * dy);
        let nx = -dy / len * thickness;
        let ny = dx / len * thickness;

        // Create two triangles to form a rectangle
        let rect1 = new Triangle();
        rect1.color = [1, 1, 0, 1]; // yellow
        rect1.points = [
            x1 + nx, y1 + ny,
            x1 - nx, y1 - ny,
            x2 + nx, y2 + ny
        ];
        rect1.render = function () {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
            drawTriangle(this.points);
        };
        g_shapesList.push(rect1);

        let rect2 = new Triangle();
        rect2.color = [1, 1, 0, 1]; // yellow
        rect2.points = [
            x2 + nx, y2 + ny,
            x1 - nx, y1 - ny,
            x2 - nx, y2 - ny
        ];
        rect2.render = function () {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
            drawTriangle(this.points);
        };
        g_shapesList.push(rect2);
    }

    // letter Z with yellow line
    let lineThickness = 0.012;
    addZLine(-0.06, 0.06, 0.06, 0.06, lineThickness);   // top horizontal line
    addZLine(0.06, 0.06, -0.06, -0.06, lineThickness);  // slash
    addZLine(-0.06, -0.06, 0.06, -0.06, lineThickness); // bottom horizontal line
}