/*
  wise9 連載MMOG サーバー
*/

// 必要なモジュールをロードする
var sys = require('sys');
var net = require('net');
var Sequelize = require("./sequelize").Sequelize

// グローバル変数
var sockets = new Array();
var functions = {};


// DBアクセス用コード
/*
var sequelize = new Sequelize('test', 'wise9', '', {  host: "localhost",  port: 3306 })

var Character = sequelize.define('Character', {
    name: Sequelize.STRING,
    pass:     Sequelize.STRING,
    data: Sequelize.TEXT
})

var Log = sequelize.define('Log', {
    
})


Character.sync(function(){ sys.puts( "character sync fin" ); })

Character.find(  { name: charname }, function(ch) {
    if( ch.pass == pass ) {
        conn.call( "loginResult", 1 );
    } else {
        conn.call( "loginResult", 0 );
    }
})

*/


// RPC 関数定義
function echo( a, b, c ) {
    sys.puts( "echo: abc:"+a+","+b+","+c);
    this.send( "echo", a,b,c);    
}
function sum( a, b, c ) {
    sys.puts( "sum: abc:"+a+","+b+","+c);
    this.send( "sum", a+b+c);
}
function delayed(a,b,c){
    sys.puts( "delayed: abc:"+a+","+b+","+c);
    setTimeout( function(sock) {
        sock.send( "delayed", a,b,c);    
    }, 1000, this  );    
}
function move(x,y,z,pitch,yaw,dy,jm,dt){
    sys.puts( "move: xyzpydy:"+x+","+y+","+z+","+pitch+","+yaw+","+dy+","+","+jm+","+dt);
    this.pos = [x/1000,y/1000,z/1000];
    
    this.nearcast( "moveNotify",this.clientID, x,y,z,pitch,yaw,dy,jm,dt);
}

function login() {
  sys.puts( "login" );
  this.send( "loginResult", this.clientID );
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
            sys.puts( "sk:"+ sk.addrString + " dont have position");            
            continue;
        }

        var dx = this.pos[0]-sk.pos[0];
        var dz = this.pos[2]-sk.pos[2];
        
        var distance = (dx*dx)+(dz*dz);
        if( distance< (200*200)){
            try {
                sys.puts( "sent to:"+ sk.addrString + " id:" + sk.clientID );
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

        // データ行を文字列分割してJSON解析
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
addRPC( "sum", sum );
//addRPC( "delayed", delayed );
addRPC( "move", move );

server.listen(7000, "127.0.0.1");

