class Model {
    constructor() {
        this.color = [0.85, 0.85, 0.9, 1.0];
        this.textureNum = -2;
        this.matrix = new Matrix4();
        this.vertexCount = 0;
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.uvBuffer = null;
        this.bounds = null;
    }

    static async loadOBJ(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to load OBJ: " + url);
        }
        const text = await response.text();
        return Model.fromOBJText(text);
    }

    static fromOBJText(text) {
        const model = new Model();

        const positions = [];
        const normals = [];
        const uvs = [];
        const outVerts = [];
        const outNormals = [];
        const outUVs = [];

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line[0] === "#") continue;

            if (line.startsWith("v ")) {
                const p = line.split(/\s+/);
                const x = parseFloat(p[1]);
                const y = parseFloat(p[2]);
                const z = parseFloat(p[3]);
                positions.push([x, y, z]);
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (z < minZ) minZ = z;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                if (z > maxZ) maxZ = z;
                continue;
            }

            if (line.startsWith("vn ")) {
                const n = line.split(/\s+/);
                normals.push([parseFloat(n[1]), parseFloat(n[2]), parseFloat(n[3])]);
                continue;
            }

            if (line.startsWith("vt ")) {
                const t = line.split(/\s+/);
                uvs.push([parseFloat(t[1]), parseFloat(t[2])]);
                continue;
            }

            if (!line.startsWith("f ")) continue;

            const faceTokens = line.split(/\s+/).slice(1);
            if (faceTokens.length < 3) continue;

            const parsed = faceTokens.map((tok) => {
                const parts = tok.split("/");
                const vi = parseInt(parts[0], 10);
                const ti = parts[1] ? parseInt(parts[1], 10) : 0;
                const ni = parts[2] ? parseInt(parts[2], 10) : 0;
                return { vi: vi, ti: ti, ni: ni };
            });

            // Triangle fan triangulation for n-gons.
            for (let t = 1; t < parsed.length - 1; t++) {
                const tri = [parsed[0], parsed[t], parsed[t + 1]];
                for (let k = 0; k < 3; k++) {
                    const idx = tri[k];

                    const p = positions[idx.vi > 0 ? idx.vi - 1 : positions.length + idx.vi];
                    outVerts.push(p[0], p[1], p[2]);

                    if (idx.ni !== 0 && normals.length > 0) {
                        const n = normals[idx.ni > 0 ? idx.ni - 1 : normals.length + idx.ni];
                        outNormals.push(n[0], n[1], n[2]);
                    } else {
                        outNormals.push(0, 1, 0);
                    }

                    if (idx.ti !== 0 && uvs.length > 0) {
                        const uv = uvs[idx.ti > 0 ? idx.ti - 1 : uvs.length + idx.ti];
                        outUVs.push(uv[0], uv[1]);
                    } else {
                        outUVs.push(0, 0);
                    }
                }
            }
        }

        model.bounds = {
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ],
            center: [(minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5],
            size: [maxX - minX, maxY - minY, maxZ - minZ]
        };

        model._initBuffers(outVerts, outNormals, outUVs);
        return model;
    }

    _initBuffers(vertices, normals, uvs) {
        this.vertexCount = vertices.length / 3;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    }

    render() {
        if (!this.vertexBuffer || this.vertexCount === 0) return;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}
