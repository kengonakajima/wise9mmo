var sys = require('sys');
var g = require("./global");
var main = require("./main");


// デブリ
function debriMove( curTime ) {
    if( curTime > ( this.createdAt + 5000 ) ){
        var p = this.pos.toPos();
        this.field.runtimeSet( p, this.debriType );
        sys.puts( "debri fixed!");
        this.field.deleteActor( this.id );        
    }
};

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
        
    //    this.yaw = Math.random();
    
    this.pitch = this.pos.getPitch( diff );

    if( this.pos.hDistance( targetPos ) < 1.0 ){
        this.vVel = 0;
    } else {
        this.vVel = 1.0;
    }

    /////////////

    // 障害物あったらジャンプ
    if( ( this.counter % 50 ) == 0 ){
        //        sys.puts("z: lastxyz:" + this.lastXOK + "," + this.lastZOK + " dy:" + this.dy );
        if( ( this.lastXOK == false || this.lastZOK == false ) && this.dy == 0 ){
            this.dy = 4.0;
            this.falling = true;
            sys.puts( "zombie jump!");
            main.nearcast( this.pos,
                           "jumpNotify",
                           this.id,
                           this.dy ); 
        }
    }

    //    if( this.dy != 0) sys.puts("z: falling: dy:"+this.dy + " vv:"+this.vVel + " y:" + this.pos.y );

}

var defaultTick = 30; // ms

var actorID = 1;
function Actor( name, fld, pos ) {

    var d = new Date();

    this.typeName = name;
    this.createdAt = d.getTime();
    this.lastMoveAt = this.createdAt;
    this.lastSentAt = this.nextMoveAt = this.lastMoveAt + defaultTick;
    
    this.field = fld;
    this.pos = new g.Vector3( pos.x, pos.y, pos.z );

    this.speedPerSec = 0; // 1秒あたり何m進むか
    this.func = null;

    this.id = actorID + 1000; 
    actorID++;

    this.counter = 0;
    this.toSend = true;

    // 以下、移動関連
    this.dy = 0;

    this.falling = false;
    this.pitch = 0.0;
    this.yaw = 0.0;
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

    var dv = new g.Vector3( dnose.x * this.vVel,
                            0,
                            dnose.z * this.vVel );
                            
    this.vVel = 0;


    
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

    
    if( this.toPos != undefined && this.toPos != null ) {
        // 目的地が設定されてる場合は
        var toV = this.pos.diff(this.toPos);  // this.pos -> toPos
        if( toV.length() < 0.01 ){
            this.toPos = null;
        } else {
            //            sys.puts("to go: pos:" + this.pos.to_s() + " topos:" + this.toPos.to_s() + " tov:" + toV.to_s() + " toVd:" + toV.mul(dTime).to_s() + " ixyz:" + this.pos.ix() + ","+this.pos.iy() + "," + this.pos.iz()  + " dy:" + this.dy );

            toV = toV.normalized().mul(this.speedPerSec);

            nextpos = new g.Vector3( this.pos.x + toV.mul(dTime).x,
                                     this.pos.y + this.dy * dTime,
                                     this.pos.z + toV.mul(dTime).z );
            
            // 到達したらtoposを初期化
            var cursign = this.toPos.diffSign( this.pos );
            var nextsign = this.toPos.diffSign( nextpos );
            //            sys.puts( "cursign:" + cursign.to_s() + " nsign:"+ nextsign.to_s() );

            if( cursign.diff( nextsign ).equal( new g.Vector3(0,0,0)) == false ){
                nextpos = this.toPos;
                this.toPos = null;
                //                sys.puts( "goal! pos:" + this.pos.to_s() );
            }            
        }
    }


    // ポイントは、座標をセットするのではなく通常の物理挙動処理を使うこと。
    // そのためには、hVel, vVelを求める必要がある。
    // クライアントからのmoveのときにそれを受信し、ふつうに使う。
    
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
        //                if(this.typeName=="zombie") sys.puts( "pcy:" + pcy + " blkhity:" + blkhity  + " falling:" + this.falling );
        if( blkhity < pcy ){
            if( blkhity == (pcy-1) && (nextpos.y - nextpos.iy()) < 0.1 ){
                //      sys.puts( "nostart falling!");
            } else {
                //                sys.puts( "start falling!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! blkhity:"+blkhity+ " pcy:"+pcy);
                this.falling = true;
            }
        } else {
            // 落ち終わった。高速で落ちた場合はダメージ等の計算
            if( this.hitGroundFunc ) this.hitGroundFunc.apply( this, [this.dy] );
            //                            sys.puts( "end   falling!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! blkhity:"+blkhity+ " pcy:"+pcy);
            nextpos.y = blkhity + 1;
            this.falling = false;
            this.dy =0 ;
            
        }
    }

    var diffVec = this.pos.diff( nextpos );
    var bloopn = Math.floor(  diffVec.length() ) + 1;

    var x_ok = false;
    var y_ok = false;
    var z_ok = false;
    
    for( var bi = 0; bi < bloopn; bi++ ){
        var u = (bi + 1) / bloopn;

        var np = this.pos.mul(1-u).add( nextpos.mul(u));

        var blkn = this.field.get( np.ix(), np.iy(), np.iz() );

        

        if( blkn == null || blkn == g.BlockType.AIR ){
            // 通れる場合はループ継続
            x_ok = y_ok = z_ok = true;
            this.pos = np;
        } else {
            // 通れない場合はループ終わりで抜ける
            var np2 = new g.Vector3( this.pos.x, np.y, this.pos.z );
            var blkcur2 = this.field.get( np2.ix(), np2.iy(), np2.iz() );
            if( blkcur2 != null && blkcur2 == g.BlockType.AIR ) y_ok = true;

            var np3 = new g.Vector3( this.pos.x, this.pos.y, np.z );
            var blkcur3 = this.field.get( np3.ix(), np3.iy(), np3.iz() );
            if( blkcur3 != null && blkcur3 == g.BlockType.AIR ) z_ok = true;
    
            var np4 = new g.Vector3( np.x, this.pos.y, this.pos.z );
            var blkcur4 = this.field.get( np4.ix(), np4.iy(), np4.iz() );
            if( blkcur4 != null && blkcur4 == g.BlockType.AIR ) x_ok = true;

            var finalnextpos = this.pos;
            if( x_ok ) finalnextpos.x = np.x;
            if( y_ok ) finalnextpos.y = np.y;
            if( z_ok ) finalnextpos.z = np.z;

            this.pos = finalnextpos;
            break;
        }
    }

    if(this.pos.x<0){ this.pos.x=0; x_ok=false; }
    if(this.pos.z<0){ this.pos.z=0; z_ok=false; }

    this.lastXOK = x_ok;
    this.lastYOK = y_ok;
    this.lastZOK = z_ok;
    
    

    
    // 送信. 落ちてる最中ではない場合は、あまり多く送らない
    var toSend = false;
    if( this.toSend ){
        toSend = true;
    }
    if( this.lastSentAt < (curTime-500) ) toSend = true;
    if( this.falling && this.dy != 0 && ( this.lastSentAt < ( curTime-50) ) ) toSend = true;

    if( toSend ){

        main.nearcast( this.pos,
                       "moveNotify",
                       this.id,
                       this.typeName,
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

// args: すべて float 
Actor.prototype.setMove = function( x, y, z, pitch, yaw ) {
    this.yaw = yaw;
    this.pitch = pitch;
    var v = new g.Vector3(x,y,z);
    if( this.pos.equal(v) == false ){
        this.toPos = v;
    }
};
// dy: float
Actor.prototype.jump = function( dy ) {
    this.dy = dy;
    main.nearcast( this.pos, "jumpNotify", this.id, dy);    
};

// dmg:整数
// attacker:actor
Actor.prototype.attacked = function( dmg, attacker ) {

    var dv = attacker.pos.diff( this.pos );
    sys.puts( "dv:" + dv.to_s());
    this.knockBack(dv.mul(4));
};

Actor.prototype.knockBack = function( v ) {
    this.setMove( this.pos.x + v.x,
                  this.pos.y,
                  this.pos.z + v.z,
                  this.pitch,
                  this.yaw );
    this.jump(4);
    main.nearcast( this.pos, "jumpNotify", this.id, this.dy );
    
};

// 球の衝突判定.当たったactorすべての配列を返す
Actor.prototype.collide = function( dia ) {
    var ret = new Array();
    for(var k in this.field.actors ) {
        var a = this.field.actors[k];
        if(!a)continue;
        var d = a.pos.diff( this.pos).length();
        sys.puts("d:"+d + " " + a.typeName );
        if( a != null && d < dia && a != this ){
            ret.push(a);
        }
    }
    return ret;
};

// PC

function pcHitGround(dy) {
    if( dy < -4 ){
        var dmg = Math.round( ( dy + 4 ) / 2 ); // 負の値
        if( dmg != 0 ){
            this.hp += dmg;
            sys.puts( "fall damage! me: " + this.typeName + " dy:" + dmg );
            main.nearcast( this.pos, "statusChange", this.id, this.hp );
        }
    }
};

function PlayerCharacter( name, fld, pos ) {
    var pc = new Actor( "pc", fld, pos);
    pc.playerName = name;
    pc.hp = 10;
    pc.hitGroundFunc = pcHitGround;
    pc.speedPerSec = g.PlayerSpeed;
    return pc;
};
function Mob( name, fld, pos ) {
    var m = new Actor(name,fld,pos);
    if(name=="zombie"){
        m.func = zombieMove;
        m.speedPerSec = 2.0;
    } 
    return m;
};
function Debri( t, fld, pos ) {
    var n = g.BlockTypeToString(t);
    if( n==null )throw "invalid block type:"+t;    
    var d = new Actor( n + "_debri",fld,pos);
    d.func = debriMove;
    d.speedPerSec = 0;
    d.debriType = t;
    return d;
};

function bulletMove( curTime ) {
    sys.puts("bmove. pos:" + this.pos.to_s() );
    this.vVel = 1;
    var hit = false;

    var col = this.collide( 1 );　
    for( var i in col ){
        var a = col[i];
        if( a == this.shooter ) continue;
        sys.puts( "collide:" + a.typeName + " d:" + this.pos.diff( a.pos ).length() );
        a.attacked( this.damage, this );
        
    }
    
    if( this.pos.diff( this.origPos ).length() > this.distanceToLive || hit ){
        sys.puts( "bullet: delete");
        this.field.deleteActor( this.id );
    }
};

// speed: (m/sec)
// dtl: distance to live. (m)
function Bullet( tname, fld, pos, shooter, pitch, yaw, speed, dtl, damage ) {

    var v = new g.Vector3( Math.cos(pitch), yaw, Math.sin(pitch) );

    var b = new Actor( "bullet", fld, pos.add( v.normalized()) );

    b.falling = true;
    b.pitch = pitch;
    b.yaw = yaw;

    b.dy = v.y * speed;
    b.speedPerSec = speed;
    b.origPos = pos;
    b.distanceToLive = dtl;
    b.damage = damage;
    b.shooter = shooter;
    b.direction = v.normalized();
    b.func = bulletMove;

    if( tname=="hidden"){ // 透明で見えないフラグ
        b.toSend = false;
    }
    
    return b;    
};

// tname : "hidden"だとmove送らない
Actor.prototype.shoot = function( tname, speed, dtl, damage ) {
    var b = new Bullet( tname, this.field, this.pos, this, this.pitch, this.yaw, speed, dtl, damage );
    this.field.addActor(b);
    return b;
};

exports.Actor = Actor;
exports.Mob = Mob;
exports.Debri = Debri;
exports.Bullet = Bullet;
exports.PlayerCharacter = PlayerCharacter;
