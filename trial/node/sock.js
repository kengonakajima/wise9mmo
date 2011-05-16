// TCP Echo サーバ MMOG風

var sys = require('sys');
var net = require('net');

var sockets = new Array();

var server = net.createServer(function (socket) {
    socket.setEncoding("utf8");

    // 新しい接続を受けいれたとき
    socket.addListener("connect", function () {
        socket.addrString = socket.remoteAddress + ":" + socket.remotePort;
        sockets[socket.addrString] = socket;
        socket.counter = 0;       // 接続ごとに、状態を持つ
    });

    // データが来たとき
    socket.addListener("data", function (data) {
        socket.counter ++;      

        if( data.match( /^<policy-file-request/ ) ){
            sys.puts( "policy file requested\n");
            socket.write( "<?xml version=\"1.0\"?><cross-domain-policy><allow-access-from domain=\"*\" to-ports=\"*\" secure=\"false\" /></cross-domain-policy>\n" );
        } else {
            socket.write( "message from " + socket.addrString + ":" + socket.counter + " : " + data);
        }

        sys.puts( "data:" + data + "\n" );
    });
    
    // 切れたとき
    socket.addListener("end", function () {
        delete sockets[ socket.addrString ];

        sys.puts( "end. socknum:" + sockets.length);
    });
});


server.listen(7000, "127.0.0.1");

