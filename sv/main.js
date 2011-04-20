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
    

// 関数登録
function addRPC( name, f ) {
    functions[name]=f;
}

// 共用の送信関数
net.Socket.prototype.send = function() {
    if( arguments.length < 1 ){
        sys.puts( "need argument" );
        return;
    }

    var v={};
    v["method"] = arguments[0];
    var params=[];
    for(var i=1;i<arguments.length;i++){
        params.push( arguments[i] );
    }
    v["params"] = params;
    this.write(JSON.stringify(v)+"\n");
}


// nodeサーバ本体
var server = net.createServer(function (socket) {
    socket.setEncoding("utf8");

    // 新しい接続を受けいれたときのコールバック関数
    socket.addListener("connect", function () {
        this.addrString = this.remoteAddress + ":" + this.remotePort;
        sockets[this.addrString] = this;
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
                socket.send( "error", "exception in rpc", "line:"+line );
                sys.print( "exception in rpc. string:" + line );
                return;
            }
        }
        
    });
    
    // ソケットが切断したときのコールバック
    socket.addListener("end", function () {
        delete sockets[ socket.addrString ];
        sys.puts( "end. socknum:" + sockets.length);
    });

    // エラーが起きたときのコールバック(SIGPIPEとか)
    socket.addListener("error", function () {
        sys.puts( "error. socknum:" + sockets.length);
    });
});


// RPC関数を登録
addRPC( "echo", echo );
addRPC( "sum", sum );

server.listen(7000, "127.0.0.1");

