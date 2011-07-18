
var sys = require('sys');
var g = require('./global');
var modActor = require('./actor');
var main = require("./main.js");

function Field( hsize, vsize ) {
    this.hSize = hsize;
    this.vSize = vsize;

    this.blocks = new Array( hsize * hsize * vsize );
    this.sunlight = new Array( hsize * hsize * vsize );

    this.pcs = {};
    this.actors = {};    
}

function toIndex( x,y,z, hs ){
    return x + z* hs + y * hs * hs; 
}


// 軸ごとのサイズ。 east-west size, north-south size, high-low size 
exports.generate = function( hsize, vsize ) {
    var fld = new Field( hsize, vsize );

    var groundLevel = Math.floor( vsize * 0.2 );
    fld.fill( 0,0,0, hsize,vsize,hsize, g.BlockType.AIR ); // 世界を空気で満たす
    fld.fill( 0,0,0, hsize,1,hsize, g.BlockType.STONE ); // 地盤を置く
    fld.fill( 0,1,0, hsize,groundLevel,hsize, g.BlockType.WATER );   //海

    sys.puts( "groundLevel:" + groundLevel );
    fld.fill( 0,0,0, 7,groundLevel+1,7, g.BlockType.SOIL ); // すたーとちてん
    
    
    var d = 20;
    fld.fill( 4,1,4, 8+d,groundLevel+1,8+d, g.BlockType.STONE );   // 高台を置く
    fld.fill( 5,2,5, 7+d,groundLevel+2,7+d, g.BlockType.SOIL );   
    fld.fill( 6,3,6, 6+d,groundLevel+3,6+d, g.BlockType.GRASS );  
    fld.fill( 7,4,7, 5+d,groundLevel+4,5+d, g.BlockType.GRASS );  
    
    fld.set( 8,groundLevel+4,8, g.ItemType.REDFLOWER );   //
    fld.set( 8,groundLevel+4,10, g.ItemType.BLUEFLOWER );   //
    fld.set( 10,groundLevel+4,11, g.ItemType.TORCH );
    fld.set( 14,groundLevel+4,14, g.ItemType.TORCH );    

    // 木を4本
    fld.putTree(12,12);
    fld.putTree(17,12);
    fld.putTree(17,17);        
    fld.putTree(12,17);
    


    // 山をいっぱいおく
    for(var i=0;i<40;i++){
        var mx = Math.floor(20 + Math.random() * hsize);
        var my = Math.floor(0 + Math.random() * groundLevel);
        var mz = Math.floor(20 + Math.random() * hsize);
        var msz = Math.floor(5 + Math.random() * 10);
        if(mx+msz>=hsize||mz+msz>=hsize)continue;
        var t;
        if( Math.random() < 0.5 ){
            t = g.BlockType.SOIL;
        } else {
            t = g.BlockType.STONE;
        }
        fld.putMountain( mx,my,mz, msz, t);
    }

    fld.fill( 9,groundLevel+15,9, 28,groundLevel+17,28, g.BlockType.SOIL ); // 土の天井

    // 後処理
    fld.growGrass();
    fld.recalcSunlight(0,0,hsize,hsize);
    fld.stats(30);

    fld.addMob( "zombie", new g.Pos(5,groundLevel+8,2) ); // 落ちてくる
    
    return fld;
};

exports.diggable = function(t){
    if( t == g.BlockType.STONE
        || t == g.BlockType.GRASS
        || t == g.BlockType.SOIL
        || t == g.BlockType.WATER
        || t == g.BlockType.STEM        
        || t == g.BlockType.LEAF
        ){
        return true;
    } else {
        return false;
    }
};



    
// yが高さ方向, zが奥行き xが左右

Field.prototype.fill = function( x0,y0,z0, x1,y1,z1, t ) {
    for(var x=x0; x < x1; x ++ ){
        for(var y=y0; y < y1; y++ ){
            for(var z=z0; z < z1; z++ ){
                this.blocks[ toIndex(x,y,z, this.hSize) ] = t;
            }
        }
    }
};
    


Field.prototype.stats = function( h) {
    var counts = new Array(200);
    var ycounts = new Array( this.vSize );
    var ylcounts = new Array( this.vSize );
    for(var i=0;i<counts.length;i++){counts[i]=0;}
    for(var i=0;i<ycounts.length;i++){ycounts[i]=new Array(200);  for(var j=0;j<200;j++){ ycounts[i][j]=0;}}
    for(var i=0;i<ylcounts.length;i++){ylcounts[i]=new Array(16);  for(var j=0;j<16;j++){ ylcounts[i][j]=0;}}    
    
    for(var x=0; x < this.hSize; x ++ ){
        for(var y=0; y < this.vSize; y++ ){
            for(var z=0; z < this.hSize; z++ ){
//                sys.puts( ""+x+y+z+":"+this.blocks[ toIndex( x,y,z, this.hSize ) ]  );
                counts[ this.blocks[ toIndex( x,y,z, this.hSize ) ] ] ++;
                ycounts[y][ this.blocks[ toIndex( x,y,z, this.hSize ) ] ] ++;
                ylcounts[y][ this.sunlight[ toIndex( x,y,z, this.hSize ) ] ] ++;
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
        s += "|";
        for(var j=0;j<ylcounts[y].length;j++){
            if( ylcounts[y][j]>0) s += " "+ j + ":" + ylcounts[y][j];
        }
        sys.puts(s);
    }
};


Field.prototype.get = function(x,y,z){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return null;
    return this.blocks[ toIndex( x,y,z,this.hSize) ];
};
Field.prototype.getSunlight = function(x,y,z){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return null;
    var i=toIndex( x,y,z,this.hSize);
    return this.sunlight[i];
};

Field.prototype.set = function(x,y,z,t){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return;
    var prev = this.get(x,y,z);
    this.blocks[ toIndex( x,y,z,this.hSize) ] = t;
    return prev;        
};

Field.prototype.runtimeSet = function(p,t){
    this.set( p.x, p.y, p.z, t );
    this.recalcSunlight( p.x-8,p.z-8,p.x+8,p.z+8);
    main.nearcast( p, "changeFieldNotify", p.x,p.y,p.z);
};

Field.prototype.setSunlight = function(x,y,z,t){
    if( x<0||y<0||z<0||x>this.hSize||y>this.vSize||z>this.hSize)return;
    this.sunlight[ toIndex( x,y,z,this.hSize) ] = t;
};

Field.prototype.putTree = function(x,z) {
    var y=-1;
    for(var by=this.vSize-1;by>=0;by--){
        if( this.get(x,by,z) != g.BlockType.AIR ){
            y=by;
            break;
        }
    }
    if(y==-1)return;
    
    for(var ix=-1;ix<=1;ix++){
        for(var iy=-1;iy<=1;iy++){
            for(var iz=-1;iz<=1;iz++){
                this.set(x+ix,y+3+iy,z+iz, g.BlockType.LEAF);
            }
        }
    }
    this.set(x,y,z, g.BlockType.STEM);
    this.set(x,y+1,z, g.BlockType.STEM);
    this.set(x,y+2,z, g.BlockType.STEM);
};


//まるい山つくる
Field.prototype.putMountain = function(basex,basey,basez,sz,t) {
    var xbase=0;
    for(var y=basey;y<=basey+sz;y++){
        for(var x=basex-sz;x<=basex+sz;x++){
            for(var z=basez-sz;z<=basez+sz;z++){
                var dz = ( z - basez );
                var dy = ( y - basey );
                var dx = ( x - basex );
                var dia = dz*dz + dy*dy + dx*dx;
                if( dia < (sz*sz) ){
                    this.set(x,y,z,t);
                }
            }
        }
    }    
};

//くさはやす
Field.prototype.growGrass = function() {
    for(var x=0;x<this.hSize;x++){
        for(var z=0;z<this.hSize;z++){
            for(var y=this.vSize-1;y>=0;y--){
                if( this.get(x,y,z) == g.BlockType.SOIL ){
                    this.set(x,y,z,g.BlockType.GRASS );
                    break;
                }
            }
        }
    }
};

// 日当たり計算
// 0初期化→上からレベル7→7回まわして1づつ減らす
Field.prototype.recalcSunlight = function(x0,z0,x1,z1) {
    sys.puts("set0");
    for(var y=0;y<this.vSize;y++){
        for(var x=x0;x<x1;x++){
            for(var z=z0;z<z1;z++){
                this.sunlight[ toIndex(x,y,z,this.hSize)]=0;
            }
        }
    }
    sys.puts("set7");
    for(var x=x0;x<x1;x++){
        for(var z=z0;z<z1;z++){
            var cur=7;
            for(var y=this.vSize-1;y>=0;y--){
                var t = this.get(x,y,z);
                if( t == g.BlockType.AIR ){
                    this.setSunlight(x,y,z,cur);
                    continue;
                }
                if( t == g.BlockType.WATER ){
                    cur--;
                    if(cur<1)cur=1;
                    this.setSunlight(x,y,z,cur);                    
                    continue;
                }
                break;
            }
        }
    }

    // torchは7
    for(var x=x0;x<x1;x++){
        for(var z=z0;z<z1;z++){
            for(var y=0;y<this.vSize;y++){
                var cb = this.get(x,y,z);
                if( cb == g.ItemType.TORCH ) {
                    sys.puts( "tor");
                    this.setSunlight( x,y,z, 7);
                }
            }
        }
    }
    
    for(var l=0;l<7;l++){
        sys.puts("loop " +l);
        for(var x=x0;x<x1;x++){
            for(var z=z0;z<z1;z++){
                for(var y=0;y<this.vSize;y++){
                    var cb = this.get(x,y,z);
                    if( cb != g.BlockType.AIR
                        && cb != g.ItemType.REDFLOWER
                        && cb != g.ItemType.BLUEFLOWER
                        && cb != g.ItemType.TORCH
                        && cb != g.BlockType.WATER
                        ){
                        this.setSunlight(x,y,z,0);
                        continue;
                    }
                    //  if( this.get(x,y,z) != g.BlockType.AIR )continue;
                    var curlv=this.getSunlight(x,y,z);
                    var sz0 = this.getSunlight(x,y,z-1);
                    var sz1 = this.getSunlight(x,y,z+1);
                    var sx0 = this.getSunlight(x-1,y,z);
                    var sx1 = this.getSunlight(x+1,y,z);
                    var sy0 = this.getSunlight(x,y-1,z);
                    var sy1 = this.getSunlight(x,y+1,z);
                    if( sz0 != null && sz0>(curlv+1)) curlv++;
                    if( sz1 != null && sz1>(curlv+1)) curlv++;
                    if( sx0 != null && sx0>(curlv+1)) curlv++;
                    if( sx1 != null && sx1>(curlv+1)) curlv++;
                    if( sy0 != null && sy0>(curlv+1)) curlv++;
                    if( sy1 != null && sy1>(curlv+1)) curlv++;
                    this.setSunlight(x,y,z,curlv);
                }
            }
        }
    }
};
    
    
    
// 大きい一部取る
// x1は含まない (0,0,0)-(1,1,1)は１セル分
Field.prototype.getBlockBox = function(x0,y0,z0,x1,y1,z1) {
    if( x0<0||y0<0||z0<0||x0>this.hSize||y0>this.vSize||z0>this.hSize
        ||x1<0||y1<0||z1<0||x1>this.hSize||y1>this.vSize||z1>this.hSize){
        return null;
    }
    // 水の描画のためにはみでた分も必要
    var out = new Array( (x1-x0+2) * (y1-y0+2) * (z1-z0+2) );
    var i=0;
    var nonair=0;
    for(var y=y0-1; y < y1+1; y++ ){
        for(var z=z0-1; z < z1+1; z++ ) {
            for(var x=x0-1; x < x1+1; x ++ ){
                var t = this.blocks[ toIndex(x,y,z,this.hSize) ];
                if(t==null)t=g.BlockType.AIR;
                out[i] = t;
                if( t != g.BlockType.AIR ){ nonair ++; }
                i++;
            }
        }
    }

    if(nonair==0){
        return null;
    } else {
        return out;
    }
};

// 明るさテーブルを取る1~8
// ブロックがあるところ=1
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
                    l=0;
                } else {
                    var t = this.blocks[ toIndex(x,y,z,this.hSize) ];
                    if( t == g.BlockType.AIR
                        || t >= 100  // item
                        || t == g.BlockType.WATER 
                        ){
                        l = this.sunlight[ toIndex(x,y,z,this.hSize) ] + 1;
                    } else {
                        l = 0;
                    }
                }
                out[i]=l;
                i++;
            }
        }
    }
    return out;                
};

// PCの位置を記録する
Field.prototype.updatePC = function( id, x,y,z ) {
    if( x>this.hSize || z >this.hSize || y > this.vSize ) throw "coord error:"+x+","+y+","+z;
    var d = new Date();
    this.pcs[id] = { "id":id, "pos": new g.Pos(x,y,z), "at":d.getTime() };
    
};
Field.prototype.deleteActor = function( id ){
    sys.puts( "delete actor. id:" + id );
    var a = this.actors[id];
    
    main.nearcast( a.pos, "disappear", id );
    this.pcs[id]=null;
    this.actors[id]=null;
};

// PCを探して配列を返す
Field.prototype.searchLatestNearPC = function ( pos, dia, thresTime ) {
    var out=[];
    for( var pcid in this.pcs ) {
        var pc = this.pcs[pcid];
        if(pc!=null){
            var d = pc.pos.distance(pos);
            //            sys.puts( "d:" + d + " dia:"+dia + " id:"+pcid + " x:" + pc.pos.x + " y:"+pc.pos.y + " z:" + pc.pos.z );
            if( d < dia ) out.push(pc);
        }
    }
    return out;
};



///////////////////////////////
// Actor
/////////////////////////////


Field.prototype.addActor = function(act) {
    this.actors[act.id] = act;
};

// 敵を1体出す
Field.prototype.addMob = function(name, pos) {
    var act = new modActor.Mob(name, this, pos );
    this.addActor(act);
    return act;
};
// 壊れたブロック
Field.prototype.addDebri = function(t, pos ) {
    var act = new modActor.Debri(t,this,pos);
    this.addActor(act);
    return act;
};
    

Field.prototype.addPC = function(name,pos,sock) {
    var pc = new modActor.PlayerCharacter(name,this,pos);
    
    //    var act = new modActor.Actor("pc",this,pos);
    //    act.playerName = name;
    //    act.hp = 10;
    //    act.hitGroundFunc = pcHitGround;
    this.addActor(pc);
    return pc;
};

Field.prototype.findActor = function(id) {
    return this.actors[id];
};


Field.prototype.poll = function(curTime){
    for( var k in this.actors ){
        var a = this.actors[k];
        if(a==null)continue;
        a.poll(curTime);        
    }

    this.pollTorches(curTime);
    
};

// たいまつを登録しておいて時間が来たら消す
Field.prototype.registerTorch = function(x,y,z,tm) {
    if(this.torches==undefined ){
        this.torches = new Array();
    }
    this.torches.push( new Array( new g.Vector3(x,y,z),tm) );
};

Field.prototype.pollTorches = function( curTime) {
    for(var k in this.torches ){
        var t = this.torches[k];
        if(t==null)continue;
        var v = t[0];
        var tm = t[1];
        if( curTime > ( tm + 60000 ) ){
            this.runtimeSet( v, g.BlockType.AIR );
            this.torches[k]=null;
            sys.puts( "torch out" );
        }
    }
};
    
    /*
      
    if( this.fieldPollCnt == undefined ){
        this.fieldPollCnt = 0;
    }
    this.fieldPollCnt ++;
    var unitVnum = this.vSize / 8; // 128だったら16
    var unitHnum = this.hSize / 8; // 64だったら8
    var unitnum = unitVnum * unitHnum * unitHnum;
    var x = this.fieldPollCnt % unitHnum;    
    var y = Math.floor( this.fieldPollCnt / unitHnum / unitHnum ) % unitVnum;
    var z = Math.floor( this.fieldPollCnt / unitHnum ) % unitHnum;

    this.pollVoxel( x * unitHnum, y * unitVnum, z * unitHnum, unitHnum, unitVnum, unitHnum )
    */
