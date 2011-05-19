var sys = require('sys');
var g = require("./global");
var main = require("./main");



// 目的地はいつも近くのpc
// pcと距離が2以内だったら攻撃
// 常にpcの方にむく
// hateはたまに更新
// まずxyから pitchを決めて進もうとし、前にブロックがあったらジャンプ、し続ける
// 穴があったら素直に落ちる
// 経路探索しない
function zombieMove( curTime ) {
    if( this.hate == undefined ) this.hate = null;
    if( ( this.counter % 10 ) == 0 ){
        var pcs = this.field.searchLatestNearPC( this.pos, 10, curTime - 1000 );
        if( pcs.length > 0 ){
            this.hate = pcs[0];
        } else {
            this.hate = null;
        }
    }

    var targetPos ;
    if( this.hate ){
        targetPos = new g.Vector3( this.hate.pos.x, this.hate.pos.y, this.hate.pos.z );
    } else {
        targetPos = new g.Vector3(2,2,2);
    }
    var diff = this.pos.diff( targetPos ) ;
        

    
    this.pitch = this.pos.getPitch( diff );

    if( this.pos.hDistance( targetPos ) < 1.0 ){
        this.vVel = 0;
        //        sys.puts( "zombie: enough near target!") ;
    } else {
        this.vVel = 1.0;
    }

    /////////////
    
    if( ( this.counter % 50 ) == 0 ){
        sys.puts("z: lastxyz:" + this.lastXOK + "," + this.lastZOK + " dy:" + this.dy );
        if( ( this.lastXOK == false || this.lastZOK == false ) && this.dy == 0 ){
            this.dy = 4.0;
            this.falling = true;
            sys.puts( "JJJJJJJJJJJJUMP!");
            main.nearcast( this.pos.ix(), this.pos.iy(), this.pos.iz(),
                           "jumpNotify",
                           this.id,// TODO
                           this.dy ); 
        }
    }

    if( this.dy != 0){
        sys.puts("z: falling: dy:"+this.dy + " vv:"+this.vVel + " y:" + this.pos.y );
    }

}

var defaultTick = 30; // ms

var actorID = 1;
function Actor( name, fld, pos ) {

    var d = new Date();

    this.typeName = name;
    this.lastMoveAt = d.getTime();
    this.lastSentAt = this.nextMoveAt = this.lastMoveAt + defaultTick;
    
    this.field = fld;
    this.pos = new g.Vector3( pos.x, pos.y, pos.z );

    this.speedPerSec = 0; // 1秒あたり何m進むか
    
    if(name=="zombie"){
        this.func = zombieMove;
        this.speedPerSec = 4.0;
    } else {
        this.func = null;
    }
    this.id = actorID + 1000000; 
    actorID++;

    this.counter = 0;


    // 以下、移動関連
    this.dy = 0;

    this.falling = false;
    this.pitch = 0.0;
    this.yaw = 0.0;
    this.hVel = 0.0;
    this.vVel = 0.0;
};
    
Actor.prototype.poll = function(curTime) {
        
    if( ( this.nextMoveAt >= curTime )  ) return;

    var dTime = ( curTime - this.lastMoveAt ) / 1000.0;
    this.lastMoveAt = curTime;
    this.nextMoveAt = curTime + defaultTick;
    
    // 挙動関数呼び出し
    if( this.func != null ){
        this.func.apply( this, [curTime]);
        this.counter ++;
    }
        

    // 物理的に動かす

    var dnose = new g.Vector3(0,0,0);
    var dside = new g.Vector3(0,0,0);

    dnose.x = 1.0 * Math.cos(this.pitch);
    dnose.y = 0; // サーバではyawは見ていない
    dnose.z = 1.0 * Math.sin(this.pitch);
    dside.x = 1.0 * Math.cos(this.pitch - Math.PI/2);
    dside.y = 0;
    dside.z = 1.0 * Math.sin(this.pitch - Math.PI/2);

    var dv = new g.Vector3( dnose.x * this.vVel  + dside.x * this.hVel,
                            0,
                            dnose.z * this.vVel  + dside.z * this.hVel );
                            
    this.vVel = this.hVel = 0;


    
    if(this.falling){
        this.dy -= 6.5 * dTime;
    }    

    if( this.pos.y < 0 ){
        this.pos.y = 0;
        this.dy = 0;
        falling = false;
    }
    dv.y = this.dy;

    var hoge = dv.mul( dTime * this.speedPerSec );
    var nextpos = this.pos.add( hoge );

    //    sys.puts("pos:" + this.id + ":"+ this.pos.x+","+this.pos.y+","+this.pos.z+" np:"+nextpos.x+","+nextpos.y+","+nextpos.z + " dt:"+dTime + " sp:" + this.speedPerSec + " pt:"+ this.pitch );


    
    var blkcur = this.field.get( this.pos.ix(), this.pos.iy(), this.pos.iz() );
    if( blkcur != null && blkcur != g.BlockType.AIR ){
        // 壁の中にいま、まさにうまってる
        nextpos.y += 1;
        this.falling = false;
        this.dy = 0;
    }

    var blkfound=false;
    var blkhity=999;
    for(var by=nextpos.iy();by>=0;by--){
        var b = this.field.get( this.pos.ix(), by, this.pos.iz() );
        if( b!=null && b != g.BlockType.AIR ){
            blkfound = true;
            blkhity =by;
            break;
        }
    }
    if( blkfound ){
        var pcy = nextpos.iy();
        if( blkhity < pcy ){
            //            if( this.falling == false ){
            //                sys.puts( "start falling!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! blkhity:"+blkhity+ " pcy:"+pcy);
            //            }
            this.falling = true;
        } else {
            //                        if( this.falling == true ){
            //                            sys.puts( "end   falling!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! blkhity:"+blkhity+ " pcy:"+pcy);
            //                        }
            nextpos.y = blkhity + 1;
            this.falling = false;
            this.dy =0 ;
        }
    }

    var blkn = this.field.get( nextpos.ix(), nextpos.iy(), nextpos.iz() );
    
    var x_ok = false;
    var y_ok = false;
    var z_ok = false;

    if( blkn == null || blkn == g.BlockType.AIR ){
        x_ok = y_ok = z_ok = true;
    } else {
        var np2 = new g.Vector3( this.pos.x, nextpos.y, this.pos.z );
        var blkcur2 = this.field.get( np2.ix(), np2.iy(), np2.iz() );
        if( blkcur2 != null && blkcur2 == g.BlockType.AIR ) y_ok = true;

        var np3 = new g.Vector3( this.pos.x, this.pos.y, nextpos.z );
        var blkcur3 = this.field.get( np3.ix(), np3.iy(), np3.iz() );
        if( blkcur3 != null && blkcur3 == g.BlockType.AIR ) z_ok = true;
    
        var np4 = new g.Vector3( nextpos.x, this.pos.y, this.pos.z );
        var blkcur4 = this.field.get( np4.ix(), np4.iy(), np4.iz() );
        if( blkcur4 != null && blkcur4 == g.BlockType.AIR ) x_ok = true;
    }
    var finalnextpos = this.pos;
    if( x_ok ) finalnextpos.x = nextpos.x;
    if( y_ok ) finalnextpos.y = nextpos.y;
    if( z_ok ) finalnextpos.z = nextpos.z;

    this.pos = finalnextpos;

    if(this.pos.x<0){ this.pos.x=0; x_ok=false; }
    if(this.pos.z<0){ this.pos.z=0; z_ok=false; }

    this.lastXOK = x_ok;
    this.lastYOK = y_ok;
    this.lastZOK = z_ok;
    
    

    
    // 送信. 落ちてる最中ではない場合は、あまり多く送らない
    var toSend = false;
    if( this.lastSentAt < (curTime-500) ) toSend = true;
    if( this.falling && this.dy != 0 && ( this.lastSentAt < ( curTime-50) ) ) toSend = true;
    if( toSend ){
        main.nearcast( this.pos.ix(), this.pos.iy(), this.pos.iz(),
                       "moveNotify",
                       this.id, 
                       this.pos.x,
                       this.pos.y,
                       this.pos.z,
                       this.speedPerSec,
                       this.pitch,
                       this.yaw,
                       this.dy,
                       (curTime - this.lastSentAt) / 1000.0 );
        this.lastSentAt = curTime;
    }

};

// すべて float 
Actor.prototype.setMove = function( x, y, z, pitch, yaw, dy, dt ) {
    this.yaw = yaw;
    this.pitch = pitch;
    
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;

    sys.puts("p x:"+x+ ","+y+","+z);
    // ポイントは、座標をセットするのではなく通常の物理挙動処理を使うこと。
    // そのためには、hVel, vVelを求める必要がある。
    // クライアントからのmoveのときにそれを受信し、ふつうに使う。
    
};
  


//


exports.Actor = Actor;

