class TestCube3DUV {
    constructor() {
        this.type = 'testcube3duv';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;

        // Set the model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // FRONT FACE - with UV mapping
        // The UV coordinates will create a gradient effect based on the fragment shader
        // v_UV is used to color the fragments (see fragment shader line 23)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3DUVCorrected(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],  // vertices (bottom-left, top-right, bottom-right)
            [0, 0, 1, 1, 1, 0]       // UV coords
        );
        drawTriangle3DUVCorrected(
            [0, 0, 0, 0, 1, 0, 1, 1, 0],  // vertices (bottom-left, top-left, top-right)
            [0, 0, 0, 1, 1, 1]       // UV coords
        );

        // Darken color slightly for other faces
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        // TOP FACE
        drawTriangle3DUVCorrected(
            [0, 1, 0, 0, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUVCorrected(
            [0, 1, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0]
        );

        // BACK FACE
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVCorrected(
            [0, 0, 1, 1, 0, 1, 1, 1, 1],
            [0, 0, 1, 0, 1, 1]
        );
        drawTriangle3DUVCorrected(
            [0, 0, 1, 1, 1, 1, 0, 1, 1],
            [0, 0, 1, 1, 0, 1]
        );

        // BOTTOM FACE
        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3DUVCorrected(
            [0, 0, 0, 1, 0, 0, 1, 0, 1],
            [0, 0, 1, 0, 1, 1]
        );
        drawTriangle3DUVCorrected(
            [0, 0, 0, 1, 0, 1, 0, 0, 1],
            [0, 0, 1, 1, 0, 1]
        );

        // LEFT FACE
        gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3DUVCorrected(
            [0, 0, 0, 0, 1, 0, 0, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUVCorrected(
            [0, 0, 0, 0, 1, 1, 0, 0, 1],
            [0, 0, 1, 1, 1, 0]
        );

        // RIGHT FACE
        gl.uniform4f(u_FragColor, rgba[0] * 0.5, rgba[1] * 0.5, rgba[2] * 0.5, rgba[3]);
        drawTriangle3DUVCorrected(
            [1, 0, 0, 1, 1, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUVCorrected(
            [1, 0, 0, 1, 1, 1, 1, 0, 1],
            [0, 0, 1, 1, 1, 0]
        );
    }
}

// Corrected drawTriangle3DUV function with proper buffer creation
function drawTriangle3DUVCorrected(vertices, uv) {
    var n = 3; // The number of vertices

    // Create and bind vertex buffer
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Create and bind UV buffer (THIS WAS MISSING IN ORIGINAL CODE)
    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
        console.log('Failed to create the UV buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
}