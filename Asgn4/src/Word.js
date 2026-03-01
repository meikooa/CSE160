// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec3 u_lightPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;


  void main() {
      if(u_whichTexture == -3){ // Use Normal
       gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
   }else if(u_whichTexture == -2){ // Use color
       gl_FragColor = u_FragColor;
   }else if(u_whichTexture == -1){ // use UV DEBUG
      gl_FragColor = vec4(v_UV,1.0,1.0);

   }else if(u_whichTexture == 0){
       gl_FragColor = texture2D(u_Sampler0, v_UV);
   }else if(u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
   }else if(u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
   }else if(u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
   }else{ // Error, put redlish
       gl_FragColor = vec4(1,0.2,0.2,1);
   }
       vec3 lightVector = vec3(v_VertPos) - u_lightPos;
       float r = length(lightVector);
       if(r <1.0){
              gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
         }else if(r < 2.0){
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
        }
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables
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
let u_Sampler2;
let u_Sampler3;
let u_whichTexture;
let u_lightPos;

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
let g_normalMode = false; // New variable to toggle normal visualization
let g_lightPos = [0.0, 1.0,-2.0]; // Default light position


// Mouse rotation variables
let g_mouseXRotation = 0;
let g_mouseYRotation = 0;

// Poke animation variables
let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_pokeDuration = 3.0; // 3 seconds for complete animation
let g_fallOffset = 0;
let g_koalaRotation = 0;

// Camera Variables
let g_cameraYaw = -90;   // Start looking down the -Z axis
let g_cameraPitch = -10; // Start looking slightly down

// Minecraft block selection
// 2 = CanBreak_wall.jpg, 3 = rock.jpg, 4 = wood.png
let g_selectedBlockType = 2; 

// Minecraft world - 3D array to store cubes
let g_map = [];
for (let x = 0; x < 32; x++) {
    g_map[x] = [];
    for (let y = 0; y < 32; y++) {
        g_map[x][y] = [];
        for (let z = 0; z < 32; z++) {
            g_map[x][y][z] = 0; // 0 = empty, 1 = wall.jpg cube, 2 = CanBreak, 3 = rock, 4 = wood
        }
    }
}

function setupWebGL() {
    canvas = document.getElementById('webgl');
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

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) return;

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) return;

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get a_Normal');
        return
    };

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) return;

    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (u_lightPos === null) {
    console.log('Failed to get u_lightPos');
    return;
    }


    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) return;

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) return;

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) return;

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) return;

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) return false;
    
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) return false;

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) return false;

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) return false;
    
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (u_whichTexture === null) console.log('Failed to get u_whichTexture');
}

function initTextures() {
    var image0 = new Image();
    if (!image0) return false;
    image0.onload = function () { SendTextureToGLSL(image0, 0); };
    image0.src = 'wall.jpg';

    var image1 = new Image();
    if (!image1) return false;
    image1.onload = function () { SendTextureToGLSL(image1, 1); };
    image1.src = 'CanBreak_wall.jpg';

    var image2 = new Image();
    if (!image2) return false;
    image2.onload = function () { SendTextureToGLSL(image2, 2); };
    image2.src = 'rock.jpg';

    var image3 = new Image();
    if (!image3) return false;
    image3.onload = function () { SendTextureToGLSL(image3, 3); };
    image3.src = 'wood.png';

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
    } else if (texUnit === 2) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_Sampler2, 2);
    } else if (texUnit === 3) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(u_Sampler3, 3);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    console.log('finished loadTexture unit', texUnit);
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; //White

function addActionsForHtmlUI() {
    document.getElementById('normalON').onclick = function () { g_normalMode = true; }; // Normal
    document.getElementById('normalOFF').onclick = function () { g_normalMode = false; }; // Normal
    document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; }; // Green
    document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; }; // Red
    document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllshapes(); };
    document.getElementById('pointButton').onclick = function () { g_selectType = POINT };
    document.getElementById('triButton').onclick = function () { g_selectType = TRIANGLE };
    document.getElementById('circleButton').onclick = function () { g_selectType = CIRCLE };
    document.getElementById("drawMyPicture").onclick = function () { drawMyPicture() };
    document.getElementById("animationYellowOnButton").onclick = function () { g_koalaAnimation = true };
    document.getElementById("animationYellowOffButton").onclick = function () { g_koalaAnimation = false };


    document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value / 100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value / 100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value / 100; });
    document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectSize = this.value; });
    document.getElementById('Segment').addEventListener('mouseup', function () { g_segCount = this.value; });
    

    document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllshapes(); });
    document.getElementById('yellowSlide').addEventListener('mousemove', function () { g_yellowAngle = this.value; renderAllshapes(); });
    document.getElementById('lightSlideX').addEventListener('mousemove', function (ev) { if(ev.buttons === 1) { g_lightPos[0]=this.value/100;renderAllshapes(); } });
    document.getElementById('lightSlideY').addEventListener('mousemove', function (ev) { if(ev.buttons === 1) { g_lightPos[1]=this.value/100;renderAllshapes(); } });
    document.getElementById('lightSlideZ').addEventListener('mousemove', function (ev) { if(ev.buttons === 1) { g_lightPos[2]=this.value/100;renderAllshapes(); } });
    
}

function main() {
    setupWebGL();
    connetVariablesToGLSL()
    addActionsForHtmlUI()
    
    canvas.onmousedown = function (ev) {
        if (document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
            return;
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

    document.addEventListener('mousemove', function(ev) {
        if (document.pointerLockElement === canvas) {
            let movementX = ev.movementX || 0;
            let movementY = ev.movementY || 0;

            let sensitivity = 0.2;
            g_cameraYaw -= movementX * sensitivity;
            g_cameraPitch -= movementY * sensitivity;

            if (g_cameraPitch > 89.0) g_cameraPitch = 89.0;
            if (g_cameraPitch < -89.0) g_cameraPitch = -89.0;

            updateLookAt();
        }
    });

    canvas.oncontextmenu = function(ev) {
        ev.preventDefault();
        return false;
    };

    document.onkeydown = keydown;

    initTextures(gl, 0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(tick);
}

var g_shapesList = [];
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var headSphere = new Sphere();
headSphere.segments = 10;

function tick() {
    g_seconds = performance.now() / 100.0 - g_startTime;
    updateAnimationAngles();
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
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return ([x, y])
}

function updateAnimationAngles() {
    if (g_pokeAnimation) {
        let elapsedTime = g_seconds - g_pokeStartTime;
        let t = elapsedTime / g_pokeDuration;

        if (t < 1.0) {
            let fallCurve = t * t;
            g_fallOffset = -2.5 * fallCurve;
            g_koalaRotation = 360 * t;

            g_leftArmUpper = 40 + 30 * Math.sin(t * Math.PI * 6);
            g_rightArmUpper = 40 + 30 * Math.sin(t * Math.PI * 6 + Math.PI);
            g_leftLegUpper = 10 + 40 * Math.sin(t * Math.PI * 5);
            g_rightLegUpper = 10 + 40 * Math.sin(t * Math.PI * 5 + Math.PI);
            g_leftArmLower = -30 * Math.sin(t * Math.PI * 8);
            g_rightArmLower = -30 * Math.sin(t * Math.PI * 8);
            g_earAngle = 10 * Math.sin(t * Math.PI * 12);
        } else {
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
        g_headAngle = 5 * Math.sin(g_seconds * 0.5);
        g_leftArmUpper = -20 + 30 * Math.sin(g_seconds);
        g_leftArmLower = -10 * Math.sin(g_seconds * 1.5);
        g_rightArmUpper = -20 + 30 * Math.sin(g_seconds + Math.PI);
        g_earAngle = 5 * Math.sin(g_seconds * 3);
        g_fallOffset = 0;
        g_koalaRotation = 0;
    } else {
        g_fallOffset = 0;
        g_koalaRotation = 0;
    }
}

// -------------------------------------------------------------
// NEW: Unity-Style Sliding Movement & Block Selection
// -------------------------------------------------------------
function keydown(ev) {
    // Check for block selection keys
    if (ev.keyCode == 49) { // Key '1'
        g_selectedBlockType = 2; // CanBreak_wall.jpg
        console.log("Selected block: CanBreak_wall");
    } else if (ev.keyCode == 50) { // Key '2'
        g_selectedBlockType = 3; // rock.jpg
        console.log("Selected block: Rock");
    } else if (ev.keyCode == 51) { // Key '3'
        g_selectedBlockType = 4; // wood.png
        console.log("Selected block: Wood");
    }

    // Calculate normalized Forward and Right vectors in XZ plane
    let forward = [g_at[0] - g_eye[0], 0, g_at[2] - g_eye[2]]; 
    let fLen = Math.sqrt(forward[0] ** 2 + forward[2] ** 2);
    if (fLen > 0) {
        forward = [forward[0] / fLen, 0, forward[2] / fLen];
    }

    let right = [
        forward[1] * g_up[2] - forward[2] * g_up[1],
        forward[2] * g_up[0] - forward[0] * g_up[2],
        forward[0] * g_up[1] - forward[1] * g_up[0]
    ];
    let rLen = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2);
    if (rLen > 0) {
        right = [right[0] / rLen, right[1] / rLen, right[2] / rLen];
    }

    let speed = 0.2;
    let dx = 0;
    let dz = 0;
    let moved = false;

    // Build the movement vector based on input
    if (ev.keyCode == 68) { dx += right[0] * speed; dz += right[2] * speed; } // D
    if (ev.keyCode == 65) { dx -= right[0] * speed; dz -= right[2] * speed; } // A
    if (ev.keyCode == 87) { dx += forward[0] * speed; dz += forward[2] * speed; } // W
    if (ev.keyCode == 83) { dx -= forward[0] * speed; dz -= forward[2] * speed; } // S

    // Unity-style Axis Separation: Move X and Z independently to slide against walls
    if (dx !== 0 || dz !== 0) {
        // Try applying X movement
        if (!checkCollision(g_eye[0] + dx, g_eye[1], g_eye[2])) {
            g_eye[0] += dx;
            moved = true;
        }
        // Try applying Z movement
        if (!checkCollision(g_eye[0], g_eye[1], g_eye[2] + dz)) {
            g_eye[2] += dz;
            moved = true;
        }
    }

    // Camera rotation using Q and E
    if (ev.keyCode == 81) { // Q - turn left
        g_cameraYaw -= 5;
        moved = true;
    } else if (ev.keyCode == 69) { // E - turn right
        g_cameraYaw += 5;
        moved = true;
    }

    // Always update g_at to stay anchored to g_eye with current Yaw/Pitch
    if (moved) updateLookAt(); 
}

// -------------------------------------------------------------
// NEW: Unity-Style Bounding Box Collision
// -------------------------------------------------------------
function checkCollision(x, y, z) {
    let buffer = 0.2; 
    
    // Check all 8 corners of the player's bounding box
    let corners = [
        [x - buffer, y - buffer, z - buffer],
        [x + buffer, y - buffer, z - buffer],
        [x - buffer, y + buffer, z - buffer],
        [x + buffer, y + buffer, z - buffer],
        [x - buffer, y - buffer, z + buffer],
        [x + buffer, y - buffer, z + buffer],
        [x - buffer, y + buffer, z + buffer],
        [x + buffer, y + buffer, z + buffer]
    ];

    for (let i = 0; i < corners.length; i++) {
        let cx = Math.floor(corners[i][0]);
        let cy = Math.floor(corners[i][1]);
        let cz = Math.floor(corners[i][2]);
        
        // If any corner is inside a solid map block, we've collided
        if (cx >= 0 && cx < 32 && cy >= 0 && cy < 32 && cz >= 0 && cz < 32) {
            if (g_map[cx][cy][cz] !== 0) {
                return true;
            }
        }
    }
    return false;
}

// -------------------------------------------------------------
// NEW: Simple Minecraft Stack Logic
// -------------------------------------------------------------
function getMapSquareInFront() {
    let forward = [g_at[0] - g_eye[0], 0, g_at[2] - g_eye[2]];
    let fLen = Math.sqrt(forward[0]**2 + forward[2]**2);
    if (fLen > 0) {
        forward = [forward[0] / fLen, 0, forward[2] / fLen];
    }
    
    // Look ~2 units ahead in the XZ plane
    let targetX = Math.floor(g_eye[0] + forward[0] * 2);
    let targetZ = Math.floor(g_eye[2] + forward[2] * 2);
    
    return {x: targetX, z: targetZ};
}

function placeCube() {
    let target = getMapSquareInFront();
    let x = target.x;
    let z = target.z;
    
    if (x >= 0 && x < 32 && z >= 0 && z < 32) {
        for (let y = 0; y < 32; y++) {
            if (g_map[x][y][z] === 0) {
                g_map[x][y][z] = g_selectedBlockType; // Use the block currently selected
                break;
            }
        }
    }
}

function deleteCube() {
    let target = getMapSquareInFront();
    let x = target.x;
    let z = target.z;
    
    if (x >= 0 && x < 32 && z >= 0 && z < 32) {
        for (let y = 31; y >= 0; y--) {
            if (g_map[x][y][z] !== 0) {
                g_map[x][y][z] = 0; // Delete top block in stack
                break;
            }
        }
    }
}

var g_eye = [0, 0.5, 3];
var g_at = [0, 0, 0];
var g_up = [0, 1, 0];

function updateLookAt() {
    let radYaw = g_cameraYaw * Math.PI / 180.0;
    let radPitch = g_cameraPitch * Math.PI / 180.0;
    let r = 10; 
    
    g_at[0] = g_eye[0] + r * Math.cos(radPitch) * Math.cos(radYaw);
    g_at[1] = g_eye[1] + r * Math.sin(radPitch);
    g_at[2] = g_eye[2] + r * Math.cos(radPitch) * Math.sin(radYaw);
}

function drawMap(){
    for(let x=0;x<32;x++){
        for(let y=0;y<32;y++){
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

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMatrix = new Matrix4();
    projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
        g_eye[0], g_eye[1], g_eye[2],   
        g_at[0], g_at[1], g_at[2],     
        g_up[0], g_up[1], g_up[2]      
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    var globalRotMat = new Matrix4()
        .rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    var light = new Cube();
    light.color = [2.0, 2.0, 0.0, 1.0];
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(0.1, 0.1, 0.1);
    light.matrix.translate(-0.5, -0.5, -0.5);
    light.render();

    var body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    if(g_normalMode) {
        body.textureNum = -3;// Normal visualization
    } else {
        body.textureNum = 0; // wall.jpg
    }
    body.matrix.translate(0, 0, 0.0);
    body.matrix.scale(0.5, 0.3, 0.5);
    //body.textureNum = 0;
    body.render();

    var floor = new Cube();
    floor.color = [0.0, 1.0, 0.0, 1.0];
    if(g_normalMode){
        floor.textureNum = -3; // Normal visualization
    } else{
        floor.textureNum = -2;
    }
    floor.matrix.translate(0, -1.1, 0.0);
    floor.matrix.scale(15, 0, 15);
    floor.matrix.translate(-0.5, 0, -0.5);
    //floor.textureNum = -2;
    floor.render();
    
    var sky = new Cube();
    sky.color = [0.0, 0.0, 1.0, 0.9];
    if(g_normalMode){
        sky.textureNum = -3; // Normal visualization
    } else{
         sky.textureNum = -2;

    }
    sky.matrix.translate(0, -1.5, 0);
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-0.5, 0, -0.5);
    //sky.textureNum = -2;
    sky.render();

    
   var testball = new Sphere();
    testball.color = [1.0, 1.0, 0.0, 1.0];
    if(g_normalMode){
        testball.textureNum = -3; // Normal visualization   
    } else{
        testball.textureNum = -2; // Color
    }
    testball.matrix.translate(0, 0.5, 0);
    testball.matrix.scale(0.5, 0.5, 0.5);
    //testball.textureNum = -2;
    testball.render();

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
                    } else if (g_map[x][y][z] === 3) {
                        cube.textureNum = 2; // rock.jpg
                    } else if (g_map[x][y][z] === 4) {
                        cube.textureNum = 3; // wood.png
                    }
                    
                    cube.render();
                }
            }
        }
    }

    drawMap();

    var duration = performance.now() - startTime;
    sendTextToHTML(" fps: " + Math.floor(10000 / duration), "numdot");
}
/*
function drawKoala() {
    var koalaGray = [0.6, 0.6, 0.65, 1.0];
    var koalaDarkGray = [0.4, 0.4, 0.45, 1.0];
    var koalaWhite = [0.95, 0.95, 0.95, 1.0];
    var koalaBlack = [0.1, 0.1, 0.1, 1.0];
    var koalaNose = [0.2, 0.2, 0.2, 1.0];

    var body = new Cylinder();
    body.color = koalaGray;
    body.matrix.translate(0, -0.3 + g_fallOffset, 0);
    body.matrix.rotate(g_koalaRotation, 0, 0, 1); 
    body.matrix.rotate(180, 0, -90, 0);
    body.matrix.scale(0.35, 0.5, 0.35);
    var bodyCoords = new Matrix4(body.matrix);
    body.render();

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

    var rightEar = new Sphere();
    rightEar.color = koalaDarkGray;
    rightEar.matrix = new Matrix4(headCoords);
    rightEar.matrix.translate(0.8, 0.6, 0);
    rightEar.matrix.rotate(-g_earAngle, 0, 0, 1);
    rightEar.matrix.scale(0.55, 0.55, 0.3);
    rightEar.render();

    var snout = new Sphere();
    snout.color = koalaWhite;
    snout.matrix = new Matrix4(headCoords);
    snout.matrix.translate(0, -0.2, 0.85);
    snout.matrix.scale(0.5, 0.4, 0.4);
    snout.render();

    var nose = new Sphere();
    nose.color = koalaNose;
    nose.matrix = new Matrix4(headCoords);
    nose.matrix.translate(0, -0.1, 1.1);
    nose.matrix.scale(0.25, 0.3, 0.2);
    nose.render();

    var leftEye = new Sphere();
    leftEye.color = koalaBlack;
    leftEye.matrix = new Matrix4(headCoords);
    leftEye.matrix.translate(-0.35, 0.15, 0.85);
    leftEye.matrix.scale(0.15, 0.15, 0.1);
    leftEye.render();

    var rightEye = new Sphere();
    rightEye.color = koalaBlack;
    rightEye.matrix = new Matrix4(headCoords);
    rightEye.matrix.translate(0.35, 0.15, 0.85);
    rightEye.matrix.scale(0.15, 0.15, 0.1);
    rightEye.render();

    var leftArmUpper = new Cylinder();
    leftArmUpper.color = koalaGray;
    leftArmUpper.matrix = new Matrix4(bodyCoords);
    leftArmUpper.matrix.translate(0.8, 0.75, 0.3);
    leftArmUpper.matrix.rotate(g_leftArmUpper, 1, 0, 0);
    leftArmUpper.matrix.rotate(-270, 1, 0.7, 1);
    var leftArmUpperCoords = new Matrix4(leftArmUpper.matrix);
    leftArmUpper.matrix.scale(0.25, 0.5, 0.25);
    leftArmUpper.render();

    var leftArmLower = new Cylinder();
    leftArmLower.color = koalaDarkGray;
    leftArmLower.matrix = new Matrix4(leftArmUpperCoords);
    leftArmLower.matrix.translate(0, 1.0, 0);
    leftArmLower.matrix.rotate(g_leftArmLower, 1, 0, 0);
    var leftArmLowerCoords = new Matrix4(leftArmLower.matrix);
    leftArmLower.matrix.scale(0.25, -0.5, 0.25);
    leftArmLower.render();

    var leftPaw = new Sphere();
    leftPaw.color = koalaBlack;
    leftPaw.matrix = new Matrix4(leftArmLowerCoords);
    leftPaw.matrix.translate(0, 0.1, 0);
    leftPaw.matrix.scale(0.35, 0.35, 0.35);
    leftPaw.render();

    var rightArmUpper = new Cylinder();
    rightArmUpper.color = koalaGray;
    rightArmUpper.matrix = new Matrix4(bodyCoords);
    rightArmUpper.matrix.translate(-0.8, 0.75, 0.3);
    rightArmUpper.matrix.rotate(g_rightArmUpper, 1, 0, 0);
    rightArmUpper.matrix.rotate(-270, 90, 0.7, 1);
    var rightArmUpperCoords = new Matrix4(rightArmUpper.matrix);
    rightArmUpper.matrix.scale(0.25, 0.5, 0.25);
    rightArmUpper.render();

    var rightArmLower = new Cylinder();
    rightArmLower.color = koalaDarkGray;
    rightArmLower.matrix = new Matrix4(rightArmUpperCoords);
    rightArmLower.matrix.translate(0, 1.0, 0);
    rightArmLower.matrix.rotate(g_rightArmLower, 1, 0, 0);
    var rightArmLowerCoords = new Matrix4(rightArmLower.matrix);
    rightArmLower.matrix.scale(0.25, -0.5, 0.25);
    rightArmLower.render();

    var rightPaw = new Sphere();
    rightPaw.color = koalaBlack;
    rightPaw.matrix = new Matrix4(rightArmLowerCoords);
    rightPaw.matrix.translate(0, 0.1, 0);
    rightPaw.matrix.scale(0.35, 0.3, 0.35);
    rightPaw.render();

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

    var leftLegLower = new Cylinder();
    leftLegLower.color = koalaDarkGray;
    leftLegLower.matrix = new Matrix4(leftLegUpperCoords);
    leftLegLower.matrix.translate(0, 0.8, 0);
    leftLegLower.matrix.rotate(g_leftLegLower, 0, 0.1, 0);
    var leftLegLowerCoords = new Matrix4(leftLegLower.matrix);
    leftLegLower.matrix.scale(0.25, -0.35, 0.25);
    leftLegLower.render();

    var leftFoot = new Sphere();
    leftFoot.color = koalaBlack;
    leftFoot.matrix = new Matrix4(leftLegLowerCoords);
    leftFoot.matrix.translate(0, 0.25, 0);
    leftFoot.matrix.scale(0.35, 0.3, 0.35);
    leftFoot.render();

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

    var rightLegLower = new Cylinder();
    rightLegLower.color = koalaDarkGray;
    rightLegLower.matrix = new Matrix4(rightLegUpperCoords);
    rightLegLower.matrix.translate(0, 0.8, 0);;
    rightLegLower.matrix.rotate(g_rightLegLower, 0, 0.1, 0);
    var rightLegLowerCoords = new Matrix4(rightLegLower.matrix);
    rightLegLower.matrix.scale(0.25, -0.35, 0.25);
    rightLegLower.render();

    var rightFoot = new Sphere();
    rightFoot.color = koalaBlack;
    rightFoot.matrix = new Matrix4(rightLegLowerCoords);
    rightFoot.matrix.translate(0, 0.25, 0);
    rightFoot.matrix.scale(0.35, 0.3, 0.35);
    rightFoot.render();

    var tree = new Sphere();
    tree.color = [0.588, 0.294, 0, 1.0];
    tree.matrix = new Matrix4(body.matrix);
    tree.matrix.translate(0, -0.5, 1.5);
    tree.matrix.rotate(90, 0, 0, 1);
    tree.matrix.scale(2, 0.3, 0.5);
    tree.render();
}*/

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) return;
    htmlElm.innerHTML = text;
}

function drawMyPicture() {
    g_shapesList = [];

    let center = [0, 0];
    let radius = 0.5;

    for (let i = 0; i < 60; i++) {
        let a1 = Math.PI * i / 60;
        let a2 = Math.PI * (i + 1) / 60;

        let t = new Triangle();
        t.color = [1.0, 0.0, 0.0, 1.0]; 
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

    for (let i = 0; i < 60; i++) {
        let a1 = Math.PI + Math.PI * i / 60;
        let a2 = Math.PI + Math.PI * (i + 1) / 60;

        let t = new Triangle();
        t.color = [1.0, 1.0, 1.0, 1.0]; 
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

    function addZLine(x1, y1, x2, y2, thickness) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let len = Math.sqrt(dx * dx + dy * dy);
        let nx = -dy / len * thickness;
        let ny = dx / len * thickness;

        let rect1 = new Triangle();
        rect1.color = [1, 1, 0, 1]; 
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
        rect2.color = [1, 1, 0, 1]; 
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

    let lineThickness = 0.012;
    addZLine(-0.06, 0.06, 0.06, 0.06, lineThickness);   
    addZLine(0.06, 0.06, -0.06, -0.06, lineThickness);  
    addZLine(-0.06, -0.06, 0.06, -0.06, lineThickness); 
}