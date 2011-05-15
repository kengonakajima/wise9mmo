var sys = require('sys');
var g = require("./global");




// 目的地はいつも近くのpc
// pcと距離が2以内だったら攻撃
// 常にpcの方にむく
// hateはたまに更新
// まずxyから pitchを決めて進もうとし、前にブロックがあったらジャンプ、し続ける
// 穴があったら素直に落ちる
// 経路探索しない
function zombieMove( curTime ) {
    if( this.hate == undefined ) this.hate = null;
    if( ( this.counter % 30 ) == 0 ){
        var pcs = this.field.searchLatestNearPC( this.pos, 10, curTime - 1000 );
        if( pcs.length > 0 ){
            this.hate = pcs[0];
        } else {
            this.hate = null;
        }
    }

    if( this.hate ){
        this.pitch = this.pos.getPitch( this.pos.diff( this.hate.pos ) );
    } 

    sys.puts( "zmb:" + this.id + ":"+ this.pos.x+","+this.pos.y+","+this.pos.z + " cnt:" + this.counter + " h:"+ this.hate + " pt:" + this.pitch );
}

var defaultTick = 30; // ms

var actorID = 1;
function Actor( name, fld, pos ) {

    var d = new Date();
    this.lastMoveAt = d.getTime();
    this.lastSentAt = this.nextMoveAt = this.lastMoveAt + defaultTick;
    
    this.field = fld;
    this.pos = pos;

    if(name=="zombie"){
        this.func = zombieMove;
    } else {
        this.func = null;
    }
    this.id = actorID;
    actorID++;

    this.counter = 0;


    // 以下、移動関連
    this.dy = 0;
    this.speedPerSec = 0; // 1秒あたり何m進むか
    this.falling = false;
    this.pitch = 0.0;
};
    
Actor.prototype.poll = function(curTime) {
        
    if( ( this.nextMoveAt >= curTime )  ) return;
        
    // 挙動関数呼び出し
    if( this.func != null ){
        this.func.apply( this, [curTime]);
        this.lastMoveAt = curTime;
        this.nextMoveAt = curTime + defaultTick;
        this.counter ++;
    }
        
    // 物理的に動かす

    // 送信. 落ちてる最中ではない場合は、あまり多く送らない
    if( this.lastSentAt < (curTime-500)){
        this.lastSentAt = curTime;
    }
};



//


exports.Actor = Actor;

