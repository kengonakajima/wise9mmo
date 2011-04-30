var sys = require('sys');

var Enums = new Object();

Enums.BlockType = { AIR:0, STONE:1, WATER:2 };


exports.Enums = Enums;


function Field( hsize, vsize ) {
    this.hSize = hsize;
    this.vSize = vsize;

    this.blocks = new Array( hsize * hsize * vsize );
       
}

function toIndex( x,y,z, hs ){
    return y * hs * hs + z * hs + x ;
}
// yが高さ方向, zが奥行き xが左右
Field.prototype.fill = function( x0,y0,z0, x1,y1,z1, t ) {
    var i=0;
    for(var x=x0; x < x1; x ++ ){
        for(var y=y0; y < y1; y++ ){
            for(var z=z0; z < z1; z++ ){
                this.blocks[ toIndex(x,y,z, this.hSize) ] = t;
                i++;
            }
        }
    }
}

Field.prototype.stats = function() {
    var counts = new Array(10);
    var ycounts = new Array( this.vSize );
    for(var i=0;i<counts.length;i++){counts[i]=0;}
    for(var i=0;i<ycounts.length;i++){ycounts[i]=new Array(10);  for(var j=0;j<10;j++){ ycounts[i][j]=0;}}
    
    for(var x=0; x < this.hSize; x ++ ){
        for(var y=0; y < this.vSize; y++ ){
            for(var z=0; z < this.hSize; z++ ){
//                sys.puts( ""+x+y+z+":"+this.blocks[ toIndex( x,y,z, this.hSize ) ]  );
                counts[ this.blocks[ toIndex( x,y,z, this.hSize ) ] ] ++;
                ycounts[y][ this.blocks[ toIndex( x,y,z, this.hSize ) ] ] ++;
            }
        }
    }
    sys.puts( "stat:" );
    for(var i=0;i<counts.length;i++){
        if( counts[i]>0) sys.puts( "" + i + ":" + counts[i] );
    }
    for(var y=0;y<ycounts.length;y++){
        var s = "y:"+y;
        for(var j=0;j<ycounts[y].length;j++){
            if( ycounts[y][j]>0) s += " "+ j + ":" + ycounts[y][j];
        }
        sys.puts(s);
    }
}

Field.prototype.get = function(x,y,z){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize) throw "invalid block coord:"+x+","+y+","+z;
    return this.blocks[ toIndex( x,y,z,this.hSize) ];
}
// 大きい一部取る
// x1は含まない (0,0,0)-(1,1,1)は１セル分
Field.prototype.getBox = function(x0,y0,z0,x1,y1,z1) {
    if( x0<0||y0<0||z0<0||x0>this.hSize||y0>this.vSize||z0>this.hSize
        ||x1<0||y1<0||z1<0||x1>this.hSize||y1>this.vSize||z1>this.hSize){
        return null;
    }
    var out = new Array( (x1-x0) * (y1-y0) * (z1-z0) );
    var i=0;
    for(var x=x0; x < x1; x ++ ){
        for(var y=y0; y < y1; y++ ){
            for(var z=z0; z < z1; z++ ) {
                out[i]= this.blocks[ toIndex(x,y,z,this.hSize) ];
                i++;
            }
        }
    }
    return out;                
}



// 軸ごとのサイズ。 east-west size, north-south size, high-low size 
exports.generate = function( hsize, vsize ) {

    var fld = new Field( hsize, vsize );

    fld.fill( 0,0,0, hsize,vsize,hsize, Enums.BlockType.AIR );
    fld.fill( 0,0,0, hsize,1,hsize, Enums.BlockType.STONE );

    
    fld.fill( 5,1,5, 15,2,15, Enums.BlockType.STONE );
    fld.fill( 7,2,7, 12,3,12, Enums.BlockType.WATER );    
    
    
    fld.stats();

    return fld;

}




