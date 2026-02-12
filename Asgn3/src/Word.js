// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
//update
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
    gl_Position = u_ProjectionMatrix * u_ViewMatrix *  u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    //gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;

  void main() {
   if(u_whichTexture == -2){ // Use color
       gl_FragColor = u_FragColor;
   }else if(u_whichTexture == -1){ // use UV DEBUG
      gl_FragColor = vec4(v_UV,1.0,1.0);

   }else if(u_whichTexture == 0){
       gl_FragColor = texture2D(u_Sampler0, v_UV);
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

// Mouse rotation variables
let g_mouseXRotation = 0;
let g_mouseYRotation = 0;

// Poke animation variables
let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_pokeDuration = 3.0; // 3 seconds for complete animation
let g_fallOffset = 0;
let g_koalaRotation = 0;

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
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (u_whichTexture === null) console.log('Failed to get u_whichTexture');

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
}


function initTextures() {
    var image = new Image();  // Create the image object
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function () { SendTextureToGLSL(image); };
    // Tell the browser to load an image
    image.src = '../resources/sky.jpg';

    return true;
}

function SendTextureToGLSL(image) {
    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    gl.activeTexture(gl.TEXTURE0);                 // activate unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);       // bind texture object

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // tell the shader sampler to use texture unit 0
    gl.uniform1i(u_Sampler0, 0);

    console.log('finished loadTexture');
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
    canvas.onmousedown = function (ev) {
        // Check if Shift key is held
        if (ev.shiftKey) {
            // Trigger poke animation
            if (!g_pokeAnimation) {
                g_pokeAnimation = true;
                g_pokeStartTime = g_seconds;
            }
        } else {
            // For clicks not dragging, use the original click function
            click(ev);
        }
    };

    canvas.onmousemove = function (ev) {
        if (ev.buttons & 1 && !ev.shiftKey) {  // Left mouse button is held (not Shift+Click)
            // Map mouse position to rotation
            var rect = ev.target.getBoundingClientRect();
            var x = ev.clientX - rect.left;
            var y = ev.clientY - rect.top;

            // Map x position (0 to canvas.width) to x-rotation (-180 to 180)
            g_mouseYRotation = ((x / canvas.width) * -360) - 180;

            // Map y position (0 to canvas.height) to y-rotation (-180 to 180)
            g_mouseXRotation = ((y / canvas.height) * -360) - 180;

            // No need to call click(ev) here anymore
        }
    };

    document.onkeydown = onkeydown;

    initTextures(gl, 0);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);

    //renderAllshapes();
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

/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_size = [];    // The array to store the size of a point
*/

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

    /*
    // Store the coordinates to g_points array
    g_points.push([x, y]);

    //Store the color to g_colors array
    g_colors.push(g_selectedColor.slice());

    //Store the size to g_size array
    g_size.push(g_selectSize);
    */
    /*
    // Store the coordinates to g_points array
    //if (x >= 0.0 && y >= 0.0) {      // First quadrant
    //    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
    //} else if (x < 0.0 && y < 0.0) { // Third quadrant
    //    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
    //} else {                         // Others
    //    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
    //}
    */
    // Draw every shape  that is supposed to be in the canvas
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
    /*
    if (g_yellowAnimation) {
        g_yellowAngle = (45 * Math.sin(g_seconds));
    }*/

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

var g_eye = [0, 0.5, 3];
var g_at = [0, 0, -100];
var g_up = [0, 1, 0];
/*

callcualting

// this one is eye and the oject in the same line, we close the object
eye -->(d) at; d = at - eye; 

d = d.narmalized ;
eye = yey + d; 

// this one is eye is focus the object(at), but go the other way, like left
'A' = left{
 d = at - eye;
 left = d * up ;
}

//  keep they eye point, but look other way, like s degree
atp = drr = at eye;
r = √ ((dx)^2 + (dy)^2)
theta = artan(yx);

theta = theta - s dregee
newx = r * cos(theta)
newy = r * sin(theta)
d = (newx, newy)
*/
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

    // Set up global rotation matrix (for mouse/angle controls)
    var globalRotMat = new Matrix4()
        .rotate(g_globalAngle, 0, 1, 0)
        .rotate(g_mouseXRotation, 1, 0, 0)
        .rotate(g_mouseYRotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Set up global rotation matrix (for mouse/angle controls)
    var globalRotMat = new Matrix4()
        .rotate(g_globalAngle, 0, 1, 0)
        .rotate(g_mouseXRotation, 1, 0, 0)
        .rotate(g_mouseYRotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    //Draw a test triangle
    //drawTriangle([-1.0, 0.0, 0.0,    -0.5, -1.0, 0.0,   0.0, 0.0, 0.0]);

    //draw a cube

    var body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    body.matrix.translate(0, 0, 0.0);
    body.matrix.scale(0.5, 0.3, 0.5);
    body.textureNum = 0;
    body.render();


    //drawKoala();



    var duration = performance.now() - startTime;
    //sendTextToHTML("numdot:" + len + "ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
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