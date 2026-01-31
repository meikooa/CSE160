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
}