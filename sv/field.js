
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

    fld.fill( 0,0,0, hsize,vsize,hsize, g.BlockType.AIR ); // 世界を空気で満たす
    fld.fill( 0,0,0, hsize,1,hsize, g.BlockType.STONE ); // 地盤を置く
    fld.fill( 4,0,4, hsize,1,hsize, g.BlockType.WATER );   //水面

    var d = 20;
    fld.fill( 4,1,4, 8+d,2,8+d, g.BlockType.STONE );   // 高台を置く
    fld.fill( 5,2,5, 7+d,3,7+d, g.BlockType.SOIL );   // その上に水を置く
    fld.fill( 6,3,6, 6+d,4,6+d, g.BlockType.GRASS );   // その上に水を置く    
    fld.fill( 7,4,7, 5+d,5,5+d, g.BlockType.GRASS );   //
    
    fld.set( 8,5,8, g.ItemType.REDFLOWER );   //
    fld.set( 8,5,10, g.ItemType.BLUEFLOWER );   //

    // 木を4本
    fld.putTree(12,12);
    fld.putTree(17,12);
    fld.putTree(17,17);        
    fld.putTree(12,17);
    
    
    
    fld.fill( 53,1,53, 54,20,54, g.BlockType.LADDER );   // 

    // 山をいっぱいおく
    for(var i=0;i<40;i++){
        var mx = Math.floor(20 + Math.random() * hsize);
        var mz = Math.floor(20 + Math.random() * hsize);
        var msz = Math.floor(5 + Math.random() * 10);
        if(mx+msz>=hsize||mz+msz>=hsize)continue;
        var t;
        if( Math.random() < 0.5 ){
            t = g.BlockType.SOIL;
        } else {
            t = g.BlockType.STONE;
        }
        fld.putMountain( mx,0,mz, msz, t);
    }

    fld.fill( 9,15,9, 28,17,28, g.BlockType.SOIL ); // 土の天井

    // 後処理
    fld.growGrass();
    fld.recalcSunlight(0,0,hsize,hsize);
    fld.stats(30);

    fld.addMob( "zombie", new g.Pos(5,8,2) ); // 落ちてくる
    
    return fld;
};

exports.diggable = function(t){
    if( t == g.BlockType.STONE
        || t == g.BlockType.GRASS
        || t == g.BlockType.SOIL
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
    this.recalcSunlight( p.x-1,p.z-1,p.xx+1,p.z+1);
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
            for(var y=this.vSize-1;y>=0;y--){
                if( this.get(x,y,z) == g.BlockType.AIR ){
                    this.setSunlight(x,y,z,7);
                } else {
                    break;
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
};

// 明るさテーブルを取る0~7
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
                    if( this.blocks[ toIndex(x,y,z,this.hSize) ] == g.BlockType.AIR
                        || this.blocks[ toIndex(x,y,z,this.hSize) ] >= 100
                        ){
                        l = this.sunlight[ toIndex(x,y,z,this.hSize) ];
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
}
    
Field.prototype.poll = function(curTime){
    for( var k in this.actors ){
        var a = this.actors[k];
        if(a==null)continue;
        a.poll(curTime);        
    }
};

