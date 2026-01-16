// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform float u_Size;
    void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
   gl_FragColor = u_FragColor;
  }`

// Global Vaiables
let caanvas;
let gl;
let a_Position;
let u_FragColor;
let g_selectSize = 10.0;
let u_Size;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

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

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}


let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; //White
function addActionsForHtmlUI() {

    //Button Events(Shape Type)
    document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; }; // Green
    document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; }; // Red

    //Slider Events (Color Channels)
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    // size slider
    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectSize = this.value;} );
}
function main() {

    setupWebGL(); // set up canvas and gl variables 
    connetVariablesToGLSL() // set up GLSL shader programs and connnect GLSL vcariables

    //set uo actions for the HTML UI elements
    addActionsForHtmlUI()
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

class Point {
  constructor(){
    this.type = 'point';
    this.a_Position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 10.0;
  }
}
var g_shapesList = []; // The array for storing shapes

/*
var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_size = [];    // The array to store the size of a point
*/

function click(ev) {
    [x, y] = convertCoordinatedEvenToGL(ev)

    let point = new Point();
    point.position = [x,y];
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

    return([x,y])
}

function renderAllshapes() {
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {

    var xy = g_shapesList[i].position;
    var rgba = g_shapesList[i].color;
    var size = g_shapesList[i].size;
    /*
    var xy = g_points[i];
    var rgba = g_colors[i];
    var size = g_size[i];
    */

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the size of a point to u_Size variable
    gl.uniform1f(u_Size, size);
    // Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}
