
import Renderer from './Renderer';
import Particle from './Particle/index';

export default {
    Renderer,
    Particle
};



let PImage = Particle.PImage;
let pimages = [];


export function ST(canvas){
    this.Renderer = new Renderer();
    this.pimages = {};
    this.options = {};
}

ST.prototype.loadPImage = function(id,img){
    if(!img&&!this.pimages.hasOwnProperty(id)){
        return false;
    }else{
        this.pimages[id] = new PImage(img,null);
    }

    this.Renderer.render(this.pimages[id],this.options);
    
    return true;
};

