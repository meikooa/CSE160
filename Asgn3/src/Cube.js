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

        var allverts =[];

        allverts = allverts.concat(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 1, 0],

            [0, 1, 0, 0, 1, 1, 1, 1, 1],
            [0, 1, 0, 1, 1, 1, 1, 1, 0],

            [1, 0, 1, 0, 1, 1, 1, 1, 1],
            [1, 0, 1, 0, 0, 1, 0, 1, 1],

            [0, 0, 0, 1, 0, 0, 1, 0, 1],
            [0, 0, 0, 1, 0, 1, 0, 0, 1],

            [0, 0, 0, 0, 1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 1],

            [1, 0, 0, 1, 1, 0, 1, 1, 1],
            [1, 0, 0, 1, 1, 1, 1, 0, 1]
        );

        drawTriangle3DUV(allverts);

        /*


        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;

        gl.uniform1i(u_whichTexture, this.textureNum); // set mode for this cube
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

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
        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;

        gl.uniform1i(u_whichTexture, this.textureNum); // set mode for this cube
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts =[];

        allverts = allverts.concat(
            [0, 0, 0, 1, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 1, 0],

            [0, 1, 0, 0, 1, 1, 1, 1, 1],
            [0, 1, 0, 1, 1, 1, 1, 1, 0],

            [1, 0, 1, 0, 1, 1, 1, 1, 1],
            [1, 0, 1, 0, 0, 1, 0, 1, 1],

            [0, 0, 0, 1, 0, 0, 1, 0, 1],
            [0, 0, 0, 1, 0, 1, 0, 0, 1],

            [0, 0, 0, 0, 1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 1, 1],

            [1, 0, 0, 1, 1, 0, 1, 1, 1],
            [1, 0, 0, 1, 1, 1, 1, 0, 1]
        );

        drawTriangle3DUV(allverts);

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
