// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    v_UV = a_UV;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_UseTexture;

  void main() {
    if (u_UseTexture == 1) {
      vec4 tex = texture2D(u_Sampler0, v_UV);
      gl_FragColor = tex * u_FragColor;
    } else {
      gl_FragColor = u_FragColor;
    }
  }
`;

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables
let canvas;
let gl;
let a_Position = -1;
let a_UV = -1;
let u_FragColor = null;
let u_Size;
let u_ModelMatrix = null;
let u_ProjectionMatrix = null;
let u_ViewMatrix = null;
let u_GlobalRotateMatrix = null;
let u_Sampler0 = null;
let u_UseTexture = null;

let g_selectSize = 10.0;
let g_selectType = POINT;
let g_segCount = 20;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_yellowAnimation = false;

// Animation variables (kept from original)
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

let g_mouseXRotation = 0;
let g_mouseYRotation = 0;

let g_pokeAnimation = false;
let g_pokeStartTime = 0;
let g_pokeDuration = 3.0;
let g_fallOffset = 0;
let g_koalaRotation = 0;

//
// Cube + texture storage (replaces koala draw)
//
window._cube = null;        // { posBuf, uvBuf, vertexCount }
window._texture = null;
window._textureReady = false;

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

    // Get attribute/uniform locations
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // a_UV may be optimized out if not used; allow -1
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (u_FragColor === null) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (u_ModelMatrix === null) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (u_GlobalRotateMatrix === null) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (u_ViewMatrix === null) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (u_ProjectionMatrix === null) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    // u_Sampler0 may be null if the compiler optimized it out; that's okay.
    u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
    if (u_UseTexture === null) {
        console.log('Failed to get the storage location of u_UseTexture');
        return;
    }
}

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; //White
function addActionsForHtmlUI() {
    document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
    document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
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
}

//
// Texture initialization (fixed)
// - call initTextures() after shaders are initialized and connetVariablesToGLSL() succeeded
//
function initTextures(imagePath) {
    const image = new Image();
    // If you serve from another origin, set crossOrigin appropriately:
    // image.crossOrigin = '';
    image.onload = function () {
        uploadTextureToGL(image);
    };
    image.onerror = function () {
        console.error('Failed to load image:', imagePath);
    };
    image.src = imagePath || '../resources/sky.jpg';
    return true;
}

function uploadTextureToGL(image) {
    // Create texture object
    const texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Flip Y so texture coordinates match image orientation
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // Activate texture unit 0 and bind
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload the image into the texture
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } catch (e) {
        console.error('texImage2D failed:', e);
        return false;
    }

    // Set parameters that work for NPOT textures
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Bind sampler uniform if available
    if (u_Sampler0 !== null) {
        gl.uniform1i(u_Sampler0, 0); // texture unit 0
    }

    window._texture = texture;
    window._textureReady = true;
    console.log('finished LoadTexture');
    return true;
}

//
// Cube creation (replaces drawKoala usage in your flow)
//
function createCubeWithUVs() {
    // positions (36 vertices)
    const positions = new Float32Array([
        // front
        -1, -1, 1, 1, -1, 1, 1, 1, 1,
        -1, -1, 1, 1, 1, 1, -1, 1, 1,
        // back
        -1, -1, -1, -1, 1, -1, 1, 1, -1,
        -1, -1, -1, 1, 1, -1, 1, -1, -1,
        // left
        -1, -1, -1, -1, -1, 1, -1, 1, 1,
        -1, -1, -1, -1, 1, 1, -1, 1, -1,
        // right
        1, -1, -1, 1, 1, -1, 1, 1, 1,
        1, -1, -1, 1, 1, 1, 1, -1, 1,
        // top
        -1, 1, -1, -1, 1, 1, 1, 1, 1,
        -1, 1, -1, 1, 1, 1, 1, 1, -1,
        // bottom
        -1, -1, -1, 1, -1, -1, 1, -1, 1,
        -1, -1, -1, 1, -1, 1, -1, -1, 1
    ]);

    // UVs: each face maps full texture
    const uvs = new Float32Array([
        // front
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1,
        // back
        0, 0, 0, 1, 1, 1,
        0, 0, 1, 1, 1, 0,
        // left
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1,
        // right
        0, 0, 0, 1, 1, 1,
        0, 0, 1, 1, 1, 0,
        // top
        0, 0, 0, 1, 1, 1,
        0, 0, 1, 1, 1, 0,
        // bottom
        0, 0, 1, 0, 1, 1,
        0, 0, 1, 1, 0, 1
    ]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    window._cube = {
        posBuf: posBuf,
        uvBuf: uvBuf,
        vertexCount: 36
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawCube() {
    if (!window._cube) return;

    // Bind positions
    gl.bindBuffer(gl.ARRAY_BUFFER, window._cube.posBuf);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Bind UVs if attribute exists
    if (a_UV >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, window._cube.uvBuf);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
    } else {
        if (a_UV !== -1) gl.disableVertexAttribArray(a_UV);
    }

    // Model matrix for cube
    let model = new Matrix4();
    model.setIdentity();
    model.translate(0, 0.5, 0);
    model.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, model.elements);

    // Use texture if ready
    if (window._textureReady && u_Sampler0 !== null) {
        gl.uniform1i(u_UseTexture, 1);
        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, window._texture);
    } else {
        gl.uniform1i(u_UseTexture, 0);
        gl.uniform4f(u_FragColor, 0.8, 0.3, 0.3, 1.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, window._cube.vertexCount);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

//
// Main flow (keeps your original structure)
//
function main() {
    setupWebGL();
    connetVariablesToGLSL();

    // Ensure canvas size and viewport are set
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Initialize UI
    addActionsForHtmlUI();

    // Create cube buffers and start loading texture
    createCubeWithUVs();
    initTextures('../resources/sky.jpg'); // adjust path if needed

    // Default u_UseTexture value (safe)
    if (u_UseTexture !== null) {
        gl.useProgram(gl.program);
        gl.uniform1i(u_UseTexture, 0);
    }

    canvas.onmousedown = function (ev) {
        if (ev.shiftKey) {
            if (!g_pokeAnimation) {
                g_pokeAnimation = true;
                g_pokeStartTime = g_seconds;
            }
        } else {
            click(ev);
        }
    };

    canvas.onmousemove = function (ev) {
        if (ev.buttons & 1 && !ev.shiftKey) {
            var rect = ev.target.getBoundingClientRect();
            var x = ev.clientX - rect.left;
            var y = ev.clientY - rect.top;
            g_mouseYRotation = ((x / canvas.width) * -360) - 180;
            g_mouseXRotation = ((y / canvas.height) * -360) - 180;
        }
    };

    // Keep viewport updated on resize
    window.addEventListener('resize', function () {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(tick);
}

var g_shapesList = [];

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now() / 100.0 - g_startTime;
    updateAnimationAngles();
    renderAllshapes();
    requestAnimationFrame(tick);
}

function click(ev) {
    [x, y] = convertCoordinatedEvenToGL(ev);

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

    return ([x, y]);
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

function renderAllshapes() {
    var startTime = performance.now();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var globalRotMat = new Matrix4()
        .rotate(g_globalAngle, 0, 1, 0)
        .rotate(g_mouseXRotation, 1, 0, 0)
        .rotate(g_mouseYRotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Projection matrix (set before drawing)
    let proj = new Matrix4();
    proj.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

    // View matrix (camera)
    let view = new Matrix4();
    view.setLookAt(0, 2.0, 6.0, 0, 0.5, 0, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);

    // Draw the textured cube (replaces drawKoala)
    drawCube();

    var duration = performance.now() - startTime;
}

//
// Minimal placeholder drawKoala kept for compatibility (calls drawCube)
//
function drawKoala() {
    drawCube();
}

//
// Start when page loads
//
window.onload = main;
