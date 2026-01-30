// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
    //update
var VSHADER_SOURCE =`
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
    void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
   gl_FragColor = u_FragColor;
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Vaiables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let g_selectSize = 10.0;
let u_Size;
let g_selectType = POINT;
let g_segCount = 20;
let g_globalAngle = 0;

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
    //var identiyM = new Matrix4();
   // gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    /*
    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }*/
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




    //Slider Events (Color Channels)
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    // size slider
    document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectSize = this.value; });

    //Segment
    document.getElementById('Segment').addEventListener('mouseup', function () { g_segCount = this.value; });

    //document.getElementById('angleSlide').addEventListener('mouseup', function () { g_globalAngle = this.value; renderAllshapes(); });
    document.getElementById('angleSlide').addEventListener('mousemove', function () { g_globalAngle = this.value; renderAllshapes(); });

}
function main() {

    setupWebGL(); // set up canvas and gl variables 
    connetVariablesToGLSL() // set up GLSL shader programs and connnect GLSL vcariables

    //set uo actions for the HTML UI elements
    addActionsForHtmlUI()
  // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) {
        if (ev.buttons & 1) {  // �����ס
            click(ev);
        }
    };


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  renderAllshapes();
}

var g_shapesList = []; // The array for storing shapes


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
    } else if (g_selectType == TRIANGLE){
        point = new Triangle();
    }else {
        point = new Circle();
    }
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

    var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  /*
  //var len = g_points.length;
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {

      g_shapesList[i].render();
    }*/
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
      //Draw a test triangle
      //drawTriangle([-1.0, 0.0, 0.0,    -0.5, -1.0, 0.0,   0.0, 0.0, 0.0]);

      //draw a cude
      
        var body = new Cube();
        body.color = [1.0, 0.0, 0.0, 1.0];
        body.matrix.translate(-.25, -.5, 0.0);
        body.matrix.scale = (0.5, 1, 0.5);
        body.render(); 


        // left arm
    var letArm = new Cube();
    letArm.color = [1.0, 1.0, 0.0, 1.0];
    letArm.matrix.setTranslate(.7, 0, 0.0);
    letArm.matrix.rotate(45, 0, 0, 1);
    letArm.matrix.scale = (0.5, 1, 0.5);
    letArm.render(); 
    var duration = performance.now() - startTime;
    
    //sendTextToHTML("numdot:" + len + "ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
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
