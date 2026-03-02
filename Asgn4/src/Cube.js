class Cube {
    //update
    constructor() {
        this.type = 'cube';
        //this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 10.0;
        //this.segments = g_segCount;; 
        this.matrix = new Matrix4();
        this.textureNum = -2;
    }

    render() {
        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;

        gl.uniform1i(u_whichTexture, this.textureNum); // set mode for this cube
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        drawTriangle3DUVNormal(
            [0,0,0, 1,1,0, 1,0,0],
            [0,0, 1,1, 1,0],
            [0,0,-1, 0,0,-1, 0,0,-1]
        );

        drawTriangle3DUVNormal([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1], [0,0,-1, 0,0,-1, 0,0,-1]);


        //gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

        //Top of cube
        drawTriangle3DUVNormal(
            [0,1,0, 0,1,1, 1,1,1],
            [0,0, 0,1, 1,1],
            [0,1,0, 0,1,0, 0,1,0]
        );

        drawTriangle3DUVNormal([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0], [0,1,0, 0,1,0, 0,1,0]);

        //pass the color
        //gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        // right of cube 
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVNormal([1,1,0, 1,1,1, 1,0,0], [0,0, 0,1, 1,1], [1,0,0, 1,0,0, 1,0,0]);
        drawTriangle3DUVNormal([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0], [1,0,0, 1,0,0, 1,0,0]);

        //left of cube
        //gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3DUVNormal([0,1,0, 0,1,1, 0,0,0], [0,0, 0,1, 1,1], [-1,0,0, -1,0,0, -1,0,0]);
        drawTriangle3DUVNormal([0, 0, 0, 0, 1, 1, 0, 0, 1], [0, 0, 1, 1, 1, 0], [-1, 0, 0, -1, 0, 0, -1, 0, 0]);

        // back of cube (z = 1)
        //gl.uniform4f(u_FragColor, rgba[0] * 0.75, rgba[1] * 0.75, rgba[2] * 0.75, rgba[3]);
        drawTriangle3DUVNormal([1,0,1, 0,1,1, 1,1,1], [0,0, 1,1, 0,1], [0,0,1, 0,0,1, 0,0,1]);
        drawTriangle3DUVNormal([1,0,1, 0,0,1, 0,1,1], [0,0, 1,0, 1,1], [0,0,1, 0,0,1, 0,0,1]);

        // bottom of cube (y = 0)
        //gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3DUVNormal([0,0,0, 0,0,1, 1,0,1], [0,0, 0,1, 1,1], [0,-1,0, 0,-1,0, 0,-1,0]);
        drawTriangle3DUVNormal([0,0,0, 1,0,1, 1,0,0], [0,0, 1,1, 1,0], [0,-1,0, 0,-1,0, 0,-1,0]);

        

        /*
        drawTriangle3DUV(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],
            [0, 0, 1, 1, 1, 0]
        );
        // Triangle 2: bottom-left, top-left, top-right
        drawTriangle3DUV(
            [0, 0, 0, 0, 1, 0, 1, 1, 0],
            [0, 0, 0, 1, 1, 1]
        );

        // Slightly darker for other faces
        gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);

        // TOP FACE (facing +Y)
        drawTriangle3DUV(
            [0, 1, 0, 0, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUV(
            [0, 1, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0]
        );

        // BACK FACE (facing -Z)
        drawTriangle3DUV(
            [1, 0, 1, 0, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 0, 1]
        );
        drawTriangle3DUV(
            [1, 0, 1, 0, 0, 1, 0, 1, 1],
            [0, 0, 1, 0, 1, 1]
        );

        // BOTTOM FACE (facing -Y)
        drawTriangle3DUV(
            [0, 0, 0, 1, 0, 0, 1, 0, 1],
            [0, 0, 1, 0, 1, 1]
        );
        drawTriangle3DUV(
            [0, 0, 0, 1, 0, 1, 0, 0, 1],
            [0, 0, 1, 1, 0, 1]
        );

        // LEFT FACE (facing -X)
        drawTriangle3DUV(
            [0, 0, 0, 0, 1, 1, 0, 1, 0],
            [0, 0, 1, 1, 1, 0]
        );
        drawTriangle3DUV(
            [0, 0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );

        // RIGHT FACE (facing +X)
        drawTriangle3DUV(
            [1, 0, 0, 1, 1, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUV(
            [1, 0, 0, 1, 1, 1, 1, 0, 1],
            [0, 0, 1, 1, 1, 0]
        );*/
    }

    renderfast() {
        var rgba = this.color;

        // Set uniforms once
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // All 36 vertices (12 triangles * 3 vertices) in one array
        var allverts = [
            // FRONT FACE (facing +Z) - 2 triangles
            0, 0, 0,  1, 1, 0,  1, 0, 0,
            0, 0, 0,  0, 1, 0,  1, 1, 0,

            // TOP FACE (facing +Y) - 2 triangles
            0, 1, 0,  0, 1, 1,  1, 1, 1,
            0, 1, 0,  1, 1, 1,  1, 1, 0,

            // BACK FACE (facing -Z) - 2 triangles
            1, 0, 1,  0, 1, 1,  1, 1, 1,
            1, 0, 1,  0, 0, 1,  0, 1, 1,

            // BOTTOM FACE (facing -Y) - 2 triangles
            0, 0, 0,  1, 0, 0,  1, 0, 1,
            0, 0, 0,  1, 0, 1,  0, 0, 1,

            // LEFT FACE (facing -X) - 2 triangles
            0, 0, 0,  0, 1, 1,  0, 1, 0,
            0, 0, 0,  0, 0, 1,  0, 1, 1,

            // RIGHT FACE (facing +X) - 2 triangles
            1, 0, 0,  1, 1, 0,  1, 1, 1,
            1, 0, 0,  1, 1, 1,  1, 0, 1
        ];

        // UV coordinates for all vertices
        var allUVs = [
            // FRONT FACE
            0, 0,  1, 1,  1, 0,
            0, 0,  0, 1,  1, 1,

            // TOP FACE
            0, 0,  0, 1,  1, 1,
            0, 0,  1, 1,  1, 0,

            // BACK FACE
            0, 0,  1, 1,  0, 1,
            0, 0,  1, 0,  1, 1,
            // BOTTOM FACE
            0, 0,  1, 0,  1, 1,
            0, 0,  1, 1,  0, 1,

            // LEFT FACE
            0, 0,  1, 1,  1, 0,
            0, 0,  0, 1,  1, 1,

            // RIGHT FACE
            0, 0,  0, 1,  1, 1,
            0, 0,  1, 1,  1, 0
        ];
        drawTriangle3DUV(allverts, allUVs);

        // Single draw call for entire cube
        /*

        drawTriangle3DUV(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],
            [0, 0, 1, 1, 1, 0]
        );
        // Triangle 2: bottom-left, top-left, top-right
        drawTriangle3DUV(
            [0, 0, 0, 0, 1, 0, 1, 1, 0],
            [0, 0, 0, 1, 1, 1]
        );

        // Slightly darker for other faces
        gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);

        // TOP FACE (facing +Y)
        drawTriangle3DUV(
            [0, 1, 0, 0, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUV(
            [0, 1, 0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0]
        );

        // BACK FACE (facing -Z)
        drawTriangle3DUV(
            [1, 0, 1, 0, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 0, 1]
        );
        drawTriangle3DUV(
            [1, 0, 1, 0, 0, 1, 0, 1, 1],
            [0, 0, 1, 0, 1, 1]
        );

        // BOTTOM FACE (facing -Y)
        drawTriangle3DUV(
            [0, 0, 0, 1, 0, 0, 1, 0, 1],
            [0, 0, 1, 0, 1, 1]
        );
        drawTriangle3DUV(
            [0, 0, 0, 1, 0, 1, 0, 0, 1],
            [0, 0, 1, 1, 0, 1]
        );

        // LEFT FACE (facing -X)
        drawTriangle3DUV(
            [0, 0, 0, 0, 1, 1, 0, 1, 0],
            [0, 0, 1, 1, 1, 0]
        );
        drawTriangle3DUV(
            [0, 0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );

        // RIGHT FACE (facing +X)
        drawTriangle3DUV(
            [1, 0, 0, 1, 1, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        );
        drawTriangle3DUV(
            [1, 0, 0, 1, 1, 1, 1, 0, 1],
            [0, 0, 1, 1, 1, 0]
        );*/
    }
}