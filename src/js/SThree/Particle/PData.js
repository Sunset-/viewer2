import Base from './Base';
import Shader from '../Shader/index';
export default class PData extends Base {
    vertiecs = [];
    colors = [];
    filters = [];
    offset = 0;
    // plength = 3062.0;
    // pwidth = 2800.0;
    // plevel = 1600.0;
    // pinverse = true;
    // ppseudocolor = true;
    // featurenum = 5;
    // featurecolors = [];
    // featurevertiecs = [];
    /**
     * plength, pwidth, plevel, isInverse, isPseudocolor: options
     * @param {number} featurenum 特征点间隔数
     */
    constructor(data,width,height) {
        super();
        this.data = data;
        // let img = PData.getImageformData(data,width,height);
        // this.image = img;
        this.vertiecs = PData.getPosition();

        this.width = width;
        this.height = height;
        
        this.num = 4;
        this
            .filters
            .push(new Shader.Cateyes());

        return this;
    }

    getoffset(){
        this.image = this.getImageformData(this.data,this.width,this.height);
        return this;
    }

    loadBuffer(gl) {
        this.gl = gl;
        let n = this.initBuffer(gl);
        if (n < 0) {
            console.log('Failed to set the vertex information');
            return -1;
        }
        return n;
    }
    static getPosition() {
        
        let vertiecs = [
                -1,1,0,1,
                1,1,1,1,
                -1,-1,0,0,
                1,-1,1,0
            ];
        

        return vertiecs;
    }
    getImageformData(data,width,height){
        let canvas = document.createElement('canvas');
        canvas.width=width;
        canvas.height=height;
        let min = 0;
        for(let i=0; i <data.length;i++){
            min = data[i]<min?data[i]:min;
        }
        this.offset = min;

        let ctx = canvas.conext=canvas.getContext('2d');
        let pixels = [];
        for(let i=0;i<data.length;i++){
            let temp = data[i]+Math.abs(this.offset);
            let r,g,b;
            r = parseInt(temp/65536);
            let step = r*65536;
            g = parseInt((temp-step)/256);
            step += g*256;
            b = parseInt(temp -step);
            pixels.push(r,g,b,255.0);
        }
        
        let imagedata = new ImageData(width,height);
        imagedata.data.set(pixels,0,pixels.length);
        ctx.putImageData(imagedata,0,0);

        var image = new Image();
        image.src = canvas.toDataURL('image/png');

        return image;
    }
}