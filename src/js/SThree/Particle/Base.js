export default class Base {
    gl = {};
    vertiecs = [];
    colors = [];
    num = 0;
    constructor(gl, vertiecs, colors, num) {
        this.vertiecs = vertiecs;
        this.colors = colors;
        this.num = num;
        return this;
    }

    initBuffer(gl) {
        this.gl = gl;
        // Write the vertex coordinates and color to the buffer object
        let vertiecs = [];
        let num = 0;

        vertiecs = this.vertiecs;
        num = this.num;

        if (!Base.initArrayBuffer(this.gl, vertiecs, 4, gl.FLOAT, 'aVertexPosition'))
            return -1;

        if (!Base.initTextures(this.gl, num, this.image, 'u_Sampler'))
            return -1;
        return num;
    }

    static initArrayBuffer(gl, data, num, type, attribute) {
        // Create a buffer object
        let buffer = gl.createBuffer();
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        let verticesTexCoords = new Float32Array(data);
        let FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        // Assign the buffer object to the attribute variable
        let a_attribute = gl.getAttribLocation(gl.program, attribute);
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return -1;
        }

        gl.vertexAttribPointer(a_attribute, 2, type, false, FSIZE * 4, 0);
        // Enable the assignment of the buffer object to the attribute variable
        gl.enableVertexAttribArray(a_attribute);

        // Get the storage location of a_TexCoord
        var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
        if (a_TexCoord < 0) {
            console.log('Failed to get the storage location of a_TexCoord');
            return -1;
        }
        // Assign the buffer object to a_TexCoord variable
        gl.vertexAttribPointer(a_TexCoord, 2, type, false, FSIZE * 4, FSIZE * 2);
        gl.enableVertexAttribArray(a_TexCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        buffer = null;
        a_attribute = null;
        a_TexCoord = null;
        return num;
    }

    static initTextures(gl, n, image, attribute) {
        let texture = gl.createTexture();

        if (!texture) {
            console.log('Failed to create the texture object');
            return false;
        }

        let u_Sampler = gl.getUniformLocation(gl.program, attribute);

        if (!u_Sampler) {
            console.log('Failed to get the storage location of u_Sampler');
            return false;
        }
        if (!image.complete) {
            image
                .addEventListener('load', function () {
                    Base.loadTexture(gl, n, texture, u_Sampler, image);
                });
        } else {
            Base.loadTexture(gl, n, texture, u_Sampler, image);
        }

        return true;
    }

    static loadTexture(gl, n, texture, u_Sampler, image) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(u_Sampler, 0);

        texture = null;
        u_Sampler = null;
    }

}