import Base from './Base';

export default class Cateyes extends Base {

    vshader = [
        'attribute vec4 aVertexPosition;',
        'attribute vec2 a_TexCoord;',
        'varying vec2 v_TexCoord;',
        'uniform mat4 mvpMatrix;',

        'void main(void) {',
        '   gl_Position =  aVertexPosition;',
        '   v_TexCoord = a_TexCoord;',
        '}'
    ].join('\n');

    fshader = [
    '#ifdef GL_ES',
    'precision highp float;',
    '#endif',
    'uniform sampler2D u_Sampler;',
    'uniform float pmingray,pmaxgray,pstep,rescaleSlope,rescaleIntercept,piscolor,offset;',
    'uniform bool pinverse,ppseudocolor;',
    'varying vec2 v_TexCoord;',
    'void main(void) {',
        '   gl_FragColor = texture2D(u_Sampler , v_TexCoord);',
        '   vec4 c = gl_FragColor;',
        '   vec4 rgb;float gray;',
        '   if(piscolor==1.0){',
        '       gray = (c.r * 255.0 * 65536.0) + (c.g * 255.0 * 256.0) + (c.b * 255.0);',
        '       gray = gray  + rescaleIntercept;',
        // '       gray = gray+offset;',
        // '       gray = gray * rescaleSlope-2000.0;',
        '       gray = gray<=pmingray?0.0:(gray>=pmaxgray?255.0:((gray-pmingray) * pstep));',
        '       gray = gray / 255.0;',
        '       gray = pinverse?(1.0-gray):gray;',
        '       rgb=vec4(gray,gray,gray,1.0);',
        '       if(ppseudocolor){',
        '           if(gray<0.0){rgb=vec4(0.0,0.0,0.0,c.a);}',
        '           else if(gray<=0.25) {rgb=vec4(0.0,0.0,4.0*gray,c.a);}',
        '           else if(gray<=0.375) {rgb=vec4(4.0*(gray-0.25),0.0,1.0,c.a);}',
        '           else if(gray<0.5) {rgb=vec4(4.0*(gray-0.25),0.0,1.0-8.0*(gray-0.375),c.a);}',
        '           else if(gray==0.5) {rgb=vec4(1.0,0.0,0.0,c.a);}',
        '           else if(gray<=0.75) {rgb=vec4(1.0,4.0*(gray-0.5),0,c.a);}',
        '           else if(gray<1.0){rgb=vec4(1.0,1.0,4.0*(gray-0.75),c.a);}',
        '           else {rgb=vec4(1.0,1.0,1.0,c.a);}',
        '       }',
        '   }else if (piscolor==2.0){',
        '       gray = c.r*255.0;',
        '       gray = gray<=pmingray?0.0:(gray>=pmaxgray?255.0:((gray-pmingray) * pstep));',
        '       rgb.r= gray/255.0;',
        '       rgb.r = pinverse?(1.0-rgb.r):rgb.r;',

        '       gray = c.g*255.0;',
        '       gray = gray<=pmingray?0.0:(gray>=pmaxgray?255.0:((gray-pmingray) * pstep));',
        '       rgb.g=gray/255.0;',
        '       rgb.g = pinverse?(1.0-rgb.g):rgb.g;',

        '       gray = c.b*255.0;',
        '       gray = gray<=pmingray?0.0:(gray>=pmaxgray?255.0:((gray-pmingray) * pstep));',
        '       rgb.b = gray/255.0;',
        '       rgb.b = pinverse?(1.0-rgb.b):rgb.b;',

        '       rgb.a =1.0;',
        '   }',
        '   gl_FragColor = rgb;',
    '} '].join('\n');

    constructor(gl, vshader, fshader) {
        super();
        this.gl = gl;
        this.vshader = vshader || this.vshader;
        this.fshader = fshader || this.fshader;

        return this;
    }

}
