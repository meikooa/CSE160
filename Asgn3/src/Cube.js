class Cube {
    //update
    constructor() {
        this.type = 'cube';
        //this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 10.0;
        //this.segments = g_segCount;; 
        this.matrix = new Matrix4();
        //this.textureNum = 0;
    }

    render() {
        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;

       // gl.uniform1i(u_WhichTexture, this.textureNum);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        //front of cube
        drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

        //drawTriangle([0,0,0,  1,1,0,  1,0,0]);
        //drawTriangle([0,0,0, 0,1,0, 1,1,0]);

        gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);

        //top of cude
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

        // Back face
        drawTriangle3DUV([0, 0, 1, 1, 0, 1, 1, 1, 1], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 1]);

        // Bottom face
        drawTriangle3DUV([0, 0, 0, 1, 0, 0, 1, 0, 1], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 0, 0, 1], [0, 0, 0, 1, 1, 1]);

        // Left face
        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 0, 1, 1], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 0, 1], [0, 0, 0, 1, 1, 1]);

        // Right face
        drawTriangle3DUV([1, 0, 0, 1, 1, 0, 1, 1, 1], [1, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 0, 1], [0, 0, 0, 1, 1, 1]);

    }
}
