import {matIV} from './minMatrix.js';
import Shader from './Shader/index';

export default class Renderer {
    view = {}; //domElement
    gl = {};
    canvas = {};
    options = {
        piscolor:1,//1:黑白图 2:彩色图
        rescaleSlope:0.683760684,
        rescaleIntercept:200,
        pmingray: 0.0, //CT矫正
        pmaxgray: 2800.0, //窗宽
        pstep: 1600.0, //窗位
        width:3730,
        height:3062,
        pinverse: true||false, //反色
        ppseudocolor: false, //伪彩
        offset:0,
        m:null//位置变幻矩阵
    };
    constructor(...args) {
        let canvas;
        if (args.length == 1) {
            canvas = args[0];
        } else if (args.length == 2) {
            canvas = document.createElement("canvas");
            canvas.width = args[0];
            canvas.height = args[1];
        }
        this.view = canvas;
        
        
        let gl = this.gl = Renderer.create3DContext(canvas);

        if (!gl){
            throw new Error('can not use webgl');
        }
            
        let shader = new Shader.Cateyes();
        
        gl.program = shader.initShader(gl);
        
        // let m = new matIV();
        // let Matrix = m.identity(m.create()); //模型
        // this.mMatrix = m.identity(m.create()); //模型
        // this.m= m;
        // this.Matrix = Matrix;

        return this;
    }

    setPlevel(num) {
        this.options.plevel = num;
    }
    setPwidth(num) {
        this.options.pwidth = num;
    }
    static create3DContext(canvas, options) {
        let names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        let context = null;
        for (let i = 0; i < names.length; i++) {
            try {
                context = canvas.getContext(names[i]);
            } catch (e) {
            }

            if (context) {
                break;
            }
        }
        return context;
    }
    translate(x=0.0,y=0.0,z=0.0){
        this.m.translate(this.Matrix, [x, y, z],this.mMatrix );
    }
    /**
     * 显示
     * @param {Object} options - isPre
     */
    loadparticle(particle){
        particle.loadBuffer(this.gl);
        return this;
    }
    //  var ctx = renderer.getContext("experimental-webgl",{preserveDrawingBuffer: true}) || renderer.getContext("webgl",{preserveDrawingBuffer: true});
    // renderer.render(scene, camera, renderTarget);
    // var arr = new Uint8Array( 4 * 512 * 512);
    // ctx.readPixels(0, 0, 512, 512, ctx.RGBA, ctx.UNSIGNED_BYTE, arr);
    // var c=document.getElementById("canvaspip2");
    // var ctx=c.getContext("2d");
    // var ImgData = ctx.createImageData(512, 512);
    // ImgData.data.set( arr, 0, arr.length );

    // var c=document.getElementById("canvaspip2");
    // var ctx=c.getContext("2d");
    // ctx.putImageData(ImgData,0,0)
    changeToCanvas(callback){
        let canvas = document.createElement('canvas');
        canvas.width= this.view.width;
        canvas.height = this.view.height;
        canvas.context = canvas.getContext('2d');
        let pixels = this.pixels;

        let imagedata =new  ImageData(canvas.width,canvas.height);
        imagedata.data.set(pixels,0,pixels.length);
        canvas.context.putImageData(imagedata,0,0);
        
        var image = new Image();
	    image.src = canvas.toDataURL("image/png");
        image.onload= function (){
            canvas.context.clearRect(0,0,canvas.width,canvas.height);


            // 水平“翻转”画布
            canvas.context.translate(0, canvas.height);
            canvas.context.scale(1, -1);


            // 下面画的图片是水平翻转的
            canvas.context.drawImage(image, canvas.width - canvas.width, 0);


            // 画布恢复正常
            canvas.context.translate(0, canvas.height);
            canvas.context.scale(1, -1);

            callback(canvas);
        };
        
        return canvas;
    }
    clean(){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
    }
    render(particle, newoptions,photo) {
        let options = this.options;

        Object.assign(options, newoptions);
        let gl = this.gl;
        let canvas = this.view;

        // let m = this.m;
        // let mMatrix = this.mMatrix; //模型
        // let vMatrix = m.identity(m.create()); //视图
        // let pMatrix = m.identity(m.create()); //投影
        // let mvpMatrix = m.identity(m.create());

        // // 视图变换坐标矩阵
        // m.lookAt([
        //     0.0, 0.0, 1.00000
        // ], [
        //     0, 0, 0
        // ], [
        //     0, 1, 0
        // ], vMatrix);
        
        // // 投影坐标变换矩阵
        // m.perspective(90,  canvas.width/canvas.height,0.01, 1000, pMatrix);

        // m.multiply(pMatrix, vMatrix, mvpMatrix);
        // m.multiply(mvpMatrix, mMatrix, mvpMatrix);

        // let uniLocation = gl.getUniformLocation(gl.program, 'mvpMatrix');
        // gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

        gl.viewport(0, 0,canvas.width ,canvas.height );

        //设置着色器其余参数
        Renderer.setUniform1f(gl, options);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);                
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        

        /**
         * 生成快照
         */
        if(photo){
            let pixels = new Uint8Array(canvas.width*canvas.height*4);
            this.gl.readPixels(0,0,canvas.width,canvas.height,this.gl.RGBA,this.gl.UNSIGNED_BYTE,pixels);
            this.pixels = pixels;
        }
    }

    static setUniform1f(gl, options) {
        let types = ['pmingray', 'pmaxgray', 'pstep', 'pinverse', 'ppseudocolor','rescaleSlope','rescaleIntercept','piscolor','offset'];
        types.forEach((item) => {
            let location = gl.getUniformLocation(gl.program, item);
            gl.uniform1f(location, options[item]);
        });
    }
}