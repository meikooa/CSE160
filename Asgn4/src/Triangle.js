class Triangle {
    //update
    constructor() {
        this.type = 'triangle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 10.0;
    }

    render() {

        var xy = this.position;
        var rgba = this.color;
        var size = this.size;

        let s = size * .01;
        let points;
        if (!this.points) {
            points = [
                xy[0], xy[1] + s,
                xy[0] - s, xy[1] - s,
                xy[0] + s, xy[1] - s
            ];
        } else {
            points = this.points;
        };
        // Pass the position of a point to a_Position variable
        //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

        // Pass the size of a point to u_Size variable
        gl.uniform1f(u_Size, size);
        // Draw
        //gl.drawArrays(gl.POINTS, 0, 1);

        //draw
        drawTriangle(points);
    }
}
/*
function drawTriangle3DUVNormal(vertices, uv, normals) {
    var n = vertices.length / 3; // Calculate actual number of vertices from array
    
    if(!vertexBuffer){
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Create UV buffer if UV coordinates are provided
    var uvBuffer = gl.createBuffer();
    if(!uvBuffer) {
        console.log('Failed to create the UV buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

    // Write data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Create Normal buffer if normals are provided
    var normalBuffer = gl.createBuffer();
    if(!normalBuffer) {
        console.log('Failed to create the Normal buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Write data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, n);
    gl.vertexBuffer = null; // reset buffer for next draw
}


function drawTriangle3DUV(vertices, uv) {

    var n = vertices.length / 3; // Calculate actual number of vertices from array

    // Create a buffer object for vertices
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Create UV buffer if UV coordinates are provided
    if (uv && uv.length > 0) {
        var uvBuffer = gl.createBuffer();
        if (!uvBuffer) {
            console.log('Failed to create the UV buffer object');
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

        // Write data into buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
        
    }

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, n);

    g_vertexBuffer=null; // reset buffer for next draw
}

function drawTriangle3DUV(vertices, uv) {
    var n = vertices.length / 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return -1;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (uv && uv.length > 0) {
        var uvBuffer = gl.createBuffer();
        if (!uvBuffer) return -1;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
    }

    // Important: no normals provided in this function
    if (typeof a_Normal !== 'undefined' && a_Normal >= 0) {
        gl.disableVertexAttribArray(a_Normal);
        gl.vertexAttrib3f(a_Normal, 0.0, 0.0, 1.0); // optional default
    }

    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function drawTriangle(vertices) {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_Position);
    // Assign the buffer object to a_Position variable

    // Enable the assignment to a_Position variable
    //gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);

}*/

function drawTriangle3DUVNormal(vertices, uv, normals) {
    var n = vertices.length / 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return -1;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (uv && uv.length > 0 && a_UV >= 0) {
        var uvBuffer = gl.createBuffer();
        if (!uvBuffer) return -1;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
    } else if (a_UV >= 0) {
        gl.disableVertexAttribArray(a_UV);
        gl.vertexAttrib2f(a_UV, 0.0, 0.0);
    }

    if (normals && normals.length > 0 && a_Normal >= 0) {
        var normalBuffer = gl.createBuffer();
        if (!normalBuffer) return -1;
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);
    } else if (a_Normal >= 0) {
        gl.disableVertexAttribArray(a_Normal);
        gl.vertexAttrib3f(a_Normal, 0.0, 0.0, 1.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vertices, uv) {
    var n = vertices.length / 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return -1;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (uv && uv.length > 0 && a_UV >= 0) {
        var uvBuffer = gl.createBuffer();
        if (!uvBuffer) return -1;
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);
    } else if (a_UV >= 0) {
        gl.disableVertexAttribArray(a_UV);
        gl.vertexAttrib2f(a_UV, 0.0, 0.0);
    }

    if (a_Normal >= 0) {
        gl.disableVertexAttribArray(a_Normal);
        gl.vertexAttrib3f(a_Normal, 0.0, 0.0, 1.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle(vertices) {
    var n = 3;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) return -1;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    if (a_UV >= 0) {
        gl.disableVertexAttribArray(a_UV);
        gl.vertexAttrib2f(a_UV, 0.0, 0.0);
    }
    if (a_Normal >= 0) {
        gl.disableVertexAttribArray(a_Normal);
        gl.vertexAttrib3f(a_Normal, 0.0, 0.0, 1.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, n);
}


function initTriangle3D() {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);

}


function drawTriangle3D(vertices) {
    var n = vertices.length / 3; // The number of vertices

    if(g_vertexBuffer==null){
        initTriangle3D();
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, n);

    
}