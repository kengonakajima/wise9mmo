var sys = require('sys');

var Enums = new Object();

Enums.BlockType = { AIR:0, STONE:1, SOIL:2, GRASS:3, WATER:4, LEAF:5, STEM:6, LADDER:7 };
Enums.ItemType = { REDFLOWER:100, BLUEFLOWER:101 };


exports.Enums = Enums;


    

function Field( hsize, vsize ) {
    this.hSize = hsize;
    this.vSize = vsize;

    this.blocks = new Array( hsize * hsize * vsize );
       
}

function toIndex( x,y,z, hs ){
    return x + z* hs + y * hs * hs; 
}

// yが高さ方向, zが奥行き xが左右

Field.prototype.fill = function( x0,y0,z0, x1,y1,z1, t ) {
    for(var x=x0; x < x1; x ++ ){
        for(var y=y0; y < y1; y++ ){
            for(var z=z0; z < z1; z++ ){
                this.blocks[ toIndex(x,y,z, this.hSize) ] = t;
            }
        }
    }
}
    


Field.prototype.stats = function( h) {
    var counts = new Array(200);
    var ycounts = new Array( this.vSize );
    for(var i=0;i<counts.length;i++){counts[i]=0;}
    for(var i=0;i<ycounts.length;i++){ycounts[i]=new Array(200);  for(var j=0;j<200;j++){ ycounts[i][j]=0;}}
    
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
    for(var y=0;y<ycounts.length &&y<h;y++){
        var s = "y:"+y;
        for(var j=0;j<ycounts[y].length;j++){
            if( ycounts[y][j]>0) s += " "+ j + ":" + ycounts[y][j];
        }
        sys.puts(s);
    }
}
Field.prototype.get = function(x,y,z){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return null;
    return this.blocks[ toIndex( x,y,z,this.hSize) ];
}
    
Field.prototype.set = function(x,y,z,t){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return;
    this.blocks[ toIndex( x,y,z,this.hSize) ] = t;
}

    Field.prototype.putTree = function(x,y,z) {
        for(var ix=-1;ix<=1;ix++){
            for(var iy=-1;iy<=1;iy++){
                for(var iz=-1;iz<=1;iz++){
                    this.set(x+ix,y+3+iy,z+iz, Enums.BlockType.LEAF);
                }
            }
        }
        this.set(x,y,z, Enums.BlockType.STEM);
        this.set(x,y+1,z, Enums.BlockType.STEM);
        this.set(x,y+2,z, Enums.BlockType.STEM);
    }

    
// 大きい一部取る
// x1は含まない (0,0,0)-(1,1,1)は１セル分
Field.prototype.getBlockBox = function(x0,y0,z0,x1,y1,z1) {
    if( x0<0||y0<0||z0<0||x0>this.hSize||y0>this.vSize||z0>this.hSize
        ||x1<0||y1<0||z1<0||x1>this.hSize||y1>this.vSize||z1>this.hSize){
        return null;
    }
    var out = new Array( (x1-x0) * (y1-y0) * (z1-z0) );
    var i=0;
    for(var y=y0; y < y1; y++ ){
        for(var z=z0; z < z1; z++ ) {
            for(var x=x0; x < x1; x ++ ){
                out[i]= this.blocks[ toIndex(x,y,z,this.hSize) ];
                i++;
            }
        }
    }
    return out;                
}
// 明るさテーブルを取る0~15
Field.prototype.getLightBox = function(x0,y0,z0,x1,y1,z1) {
    if( x0<0||y0<0||z0<0||x0>this.hSize||y0>this.vSize||z0>this.hSize
        ||x1<0||y1<0||z1<0||x1>this.hSize||y1>this.vSize||z1>this.hSize){
        return null;
    }
    // 各軸について、-1側と+1側に1マスづつはみ出たデータ量が必要。
    var out = new Array( (x1-x0 + 2) * (y1-y0 + 2) * (z1-z0 + 2) );
    var i=0;
    for(var y=y0-1; y < y1+1; y++ ){
        for(var z=z0-1; z < z1+1; z++ ) {
            for(var x=x0-1; x < x1+1; x ++ ){
                var l=0;
                if( x<0 ||y<0||z<0||x>=this.hSize||y>=this.vSize||z>=this.hSize){
                    l=-1;
                } else {
                    if( this.blocks[ toIndex(x,y,z,this.hSize) ] == Enums.BlockType.AIR
                        || this.blocks[ toIndex(x,y,z,this.hSize) ] >= 100
                        ){
                        l = 6;
                    } else {
                        l = -1;
                    }
                }
                out[i]=l;
                i++;
            }
        }
    }
    return out;                
}
    


// 軸ごとのサイズ。 east-west size, north-south size, high-low size 
exports.generate = function( hsize, vsize ) {
    var fld = new Field( hsize, vsize );

    fld.fill( 0,0,0, hsize,vsize,hsize, Enums.BlockType.AIR ); // 世界を空気で満たす
    fld.fill( 0,0,0, hsize,1,hsize, Enums.BlockType.STONE ); // 地盤を置く

    var d = 20;
    fld.fill( 4,1,4, 8+d,2,8+d, Enums.BlockType.STONE );   // 高台を置く
    fld.fill( 5,2,5, 7+d,3,7+d, Enums.BlockType.SOIL );   // その上に水を置く
    fld.fill( 6,3,6, 6+d,4,6+d, Enums.BlockType.GRASS );   // その上に水を置く    
    fld.fill( 7,4,7, 5+d,5,5+d, Enums.BlockType.GRASS );   //
    
    fld.set( 8,5,8, Enums.ItemType.REDFLOWER );   //
    fld.set( 8,5,10, Enums.ItemType.BLUEFLOWER );   //

    fld.putTree(12,5,12 );
    fld.putTree(17,5,12 );
    fld.putTree(17,5,17 );        
    fld.putTree(12,5,17 );
    
    fld.fill( 2,0,2, 20,1,2, Enums.BlockType.WATER );   //
    
    fld.fill( 3,1,3, 4,10,4, Enums.BlockType.LADDER );   // 

    fld.fill( 2,1,2, 3,2,4, Enums.ItemType.REDFLOWER );
    //    fld.fill( 6,1,2, 8,2,5, Enums.BlockType.STONE );
    fld.stats(30);
    return fld;
}

    exports.diggable = function(t){
        if( t == Enums.BlockType.STONE
            || t == Enums.BlockType.GRASS
            || t == Enums.BlockType.SOIL
            || t == Enums.BlockType.STEM
            || t == Enums.BlockType.LEAF
            ){
            return true;
        } else {
            return false;
        }
    }
