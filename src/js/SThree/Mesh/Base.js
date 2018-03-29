export default class Base{
    gl={};
    num = 0;
    constructor(gl,num){
        this.num = num;
        this.gl = gl;
    }

    initTextures(gl,n){
        let texture = gl.createTexture();
        if(!texture){
            console.log('Failed to create the texture object');
            return false;
        }

        let u_Sampler  = gl.getUniformLocation(gl.program,'u_Sampler');
        if(!u_Sampler){
            console.log('Failed to get the storage location of u_Sampler');
            return false;
        }
        image.onload = function(){
            this.loadTexture(gl,n,texture,u_Sampler,image);
        }

        image.src = '/assert/dicom/12e20f8ce961763f7b1143e9077609e9';
        return true;
    }

    loadTexture(gl,n,texture,u_Sampler,image){
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D,texture);

        gl.textParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        gl.uniform1i(u_Sampler,0);
        gl.clear(gl.COLOR_BUGGER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,n);
    }
}