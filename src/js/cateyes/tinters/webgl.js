import {
    matIV
} from './minMatrix';
var Matrix = new matIV();

var V_SHADER = [
    'uniform mat4 u_transformMatrix;',
    'attribute vec2 a_Position;',
    'attribute vec2 a_TexCoord;',
    'varying vec2 v_TexCoord;',
    'void main(void) { ',
    '   gl_Position = u_transformMatrix*vec4(a_Position,0.0, 1.0);',
    '   gl_PointSize = 1.0;',
    '   v_TexCoord = a_TexCoord;',
    '}'
].join('\n');
var F_SHADER = [
    'precision mediump float;',
    'uniform sampler2D u_Sampler0;',
    // 'uniform sampler2D u_Sampler1;',
    // 'uniform sampler2D u_Sampler2;',
    // 'uniform sampler2D u_Sampler3;',
    'uniform float u_luminance,u_contrast;',
    'uniform float u_intensity,u_steph,u_stepv;',
    'uniform bool u_inverse,u_pseudocolor,u_ashing,u_filterr,u_filterg,u_filterb;',

    'varying vec2 v_TexCoord;',
    'void main(void) {',
    // '   float s = v_TexCoord.s;',
    // '   float t = v_TexCoord.t;',
    '   vec4 c = texture2D(u_Sampler0, v_TexCoord);',
    //---------------  锐化模糊  ---------------------
    '   if(u_intensity!=1.0){',
    '       vec4 c1 = texture2D(u_Sampler0, vec2(v_TexCoord.s+u_steph,v_TexCoord.t+u_stepv));',
    '       vec4 c2 = texture2D(u_Sampler0, vec2(v_TexCoord.s+u_steph,v_TexCoord.t-u_stepv));',
    '       vec4 c3 = texture2D(u_Sampler0, vec2(v_TexCoord.s-u_steph,v_TexCoord.t+u_stepv));',
    '       vec4 c4 = texture2D(u_Sampler0, vec2(v_TexCoord.s-u_steph,v_TexCoord.t-u_stepv));',
    '       vec4 nc = (c+c1+c1+c2+c3+c4)/5.0;',
    '       c = (c - nc) * u_intensity + nc;',
    '   }',
    //---------------  RGB滤镜  ---------------------
    '   if(u_filterr){',
    '       c.r = 0.0;',
    '   }',
    '   if(u_filterg){',
    '       c.g = 0.0;',
    '   }',
    '   if(u_filterb){',
    '       c.b =0.0;',
    '   }',
    //---------------  反色  ---------------------
    '   if(u_inverse){',
    '       c.r = 1.0-c.r;',
    '       c.g = 1.0-c.g;',
    '       c.b = 1.0-c.b;',
    '   }',
    //---------------  灰化  ---------------------
    '   if(u_ashing){',
    '       float gray = (c.r  + c.g  + c.b)/3.0;',
    '       c.r = gray;',
    '       c.g = gray;',
    '       c.b = gray;',
    '   }',
    //---------------  伪彩  ---------------------
    '   if(u_pseudocolor){',
    '       float gray = (c.r  + c.g  + c.b)/3.0;',
    '       if(gray<0.0){',
    '           c=vec4(0.0,0.0,0.0,c.a);',
    '       }else if(gray<=0.25) {',
    '           c=vec4(0.0,0.0,4.0*gray,c.a);',
    '       }else if(gray<=0.375) {',
    '           c=vec4(4.0*(gray-0.25),0.0,1.0,c.a);',
    '       }else if(gray<0.5) {',
    '           c=vec4(4.0*(gray-0.25),0.0,1.0-8.0*(gray-0.375),c.a);',
    '       }else if(gray==0.5) {',
    '           c=vec4(1.0,0.0,0.0,c.a);',
    '       }else if(gray<=0.75) {',
    '           c=vec4(1.0,4.0*(gray-0.5),0,c.a);',
    '       }else if(gray<1.0){',
    '           c=vec4(1.0,1.0,4.0*(gray-0.75),c.a);',
    '       }else {',
    '           c=vec4(1.0,1.0,1.0,c.a);',
    '       }',
    '   }',
    //---------------  亮度/对比度  ---------------------
    '   float gr = (c.r - 0.5 * (1.0 - u_luminance)) * u_contrast + 0.5 * (1.0 + u_luminance);',
    '   float gg = (c.g - 0.5 * (1.0 - u_luminance)) * u_contrast + 0.5 * (1.0 + u_luminance);',
    '   float gb = (c.b - 0.5 * (1.0 - u_luminance)) * u_contrast + 0.5 * (1.0 + u_luminance);',
    '   c = vec4(gr,gg,gb,1.0);',

    //---------------  着色  ---------------------
    '   gl_FragColor = c;',
    '}'
].join('\n');


function WebGLTinter(canvas) {
    this.inited = false;
    //初始化webgl合并程序
    this.programs = {};
    this.state = {};
    //初始化上下文
    this.canvas = canvas;
    var gl = this.gl = this.createWebglContext(canvas);
    return this;
}


WebGLTinter.prototype = {
    createWebglContext(canvas, opt_attribs) {
        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii], opt_attribs);
            } catch (e) {}
            if (context) {
                break;
            }
        }
        return context;
    },
    _initProgram(name, vshaderCode, fshaderCode) {
        var gl = this.gl;
        if (this.programs[name]) {
            gl.linkProgram(this.programs[name]);
            gl.useProgram(this.programs[name]);
            return this.program = this.programs[name];
        }
        var vertShader = this._createShader(gl, gl.VERTEX_SHADER, vshaderCode);
        var fragShader = this._createShader(gl, gl.FRAGMENT_SHADER, fshaderCode);
        var program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        this.programs[name] = program;
        return this.program = program;
    },
    //创建着色器
    _createShader(gl, type, code) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        // 检查编译错误
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn(`gl.compileShader(${code}) failed`);
            console.warn(gl.getShaderInfoLog(shader)); // 输出错误信息
        }
        return shader;
    },
    //绑定变量
    _bindUniformParam(name, method, ...values) {
        var gl = this.gl;
        var a_location = gl.getUniformLocation(this.program, name);
        if (a_location < 0) {
            console.warn(`${name}变量定位失败`);
        }
        gl[method].apply(gl, [a_location].concat(values));
    },
    //绑定缓冲区数据
    _bindBufferData(attributes) {
        var gl = this.gl;
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        attributes.forEach(attr => {
            gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW);
            var a_location = gl.getAttribLocation(this.program, attr.name);
            var per = attr.data.BYTES_PER_ELEMENT;
            gl.vertexAttribPointer(a_location, attr.size || 1, attr.type || gl.FLOAT, false, per * (attr.piece || 0), per * (attr.offset || 0));
            gl.enableVertexAttribArray(a_location);
        });
    },
    //绑定纹理
    _bindTexture(image) {
        return Promise.resolve([image]).then(imgs => {
            //纹理切片
            var gl = this.gl,
                program = this.program;
            imgs.forEach((img, index) => {
                var texture = gl.createTexture();
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                gl.activeTexture(gl[`TEXTURE${index}`]);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                // 4.配置纹理参数
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                // 用图片边缘颜色填充空白区域
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                // 镜像填充（轴对称）
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
                var u_Sampler = gl.getUniformLocation(program, `u_Sampler${index}`);
                gl.uniform1i(u_Sampler, index);
            });
        });
    },
    _clear(...colors) {
        var gl = this.gl;
        if (!colors || !colors.length) {
            colors = [1.0, 1.0, 1.0, 1.0];
        }
        this._clearColors = colors;
        gl.clearColor.apply(gl, colors);
        gl.clear(gl.COLOR_BUFFER_BIT);
    },
    draw(image, state) {
        this.state = state;
        if (this.inited && this.image === image) {
            this._draw();
        } else {
            this.inited = false;
            this.image = image;
            this.canvas.width = image.width;
            this.canvas.height = image.height;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this._initDrawer().then(() => {
                this._draw();
                this.inited = true;
            });
        }
    },
    _initDrawer() {
        return new Promise(resolve => {
            var gl = this.gl;
            //初始化着色器程序
            var shaderProgram = this._initProgram('DICOM', V_SHADER, F_SHADER);
            var vertexs = new Float32Array([-1.0, 1.0, 0.0, 1.0,
                1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 0.0, 0.0,
                1.0, -1.0, 1.0, 0.0
            ]);

            this._bindBufferData([{
                name: 'a_Position',
                type: gl.FLOAT,
                data: vertexs,
                piece: 4,
                size: 2
            }, {
                name: 'a_TexCoord',
                type: gl.FLOAT,
                data: vertexs,
                piece: 4,
                size: 2,
                offset: 2
            }]);
            this._bindTexture(this.image).then(() => {
                resolve();
            });
        });
    },
    _draw() {
        var gl = this.gl;
        // this._bindUniformParam('a_originMinGray', 'uniform1f', Math.abs(this.data.data.minGray) * 1.0);
        // this._bindUniformParam('a_minGray', 'uniform1f', showMinGray);
        // this._bindUniformParam('a_maxGray', 'uniform1f', showMaxGray);
        // this._bindUniformParam('a_step', 'uniform1f', step);

        //像素步长
        this._bindUniformParam('u_steph', 'uniform1f', 1.0 / this.state.width);
        this._bindUniformParam('u_stepv', 'uniform1f', 1.0 / this.state.height);
        //亮度
        var luminance = this.state.luminance / 1000.0;
        luminance = Math.min(1, luminance);
        luminance = Math.max(-1, luminance);
        this._bindUniformParam('u_luminance', 'uniform1f', luminance);
        //对比度
        var contrast = this.state.contrast / 1000.0;
        contrast = Math.min(1, contrast);
        contrast = Math.max(-1, contrast);
        contrast += 1;
        this._bindUniformParam('u_contrast', 'uniform1f', contrast);
        //锐化
        var intensity = this.state.intensity / 100.0;
        intensity = Math.min(1, intensity);
        intensity = Math.max(-1, intensity);
        intensity += 1;
        this._bindUniformParam('u_intensity', 'uniform1f', intensity);
        //反色
        this._bindUniformParam('u_inverse', 'uniform1f', this.state.isInverse);
        //灰化
        this._bindUniformParam('u_ashing', 'uniform1f', this.state.isAshing);
        //伪彩
        this._bindUniformParam('u_pseudocolor', 'uniform1f', this.state.isPseudoColor);
        //rgb滤镜
        this._bindUniformParam('u_filterr', 'uniform1f', this.state.isFilterR);
        this._bindUniformParam('u_filterg', 'uniform1f', this.state.isFilterG);
        this._bindUniformParam('u_filterb', 'uniform1f', this.state.isFilterB);

        var matrix = Matrix.translate(Matrix.identity([]), [0.0, 0.0, 0.0], []);
        var u_transformMatrix = gl.getUniformLocation(this.program, 'u_transformMatrix');
        gl.uniformMatrix4fv(u_transformMatrix, false, matrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
};

WebGLTinter.prototype.constructor = WebGLTinter;

module.exports = WebGLTinter;