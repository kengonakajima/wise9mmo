/*
  wise9 mmo server main
*/


var sys = require('sys');
var net = require('net');
var Sequelize = require("./sequelize").Sequelize

var sockets = new Array();


var sequelize = new Sequelize('test', 'wise9', '', {  host: "localhost",  port: 3306 })

var rpcfuncs = new Array();

////////////////// table defs
var Character = sequelize.define('Character', {
    name: Sequelize.STRING,
    pass:     Sequelize.STRING,
    data: Sequelize.TEXT
})


Character.sync(function(){ sys.puts( "character sync fin" ); })

/*
    Character.find(  { name: charname }, function(ch) {
        if( ch.pass == pass ) {
            conn.call( "loginResult", 1 );
        } else {
            conn.call( "loginResult", 0 );
        }
    })
*/

//
// RPC func defs
//
function echo( sock, a, b, c ) {
    sock.send( "echo", a,b,c);    
}

// 関数登録
var functions = {};
function addRPC( name, f ) {
    functions[name]=f;
}


//
// サーバ
//
var server = net.createServer(function (socket) {
    socket.setEncoding("utf8");

    // 新しい接続を受けいれたとき
    socket.addListener("connect", function () {

        socket.prototype.send = function() {
            if( arguments.length < 1 ){
                sys.puts( "need argument" );
                return;
            }

            var v={};
            v["method"] = arguments[0];
            v["params"] = arguments.slice(1);
            this.write(JSON.stringify(v)+"\n");
        }
this.addrString = 
        sockets[this.addrString] = cli;
    });

    // データが来たとき
    socket.addListener("data", function (data) {

        if( data.match( /^<policy-file-request/ ) ){
            sys.puts( "policy file requested\n");
            socket.write( "<?xml version=\"1.0\"?><cross-domain-policy><allow-access-from domain=\"*\" to-ports=\"*\" secure=\"false\" /></cross-domain-policy>\n" );
            return;
        }

        // parse
        var ary = data.split("\n");
        for(var i=0;i<ary.length;i++){
            var line = ary[i];
            var decoded = JSON.parse(line);
            if( decoded.method == null || decoded.params == null ){
                sendRPC( socket, "error", "invalid json", "line:"+line );
                sys.print( "error string:" + line );
                return;
            }
            
            // call func
            var f = functions[decoded.method];
            if( f == null ){
                cli.send( "error", "func not found", "name:" + decoded.method );
                return;
            }
            f.apply( cli, decoded.params );
        }
        
    });
    
    // 切れたとき
    socket.addListener("end", function () {
        delete sockets[ socket.addrString ];

        sys.puts( "end. socknum:" + sockets.length);
    });
});

server.listen(7000, "127.0.0.1");

