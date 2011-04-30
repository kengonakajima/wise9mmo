/*
  wise9 連載MMOG サーバー
*/

// 必要なモジュールをロードする
var sys = require('sys');
var net = require('net');

var modField = require("./field");


// グローバル変数
var sockets = new Array();
var functions = {};


var fld = modField.generate( 128, 128 );




// RPC 関数定義
function echo( a, b, c ) {
    sys.puts( "echo: abc:"+a+","+b+","+c);
    this.send( "echo", a,b,c);    
}

function delayed(a,b,c){
    sys.puts( "delayed: abc:"+a+","+b+","+c);
    setTimeout( function(sock) {
        sock.send( "delayed", a,b,c);    
    }, 1000, this  );    
}
function move(x,y,z,pitch,yaw,dy,jm,dt){
    //    sys.puts( "move: xyzpydy:"+x+","+y+","+z+","+pitch+","+yaw+","+dy+","+","+jm+","+dt);
    var ix = x/1000;
    var iy = y/1000;
    var iz = z/1000;
    this.pos = [ix,iy,iz];

    this.nearcast( "moveNotify",this.clientID, x,y,z,pitch,yaw,dy,jm,dt);
}

function getField(x0,y0,z0,x1,y1,z1){
    if(this.gfcnt==undefined)this.gfcnt=0;else this.gfcnt++;
    sys.puts( "getField: cnt:"+this.gfcnt+":"+x0+","+y0+","+z0+","+x1+","+y1+","+z1);
    var ary = fld.getBox( x0,y0,z0,x1,y1,z1);
    if(ary==null){
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,[] );
    } else {
        this.send( "getFieldResult", x0,y0,z0,x1,y1,z1,ary );
    }
}
function dig(x,y,z){
    sys.puts("dig:"+x+","+y+","+z);
    // todo: 無条件に受けいれてる
    var b = fld.get(x,y,z);
    if( b != null && b == modField.Enums.BlockType.STONE ){
        fld.set( x,y,z, modField.Enums.BlockType.AIR);
        this.nearcast( "changeFieldNotify", x,y,z, modField.Enums.BlockType.AIR);
        sys.puts("digged");
    }    
}
function jump(){
    this.nearcast( "jumpNotify", this.clientID);
}

function login() {
  sys.puts( "login" );
  this.pos = [ 2,20,2 ]; // 初期位置
  this.send( "loginResult", this.clientID, this.pos[0], this.pos[1], this.pos[2] );
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
    var json = makeJson( arguments );


    
    for(var addr in sockets ){
        var sk = sockets[addr];

        if( sk == this ) continue;
        if( sk.pos == undefined ){
            //            sys.puts( "sk:"+ sk.addrString + " dont have position");            
            continue;
        }

        var dx = this.pos[0]-sk.pos[0];
        var dz = this.pos[2]-sk.pos[2];
        
        var distance = (dx*dx)+(dz*dz);
        if( distance< (200*200)){
            try {
                //                sys.puts( "sent to:"+ sk.addrString + " id:" + sk.clientID );
                sk.write(json+"\n");
            } catch(e){
                sys.puts( "nearcast: exception:"+e);
            }
        } else {
            sys.puts( "too far:"+ sk.addrString + " id:"+ sk.clientID );            
        }
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
            try {
                f.apply( socket, decoded.params );
            } catch(e){
                socket.send( "error", "exception in rpc", "line:"+line+ "e:"+e );
                sys.print( "exception in rpc. string:" + line+ "e:"+e );
                return;
            }
        }
        
    });
    
    // ソケットが切断したときのコールバック
    socket.addListener("end", function () {
        delete sockets[ socket.clientID ];
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

server.listen(7000, "127.0.0.1");

