/*
  wise9 連載MMOG サーバー
*/



// 必要なモジュールをロードする
var sys = require('sys');
var net = require('net');
var fs = require('fs');

var g = require('./global');
var modField = require("./field");



// グローバル変数
var sockets = new Array();
var functions = {};


var fld = modField.generate( 64, 64 );



function globalNearcast(pos,except,args) {
    var json = makeJson( args );
    
    for(var addr in sockets ){
        var sk = sockets[addr];
        
        if( except != null && sk == except ) continue;
        if( sk.pc == undefined ){
            //            sys.puts( "sk:"+ sk.addrString + " dont have position");            
            continue;
        }

        var dx = pos.x-sk.pc.pos.x;
        var dz = pos.z-sk.pc.pos.z;
        
        var distance = (dx*dx)+(dz*dz);
        if( distance< (200*200)){
            try {
                sk.write(json+"\n");
            } catch(e){
                sys.puts( "nearcast: exception:"+e);
                delete sockets[ sk.clientID ];
            }
        } else {
            sys.puts( "too far:"+ sk.addrString + " id:"+ sk.clientID + " pos:" + pos.to_s() );            
        }
    }    
};

// pos, fname, arg0, arg1, ..
exports.nearcast = function () {
    if( arguments.length < 2 ) throw "inval"; // 
    var args = [];
    for(var i= 1; i< arguments.length;i++){
        args[i-1] = arguments[i];
    }
    globalNearcast( arguments[0],
                    null, // except
                    args );
                    
}
    

// RPC 関数定義
function echo( a, b, c ) {
    //    sys.puts( "echo: abc:"+a+","+b+","+c);
    this.send( "echo", a,b,c);    
}

function delayed(a,b,c){
    sys.puts( "delayed: abc:"+a+","+b+","+c);
    setTimeout( function(sock) {
        sock.send( "delayed", a,b,c);    
    }, 1000, this  );    
}
function move(x,y,z,sp,pitch,yaw,dt){

    //    sys.puts( "move: xyzpyvy:"+x+","+y+","+z+","+pitch+","+yaw+","+velY+","+","+dt + "  cur:" + this.pc.pos.to_s() );

    this.pc.setMove( x, y, z, pitch, yaw );
    fld.updatePC( this.pc.id, x, y, z );

    //    g.sleep(Math.random() * 100 );

}
function jump(velY){
    this.pc.jump( velY *1.3 );     // ghostが登れないことを防ぐため
}

function getField(x0,y0,z0,x1,y1,z1){
    if(this.gfcnt==undefined)this.gfcnt=0;else this.gfcnt++;
    //            sys.puts( "getField: cnt:"+this.gfcnt+":"+x0+","+y0+","+z0+","+x1+","+y1+","+z1);
    var blkary = fld.getBlockBox(x0,y0,z0,x1,y1,z1);
    var lgtary = fld.getLightBox(x0,y0,z0,x1,y1,z1);
    if(blkary==null||lgtary==null){
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,[], [] );
    } else {
        var brl = g.runLength(blkary);
        var lrl = g.runLength(lgtary);
        //        sys.puts( "f:" + brl );
        //        sys.puts( "l:" + lrl );        
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,brl,lrl);
    }
}
function dig(x,y,z){
    var v = new g.Vector3(x,y,z);
    var d = v.distance( this.pc.pos );
    sys.puts("dig:"+x+","+y+","+z + " d:" + d );
    if( d > 8 ) return;

    var putDebri  =true;
    
    var b = fld.get(x,y,z);
    if( b != null && modField.diggable(b) ){
        if( b == g.BlockType.STONE || b == g.BlockType.SOIL || b == g.BlockType.GRASS ){
            if( this.pc.pickaxeLeft <= 0 ){
                sys.puts( "pickaxe not enough" );
                return;
            } else {
                sys.puts( "digged. pkxe left:", this.pc.pickaxeLeft );
                this.pc.pickaxeLeft --;
            }
        }
        if( b == g.BlockType.STEM || b == g.BlockType.LEAF ){
            if( this.pc.axeLeft <= 0 ){
                sys.puts( "axe not enough");
                return;
            } else {
                this.pc.axeLeft --;
            }
            if( b == g.BlockType.LEAF ){ putDebri = false; }
        }
        if( b == g.BlockType.WATER ){
            if( this.pc.bucketLeft <= 0 ){
                sys.puts( "bucket not enough" );
                return;
            } else if( this.pc.waterLeft < 10 ){
                this.pc.bucketLeft --;
                putDebri = false;
                this.pc.waterLeft ++;
            } else {
                return;
            }
        }
            
        var prev = fld.set( x,y,z, g.BlockType.AIR);
        if(prev==g.BlockType.GRASS ) prev = g.BlockType.SOIL;
        fld.recalcSunlight( x-1,z-1,x+1,z+1);
        this.nearcast( "changeFieldNotify", x,y,z);

        if( putDebri ){
            fld.addDebri( prev, new g.Vector3(x+0.5,y+0.5,z+0.5));
        }
        sys.puts("digged.");

        this.pc.sendToolState();
    }    
}


// あいてる場所になにかおく
function put(x,y,z,tname){
    sys.puts("put:"+x+","+y+","+z+","+tname);
    var b = fld.get(x,y,z);

    var t = g.ItemType[tname];
    if( t == undefined || t == null ){
        sys.puts("invalid tname");
        return;
    }
    sys.puts( "t:" + t + " to:"+typeof(t));
    
    if( b != null && b == g.BlockType.AIR ){
        fld.set( x,y,z, g.ItemType[tname] );
        this.nearcast( "changeFieldNotify", x,y,z);
        sys.puts("put.");
        fld.stats(30);
    } else {
        sys.puts("invalid put");
    }
}

function shoot() {
    sys.puts("shoot");
    if( this.pc.bowLeft > 0 ){
        this.pc.bowLeft --;
        this.pc.shoot( "arrow", 30, 2, 2, 4 );
        this.pc.sendToolState();
    }
}

function putTorch(x,y,z) {
    if( this.pc.torchLeft >= 1 ){
        this.pc.torchLeft --;
        this.pc.sendToolState();
        fld.runtimeSet( new g.Vector3(x,y,z), g.ItemType.TORCH );
        sys.puts( "puttorch:" + x  + "," + y + "," + z );
        var d = new Date();
        var curTime = d.getTime();                                  
        fld.registerTorch(x,y,z,curTime);        
    }
}

function putDebri(x,y,z,t){
    
    if( t == g.BlockType.STONE ){
        if( this.pc.stoneLeft > 0 ){
            this.pc.stoneLeft --;
            fld.runtimeSet( new g.Vector3(x,y,z), t );
        }        
    } else if( t == g.BlockType.SOIL ){
        if( this.pc.soilLeft > 0 ){
            this.pc.soilLeft --;
            fld.runtimeSet( new g.Vector3(x,y,z), t );
        }
    } else if( t == g.BlockType.WATER ){
        if( this.pc.waterLeft > 0 ){
            this.pc.waterLeft --;
            fld.runtimeSet( new g.Vector3(x,y,z), t );
        }
    } else if( t == g.BlockType.STEM ){
        if( this.pc.stemLeft > 0 ){
            this.pc.stemLeft --;
            fld.runtimeSet( new g.Vector3(x,y,z), t );
        }
    }


    this.pc.sendToolState();
    
}


function chat(txt) {
    sys.puts("chat:"+txt);
    if( txt == "debri" ){
        fld.addDebri( g.BlockType.STONE, this.pc.pos );
        return;
    } else if( txt == "set" ) {
        //        fld.runtimeSet( this.pc.pos.toPos(), g.BlockType.STONE);
        var v = this.pc.pos.toPos();
        fld.set( v.x, v.y, v.z, g.BlockType.STONE);
        return;
    } else if( txt == "arrow" ) {
        this.pc.shoot( "arrow", 15, 5, 2, 4 );
        return;
    }

    this.nearcastIncludeSelf( "chatNotify", this.clientID, txt );
}


function login() {
  sys.puts( "login" );
  var p = new g.Pos( 2,15,2 ); // 初期位置

  this.pc = fld.addPC( "guest", p, this );
  this.pc.conn = this;

  this.send( "loginResult", this.pc.id, p.x, p.y, p.z, g.PlayerForce );
  this.pc.sendStatus();

}





// 関数登録
function addRPC( name, f ) {
    functions[name]=f;
}

function makeJson( args ){

    var v={};
    v["method"] = args[0];
    var params=[];
    for(var i=1;i<args.length;i++){
        params.push( args[i] );
    }
    v["params"] = params;
    return JSON.stringify(v);
}

// 共用の送信関数
net.Socket.prototype.send = function() {
    if( arguments.length < 1 )return;

    var json = makeJson( arguments );

    try {
        //        sys.puts( "sending:"+json);
        this.write(json+"\n");
    } catch(e){
        sys.puts( "send: exception: "+e );
    }
};

net.Socket.prototype.nearcast = function() {
    if( arguments.length < 1 )return;
    if( this.pc ) globalNearcast( this.pc.pos, this, arguments );
};

net.Socket.prototype.nearcastIncludeSelf = function() {
    if( arguments.length < 1 )return;
    if( this.pc ) globalNearcast( this.pc.pos, null, arguments );
};


var g_cliIDcounter=0;

// nodeサーバ本体
var server = net.createServer(function (socket) {
    socket.setEncoding("utf8");

    // 新しい接続を受けいれたときのコールバック関数
    socket.addListener("connect", function () {
        sys.puts("connect\n");
        this.addrString = this.remoteAddress + ":" + this.remotePort;
        this.clientID = g_cliIDcounter++;
        sockets[this.clientID] = this;
    });

    // データが来たときのコールバック関数
    socket.addListener("data", function (data) {
        if( data.match( /^<policy-file-request/ ) ){
            sys.puts( "policy file requested\n");
            socket.write( "<?xml version=\"1.0\"?><cross-domain-policy><allow-access-from domain=\"*\" to-ports=\"*\" secure=\"false\" /></cross-domain-policy>\n" );
            return;
        }


        // データ行を文字列分割してJSON解析. TODO: 改行の後に次のコマンドが中途半端に続いている場合、取り逃すはず。
        var ary = data.split("\n");
        for(var i=0;i<ary.length;i++){
            var line = ary[i];
            if( line==""){continue;}
            try{
                var decoded = JSON.parse(line);
            }catch(e){
                socket.send( "error", "invalid line:'"+line+"'");
                continue;
            }
            if( decoded.method == null || decoded.params == null ){
                socket.send( "error", "invalid json", "line:"+line );
                sys.print( "error string:" + line );
                return;
            }
            
            // 公開してる関数を呼びだす
            var f = functions[decoded.method];
            if( f == null ){
                socket.send( "error", "func not found", "name:" + decoded.method );
                return;
            }
            //            try {
                f.apply( socket, decoded.params );
                //            } catch(e){
                //                socket.send( "error", "exception in rpc", "line:"+line+ "e:"+e );
                //                sys.print( "exception in rpc. string:" + line+ "e:"+e );
                //                return;
                //            }
        }
        
    });
        
    // ソケットが切断したときのコールバック
    socket.addListener("end", function () {
            if( socket.pc ){

                socket.pc.onDie();
                fld.deleteActor( socket.pc.id );
                delete sockets[ socket.pc.id ];
            }
            sys.puts( "end. socknum:" + sockets.length);
        });

    // エラーが起きたときのコールバック(SIGPIPEとか)
    socket.addListener("error", function () {
        sys.puts( "error. socknum:" + sockets.length);
    });
});


// RPC関数を登録
addRPC( "login", login );
addRPC( "echo", echo );

//addRPC( "delayed", delayed );
addRPC( "move", move );
addRPC( "getField", getField );
addRPC( "dig", dig );
addRPC( "jump", jump );
addRPC( "put", put );
addRPC( "shoot", shoot );
addRPC( "chat", chat );
addRPC( "putTorch", putTorch );
addRPC( "putDebri", putDebri );

server.listen(7000, "127.0.0.1");


// NPC動かすloop
var loopCounter = 0;

setInterval( function() {
        var d = new Date();
        var curTime = d.getTime();

        fld.poll(curTime );
        
        loopCounter++;        
    }, 1 );

setInterval( function() {
        sys.puts( "loop:" + loopCounter );
    }, 10000 );

var ary = new Array( 0,0,0, 1,1,1,1,1,1, 2,2,2,2,2, 3,4,5,5,5,5,6,6 );
var rl = g.runLength(ary);
sys.puts( "RLtest:" + rl );




//sys.puts( "hoge:" + g.BlockType.include(1));

