// 全体の共用

var sys = require("sys");

exports.BlockType = { AIR:0, STONE:1, SOIL:2, GRASS:3, WATER:4, LEAF:5, STEM:6, LADDER:7 };
exports.ItemType = { REDFLOWER:100, BLUEFLOWER:101 };



// 整数で位置を示す
function Pos( x,y,z){
    this.x = x;
    this.y = y;
    this.z = z;
}
Pos.prototype.distance = function(pos){
    return Math.sqrt( (pos.x-this.x)*(pos.x-this.x) +
                      (pos.y-this.y)*(pos.y-this.y) +
                      (pos.z-this.z)*(pos.z-this.z) );
};
// 相手から自分を引く
Pos.prototype.diff = function(pos){
    return new Pos( pos.x - this.x, pos.y - this.y, pos.z - this.z );
};




// floatで位置を示す. 必要な計算が全然違うのでわけとく

function Vector3(x,y,z){
    this.x = x*1.0;
    this.y = y*1.0;
    this.z = z*1.0;
    sys.puts( "tof:" + typeof( this.x ) );
};
Vector3.prototype.ix = function() { return Math.floor(this.x); };
Vector3.prototype.iy = function() { return Math.floor(this.y); };
Vector3.prototype.iz = function() { return Math.floor(this.z); };

Vector3.prototype.toPos = function() {
    return new Pos( this.ix(), this.iy(), this.iz() );                    
};
Vector3.prototype.diff = function(v){return new Pos( v.x - this.x, v.y - this.y, v.z - this.z );};
// (0,0)-(dv)からpitchを返す
Vector3.prototype.getPitch = function( dv ) {
    var rot = 0;
    if( dv.x == 0 ){
        rot = ( dv.y >= 0 ? 1 : -1 ) * 3.14159 / 2.0;
    } else if( dv.x < 0 ){
        rot = Math.atan( dv.y / dv.x) + 3.14159;
    } else {
        rot = Math.atan( dv.y / dv.x);
    }
    return rot;
};

//

exports.Pos = Pos;
exports.Vector3 = Vector3;
