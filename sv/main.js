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
function move(x,y,z,sp,pitch,yaw,dy,dt){

    //    sys.puts( "move: xyzpydy:"+x+","+y+","+z+","+pitch+","+yaw+","+dy+","+","+dt + "  cur:" + this.pc.pos.to_s() );

    this.pc.setMove( x, y, z, pitch, yaw );
    fld.updatePC( this.pc.id, x, y, z );

    //    g.sleep(Math.random() * 100 );

}
function jump(dy){
    this.pc.jump( dy );    
}

function getField(x0,y0,z0,x1,y1,z1){
    if(this.gfcnt==undefined)this.gfcnt=0;else this.gfcnt++;
    //    sys.puts( "getField: cnt:"+this.gfcnt+":"+x0+","+y0+","+z0+","+x1+","+y1+","+z1);
    var blkary = fld.getBlockBox(x0,y0,z0,x1,y1,z1);
    var lgtary = fld.getLightBox(x0,y0,z0,x1,y1,z1);
    if(blkary==null||lgtary==null){
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,[], [] );
    } else {
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,blkary,lgtary );
    }
}
function dig(x,y,z){
    sys.puts("dig:"+x+","+y+","+z);
    // todo: 無条件に受けいれてる
    var b = fld.get(x,y,z);
    if( b != null && modField.diggable(b) ){
        fld.set( x,y,z, g.BlockType.AIR);
        fld.recalcSunlight( x-1,z-1,x+1,z+1);
        this.nearcast( "changeFieldNotify", x,y,z);
        sys.puts("digged.");
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

function attack() {
    sys.puts("attack: pitch"+this.pc.pitch + " yaw:" + this.pc.yaw );

    var b = this.pc.shoot( 10, 5, 5 );
    
    /*    
    if(this.pc==undefined)return;

    var mob = fld.findActor(id);
    sys.puts( "tof:" + mob.typeName );
    if( mob.typeName == "zombie" ){
        mob.attacked(5,this.pc);
    }
    */
    // idを使わない

}


function login() {
  sys.puts( "login" );
  var p = new g.Pos( 2,2,2 ); // 初期位置

  this.pc = fld.addPC( "guest", p, this );

  this.send( "loginResult", this.pc.id, p.x, p.y, p.z, g.PlayerSpeed );
  this.send( "statusChange", this.pc.id, this.pc.hp );

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
}
net.Socket.prototype.nearcast = function() {
    if( arguments.length < 1 )return;

    if( this.pc ){
        globalNearcast( this.pc.pos, this, arguments );
    } else {
        sys.puts("no pc");
    }
}

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
addRPC( "attack", attack );

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

