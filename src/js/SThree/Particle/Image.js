import Base from './Base';
import Shader from '../Shader/index';
export default class PImage extends Base {
    vertiecs = [];
    colors = [];
    filters = [];
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
    constructor(img,width,height) {
        super();
        this.image = img;
        this.vertiecs = PImage.getPosition(img);
        
        this.width = img.width;
        this.height = img.height;
        
        this.num = 4;
        this
            .filters
            .push(new Shader.Cateyes());

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
    static getPosition(img) {
        
        let vertiecs = [
                -1,1,0,1,
                1,1,1,1,
                -1,-1,0,0,
                1,-1,1,0
            ];
        

        return vertiecs;
    }
}