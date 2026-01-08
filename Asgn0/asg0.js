// DrawTriangle.js (c) 2012 matsuda
var canvas;
var ctx;

function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('cnv1');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0,canvas.width, canvas.height);        // Fill a rectangle with the color
}

function drawVector(v,color){ // input is a vec and a color string
    ctx.strokeStyle = color; // Set line color
    ctx.lineWidth = 2; // Set line width

    // use var because let cx, cy are already used in main()
    var cx = canvas.width/2;
    var cy = canvas.height/2;

    // scale factor for drawing
    // v.elements[0] is x component and v.elements[1] is y component
    var vx = v.elements[0]*20;
    var vy = v.elements[1]*20;

    ctx.beginPath();
    ctx.moveTo(cx, cy); // move to center of canvas
    // debug: if use draw to (cx + vx, cy + vy), the y axis is inverted
    ctx.lineTo(cx + vx, cy - vy); // draw to (cx + vx, cy - vy)
    ctx.stroke();
}



function handleDrawEvent(){

  // In exampe 4， we can see when value change ， the canvas is will redrawed
  // so we need to clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0,canvas.width, canvas.height);

  // get value from input V1
  var x1 = document.getElementById("v1x").value;
  var y1 = document.getElementById("v1y").value;

  // create vector V1
  // use Vector3 class from cuon-matrix.js required in assignment file
  var v1 = new Vector3([parseFloat(x1), parseFloat(y1), 0]);
  // draw vector V1 in red
  drawVector(v1,'red');

  // get value from input V2
  var x2 = document.getElementById("v2x").value;
  var y2 = document.getElementById("v2y").value;

  // create vector V2
  var v2 = new Vector3([parseFloat(x2), parseFloat(y2), 0]);
  // draw vector V2 in blue
  drawVector(v2,'blue');

  // get operation type
  var opType = document.getElementById("Operation-select").value;
  var scalar = document.getElementById("Scalar").value;

  // perform operation and draw result vector in green
  if(opType === "add"){
    // v3 = v1 + v2
      var v3 = new Vector3(v1.elements); // create v3 as copy of v2]);
      v3.add(v2);
      drawVector(v3,'green');
  }

  else if(opType === "sub"){
    // v3 = v1 - v2
      var v3 = new Vector3(v1.elements); // create v3 as copy of v2]);
      v3.sub(v2);
      drawVector(v3,'green');
  }

  else if(opType === "mul"){
    // v3 = v1 * scalar
      var v3 = new Vector3(v1.elements); // create v3 as copy of v1]);
      var v4 = new Vector3(v2.elements); // create v4 as copy of v2]);
      v3.mul(parseFloat(scalar));
      v4.mul(parseFloat(scalar));
      drawVector(v3,'green');
      drawVector(v4,'green');
  }

  else if(opType === "div"){
    // v3 = v1 / scalar
      var v3 = new Vector3(v1.elements); // create v3 as copy of v1]);
      var v4 = new Vector3(v2.elements); // create v4 as copy of v2]);
      v3.div(parseFloat(scalar));
      v4.div(parseFloat(scalar));
      drawVector(v3,'green');
      drawVector(v4,'green');
  }

  else if(opType === "mag"){
    // magnitude of v1
      var mag = v1.magnitude();
      console.log("Magnitude of V1: " + mag);
  }
  else if(opType === "norm"){
    // normalize v1
      var v3 = new Vector3(v1.elements); // create v3 as copy of v1]);
      var v4 = new Vector3(v2.elements); // create v4 as copy of v2]);
      v3.normalize();
      v4.normalize();
      drawVector(v3,'green');
      drawVector(v4,'green');
  }
  else if(opType === "angle"){
    // angle between v1 and v2
      var dot = Vector3.dot(v1, v2);
      var mag1 = v1.magnitude();
      var mag2 = v2.magnitude();
      var angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
      console.log("Angle between V1 and V2: " + angle.toFixed(2) + " degrees");
  }
  else if(opType === "area"){
    // area of parallelogram formed by v1 and v2
      var dot = Vector3.dot(v1, v2);
      var mag1 = v1.magnitude();
      var mag2 = v2.magnitude();
      var sinTheta = Math.sqrt(1 - Math.pow(dot / (mag1 * mag2), 2));
      var area = mag1 * mag2 * sinTheta;
      console.log("Area of parallelogram formed by V1 and V2: " + area.toFixed(2));
  }

}