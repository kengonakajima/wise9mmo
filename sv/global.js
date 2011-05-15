// 全体の共用



exports.BlockType = { AIR:0, STONE:1, SOIL:2, GRASS:3, WATER:4, LEAF:5, STEM:6, LADDER:7 };
exports.ItemType = { REDFLOWER:100, BLUEFLOWER:101 };


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

// (0,0)-(dpos)からpitchを返す
Pos.prototype.getPitch = function( dPos ) {
    var rot = 0;
    if( dPos.x == 0 ){
        rot = ( dPos.y >= 0 ? 1 : -1 ) * 3.14159 / 2.0;
    } else if( dPos.x < 0 ){
        rot = Math.atan( dPos.y / dPos.x) + 3.14159;
    } else {
        rot = Math.atan( dPos.y / dPos.x);
    }
    return rot;
};

//

exports.Pos = Pos;
