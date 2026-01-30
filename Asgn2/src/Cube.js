class Cube {
    //update
    constructor() {
        this.type = 'cube';
        //this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 10.0;
        //this.segments = g_segCount;; 
        this.matrix = new Matrix4();
    }

    render() {
        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        /*
        // Circle 
        let r = size * 0.01;

        let angleStep = 360 / this.segments;

        for (let angle = 0; angle < 360; angle += angleStep) {

            let angle1 = angle * Math.PI / 180;
            let angle2 = (angle + angleStep) * Math.PI / 180;

            // 
            let p1 = [xy[0] + r * Math.cos(angle1), xy[1] + r * Math.sin(angle1)];
            let p2 = [xy[0] + r * Math.cos(angle2), xy[1] + r * Math.sin(angle2)];

            // draw
            drawTriangle([
                xy[0], xy[1],
                p1[0], p1[1],
                p2[0], p2[1]
            ]);
        }*/

        //front of cube
        drawTriangle([0,0,0,  1,1,0,  1,0,0]);
        drawTriangle([0,0,0, 0,1,0, 1,1,0]);

        gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);

        //top of cude
        
        drawTriangle([0,1,0, 0,1,1, 1,1,1]);
        drawTriangle([0,1,0, 1,1,1, 1,1,0]);
    }
}
