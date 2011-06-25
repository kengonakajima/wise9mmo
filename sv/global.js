// 全体の共用

var sys = require("sys");

exports.BlockType = { AIR:0, STONE:1, SOIL:2, GRASS:3, WATER:4, LEAF:5, STEM:6, LADDER:7 };
exports.ItemType = { REDFLOWER:100, BLUEFLOWER:101 };

exports.BlockTypeToString = function(v) {
    for(var k in exports.BlockType ){
        if(exports.BlockType[k]==v)return k
    }
    return null;
};


exports.PlayerForce = 5.0;




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
Pos.prototype.to_s = function(){
    return "{"+this.x+","+this.y+","+this.z+"}";
};
    



// floatで位置を示す. 必要な計算が全然違うのでわけとく

function Vector3(x,y,z){
    this.x = x*1.0;
    this.y = y*1.0;
    this.z = z*1.0;
    //    sys.puts( "tof:" + typeof( this.x ) );
};
Vector3.prototype.ix = function() { return Math.floor(this.x); };
Vector3.prototype.iy = function() { return Math.floor(this.y); };
Vector3.prototype.iz = function() { return Math.floor(this.z); };
Vector3.prototype.mul = function(v) { return new Vector3( this.x*v, this.y*v, this.z*v); };
Vector3.prototype.add = function(v) {
    if( v.x == undefined || v.y == undefined || v.z == undefined ) throw"inval";
    return new Vector3( this.x+v.x, this.y+v.y, this.z+v.z);
};
Vector3.prototype.reverted = function() {
    return new Vector3( this.x * -1, this.y * -1, this.z * -1 );
};
Vector3.prototype.distance = function(pos){
    return Math.sqrt( (pos.x-this.x)*(pos.x-this.x) +
                      (pos.y-this.y)*(pos.y-this.y) +
                      (pos.z-this.z)*(pos.z-this.z) );
};
Vector3.prototype.normalized = function() {
    var d = this.length();
    if( d == 0 ) return new Vector3( 0,0,0);
    return new Vector3( this.x/d, this.y/d, this.z/d);
};
Vector3.prototype.length = function() {
    return this.distance( new Vector3(0,0,0));
};
Vector3.prototype.hDistance = function(pos){
    return Math.sqrt( (pos.x-this.x)*(pos.x-this.x) +
                      (pos.z-this.z)*(pos.z-this.z) );
};    
Vector3.prototype.toPos = function() {
    return new Pos( this.ix(), this.iy(), this.iz() );                    
};

    
Vector3.prototype.diff = function(v){return new Vector3( v.x - this.x, v.y - this.y, v.z - this.z );};
Vector3.prototype.diffSign = function(v){
    var ret = new Vector3(0,0,0);
    if( v.x > this.x ) ret.x = 1; else if( v.x < this.x ) ret.x = -1;
    if( v.y > this.y ) ret.y = 1; else if( v.y < this.y ) ret.y = -1;
    if( v.z > this.z ) ret.z = 1; else if( v.z < this.z ) ret.z = -1;
    return ret;
};
Vector3.prototype.equal = function(v){
    if( v.x == this.x && v.y == this.y && v.z == this.z ) return true; else return false;
}
    
// (0,0)-(dv)からpitchを返す
Vector3.prototype.getPitch = function( dv ) {
    var rot = 0;
    if( dv.x == 0 ){
        rot = ( dv.z >= 0 ? 1 : -1 ) * Math.PI / 2.0;
    } else if( dv.x < 0 ){
        rot = Math.atan( dv.z / dv.x) + Math.PI;
    } else {
        rot = Math.atan( dv.z / dv.x);
    }
    return rot;
};
Vector3.prototype.to_s = function(){
    return "{"+(Math.round(this.x*1000)/1000)+","+(Math.round(this.y*1000)/1000)+","+(Math.round(this.z*1000)/1000)+"}";
};
    

//

exports.Pos = Pos;
exports.Vector3 = Vector3;

exports.sleep = function( ms ) {
    var st = new Date();    
    while(true){
        var nt = new Date();
        if( nt.getTime() > ( st.getTime() + ms ) ){
            break;
        }
    }    
};

// 整数の配列を整数のRLにする
exports.runLength = function( ary ) {
    var out = new Array();
    if(ary.length==0){return out; }
    
    var cur = ary[0];
    var len = 0;
    var outi=0;
    for(var i=0;i<ary.length;i++){
        if( ary[i] == cur ){
            len++;
        } else {
            out[outi]=cur;
            out[outi+1]=len;
            outi+=2;
            cur=ary[i];
            len=1;
        }
    }
    out[outi]=cur;
    out[outi+1]=len;
    return out;        
};
    
