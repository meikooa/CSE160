// Word.js ¡ª textured cube example (sky.jpg mapped to cube faces)
// Requires: cuon-matrix.js (Matrix4) and webgl-utils helpers (getWebGLContext, initShaders).
// Place sky.jpg at ../resources/sky.jpg relative to the HTML file, or change imagePath in main().

//
// Shaders
//
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

var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler;
  uniform int u_UseTexture;

  void main() {
    if (u_UseTexture == 1) {
      vec4 tex = texture2D(u_Sampler, v_UV);
      gl_FragColor = tex * u_FragColor;
    } else {
      gl_FragColor = u_FragColor;
    }
  }
`;

//
// Globals
//
let canvas, gl;
let a_Position = -1, a_UV = -1;
let u_FragColor = null, u_ModelMatrix = null, u_GlobalRotateMatrix = null, u_ViewMatrix = null, u_ProjectionMatrix = null;
let u_Sampler = null, u_UseTexture = null;

let g_globalAngle = 0;
let g_mouseXRotation = 0;
let g_mouseYRotation = 0;
let g_lastTime = Date.now();

window._textureReady = false;
window._texture = null;
window._cube = null; // buffers and counts

//
// Setup
//
function setupWebGL() {
    canvas = document.getElementById('webgl');
    if (!canvas) { console.error('Canvas element with id "webgl" not found.'); return false; }
    gl = getWebGLContext(canvas);
    if (!gl) { console.error('Failed to get WebGL context.'); return false; }
    gl.enable(gl.DEPTH_TEST);
    return true;
}

function connetVariablesToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.error('Failed to initialize shaders.'); return false;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');

    if (a_Position < 0) { console.error('Failed to get a_Position'); return false; }
    if (u_FragColor === null || u_ModelMatrix === null || u_GlobalRotateMatrix === null ||
        u_ViewMatrix === null || u_ProjectionMatrix === null || u_UseTexture === null) {
        console.error('Failed to get one or more uniform locations'); return false;
    }
    // a_UV and u_Sampler may be null/optimized out if not used; that's acceptable.
    return true;
}

//
// Create cube buffers with UVs (36 vertices, each vertex has position and UV)
// UVs are assigned per-face so each face maps the full texture
//
function createCubeWithUVs() {
    // 36 vertices (12 triangles) * 3 components
    const positions = new Float32Array([
        // front face (z =  1)
        -1, -1, 1, 1, -1, 1, 1, 1, 1,
        -1, -1, 1, 1, 1, 1, -1, 1, 1,
        // back face (z = -1)
        -1, -1, -1, -1, 1, -1, 1, 1, -1,
        -1, -1, -1, 1, 1, -1, 1, -1, -1,
        // left face (x = -1)
        -1, -1, -1, -1, -1, 1, -1, 1, 1,
        -1, -1, -1, -1, 1, 1, -1, 1, -1,
        // right face (x = 1)
        1, -1, -1, 1, 1, -1, 1, 1, 1,
        1, -1, -1, 1, 1, 1, 1, -1, 1,
        // top face (y = 1)
        -1, 1, -1, -1, 1, 1, 1, 1, 1,
        -1, 1, -1, 1, 1, 1, 1, 1, -1,
        // bottom face (y = -1)
        -1, -1, -1, 1, -1, -1, 1, -1, 1,
        -1, -1, -1, 1, -1, 1, -1, -1, 1
    ]);

    // UVs: each face uses full [0,0]..[1,1] mapping (4 vertices per face, but triangles repeat)
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

    // Create and store buffers
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

//
// Texture init and upload (call after shader program exists)
//
function initTextures(imagePath) {
    const texture = gl.createTexture();
    if (!texture) { console.log('Failed to create texture'); return false; }

    const samplerLoc = gl.getUniformLocation(gl.program, 'u_Sampler'); // may be null if optimized out
    const image = new Image();
    if (!image) { console.log('Failed to create image'); return false; }

    image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (samplerLoc !== null) gl.uniform1i(samplerLoc, 0);
        window._textureReady = true;
    };

    image.src = imagePath || '../resources/sky.jpg';
    window._texture = texture;
    return true;
}

//
// Draw cube (uses texture when ready)
//
function drawCube() {
    if (!window._cube) return;

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, window._cube.posBuf);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Bind UV buffer if attribute exists
    if (a_UV >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, window._cube.uvBuf);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
    } else {
        if (a_UV !== -1) gl.disableVertexAttribArray(a_UV);
    }

    // Model matrix: rotate slowly and position
    let model = new Matrix4();
    model.setIdentity();
    model.translate(0, 0.5, 0);
    model.rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, model.elements);

    // If texture ready, use it; otherwise draw solid color
    if (window._textureReady && u_Sampler !== null) {
        gl.uniform1i(u_UseTexture, 1);
        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0); // white tint
        // ensure texture unit 0 is active and bound
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, window._texture);
    } else {
        gl.uniform1i(u_UseTexture, 0);
        gl.uniform4f(u_FragColor, 0.8, 0.3, 0.3, 1.0); // fallback color
    }

    gl.drawArrays(gl.TRIANGLES, 0, window._cube.vertexCount);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

//
// Render loop and setup
//
function main() {
    if (!setupWebGL()) return;
    if (!connetVariablesToGLSL()) return;

    createCubeWithUVs();
    initTextures('../resources/sky.jpg'); // change path if needed

    canvas.onmousemove = function (ev) {
        if (ev.buttons & 1) {
            var rect = ev.target.getBoundingClientRect();
            var x = ev.clientX - rect.left;
            var y = ev.clientY - rect.top;
            g_mouseYRotation = ((x / canvas.width) * -360) - 180;
            g_mouseXRotation = ((y / canvas.height) * -360) - 180;
        }
    };

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(tick);
}

function tick() {
    let now = Date.now();
    let elapsed = now - g_lastTime;
    g_lastTime = now;
    g_globalAngle = (g_globalAngle + (20 * elapsed / 1000.0)) % 360;

    renderAllshapes();
    requestAnimationFrame(tick);
}

function renderAllshapes() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Projection
    let proj = new Matrix4();
    proj.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, proj.elements);

    // View
    let view = new Matrix4();
    view.setLookAt(0, 2.0, 6.0, 0, 0.5, 0, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);

    // Global rotation (user + auto)
    let globalRot = new Matrix4();
    globalRot.rotate(g_mouseXRotation, 1, 0, 0);
    globalRot.rotate(g_mouseYRotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRot.elements);

    // Draw cube (textured when ready)
    drawCube();
}

window.onload = main;
