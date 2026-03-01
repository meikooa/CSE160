/*
class Sphere {
    
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = 10;
        this.vertexBuffer = null;
        this.numVertices = 0;
        this.isGenerated = false; // Track if sphere has been generated
    }

    generateSphere() {
        let vertices = [];
        let latitudeBands = this.segments;
        let longitudeBands = this.segments;

        for (let lat = 0; lat < latitudeBands; lat++) {
            let theta1 = (lat * Math.PI) / latitudeBands;
            let theta2 = ((lat + 1) * Math.PI) / latitudeBands;

            for (let lon = 0; lon < longitudeBands; lon++) {
                let phi1 = (lon * 2 * Math.PI) / longitudeBands;
                let phi2 = ((lon + 1) * 2 * Math.PI) / longitudeBands;

                let v1 = this.sphereVertex(theta1, phi1);
                let v2 = this.sphereVertex(theta2, phi1);
                let v3 = this.sphereVertex(theta2, phi2);
                let v4 = this.sphereVertex(theta1, phi2);

                // First triangle
                vertices.push(v1[0], v1[1], v1[2]);
                vertices.push(v2[0], v2[1], v2[2]);
                vertices.push(v3[0], v3[1], v3[2]);

                // Second triangle
                vertices.push(v1[0], v1[1], v1[2]);
                vertices.push(v3[0], v3[1], v3[2]);
                vertices.push(v4[0], v4[1], v4[2]);
            }
        }

        this.numVertices = vertices.length / 3;

        // Create buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        this.isGenerated = true; // Mark as generated
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.matrix.elements);
        var d = Math.PI/10;
        var dd = Math.PI/100;
        // Generate sphere on first render (when gl is available)
        if (!this.isGenerated) {
            this.generateSphere();
        }

        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Bind buffer and draw
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
    }

    sphereVertex(theta, phi) {
        let x = Math.sin(theta) * Math.cos(phi);
        let y = Math.cos(theta);
        let z = Math.sin(theta) * Math.sin(phi);
        return [x, y, z];
    }

        constructor() {
        this.type = 'sphere';
        //this.position = [0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 10.0;
        //this.segments = g_segCount;; 
        this.matrix = new Matrix4();
        this.textureNum = -2;
        this.verts32 = new Float32Array([]);
    }

        render() {
        //let xy = this.position;
        var rgba = this.color;
        //let size = this.size;
        //this.segments = g_segCount;

        gl.uniform1i(u_whichTexture, this.textureNum); // set mode for this cube
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var d = Math.PI/10;
        var dd = Math.PI/100;

        for(var t = 0; t < Math.PI; t += d) {
            for(var r = 0; r < 2*Math.PI; r += d) {
               var p1 = [Math.sin(t)*Math.cos(r), Math.sin(t)*Math.sin(r), Math.cos(t)];
                var p2 = [Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
                var p3 = [Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
                var p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];
                
                var v = [];
                var uv = [];
                v=v.concat(p1); uv=uv.concat([0,0]);
                v=v.concat(p2); uv=uv.concat([0,0]);
                v=v.concat(p4); uv=uv.concat([0,0]);

                gl.uniform4f(u_FragColor,1.0, 1.0, 1.0, 1.0);
                drawTriangle3DUVNormal(v, uv, v);

                v = [];
                uv = [];
                v=v.concat(p1); uv=uv.concat([0,0]);
                v=v.concat(p4); uv=uv.concat([0,0]);
                v=v.concat(p3); uv=uv.concat([0,0]);
                gl.uniform4f(u_FragColor,1.0, 0.0, 0.0, 1.0);
                drawTriangle3DUVNormal(v, uv, v);
            }

        }
    }
}*/

function sin(x){
    return Math.sin(x);
}

function cos(x){
    return Math.cos(x);
}

class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2;
        this.verts32 = new Float32Array([]);
    }

    render() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var d  = Math.PI / 10;
        var dd = d; // THE FIX: dd must equal d so triangles tile the sphere with no gaps

        for (var t = 0; t < Math.PI; t += d) {
            for (var r = 0; r < 2 * Math.PI; r += d) {
                var p1 = [Math.sin(t)    * Math.cos(r),    Math.sin(t)    * Math.sin(r),    Math.cos(t)   ];
                var p2 = [Math.sin(t+dd) * Math.cos(r),    Math.sin(t+dd) * Math.sin(r),    Math.cos(t+dd)];
                var p3 = [Math.sin(t)    * Math.cos(r+dd), Math.sin(t)    * Math.sin(r+dd), Math.cos(t)   ];
                var p4 = [Math.sin(t+dd) * Math.cos(r+dd), Math.sin(t+dd) * Math.sin(r+dd), Math.cos(t+dd)];

                var v, uv;

                // Triangle 1
                v = []; uv = [];
                v = v.concat(p1); uv = uv.concat([0, 0]);
                v = v.concat(p2); uv = uv.concat([0, 1]);
                v = v.concat(p4); uv = uv.concat([1, 1]);
                gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
                drawTriangle3DUVNormal(v, uv, v);

                // Triangle 2
                v = []; uv = [];
                v = v.concat(p1); uv = uv.concat([0, 0]);
                v = v.concat(p4); uv = uv.concat([1, 1]);
                v = v.concat(p3); uv = uv.concat([1, 0]);
                gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
                drawTriangle3DUVNormal(v, uv, v);
            }
        }
    }
}