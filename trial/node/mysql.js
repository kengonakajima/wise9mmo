

var http = require('http');
 


var
  sys = require('sys'),
  mysql = require('./node-mysql-libmysqlclient/mysql-libmysqlclient'),
  conn,
  result,
  row,
  rows;


var
  host = "localhost",
  user = "storage",
  password = "",
  database = "test",
  test_table = "test_table";


var conns = new Array(5);

var i ;

for(i=0;i<5;i++){
    conns[i] = mysql.createConnectionSync();
    conns[i].connectSync(host, user, password, database);

    if (!conns[i].connectedSync()) {
        sys.puts("Connection error " + conn.connectErrno + ": " + conn.connectError);
        process.exit(1);
    }
}

/*
conn.realQuerySync("SHOW TABLES;");
result = conn.storeResultSync();

sys.puts("Tables in database '" + database + "':");
while ((row = result.fetchArraySync())) {
  sys.puts(row[0]);
}
sys.puts("");

result.freeSync();
*/

/*
result = conn.querySync("SHOW TABLES;");
rows = result.fetchAllSync();

sys.puts("Tables in database '" + database + "':");
sys.puts(sys.inspect(rows) + "\n");

sys.puts("Information:");
sys.puts(sys.inspect(conn.getInfoSync()) + "\n");
*/

/*
conn.query("SELECT * FROM " + test_table + ";", function (err, res) {
  if (err) {
    throw err;
  }
  
  res.fetchAll(function (err, rows) {
    if (err) {
      throw err;
    }
    
    sys.puts("Rows in table '" + database + "." + test_table + "':");
    sys.puts(sys.inspect(rows));
    
    // This isn't necessary since v1.2.0
    // See https://github.com/Sannis/node-mysql-libmysqlclient/issues#issue/60
    //res.freeSync();
  });
});
*/

process.on('exit', function () {
  conn.closeSync();
});

var poolIndex = 0;

var server = http.createServer(
    function (request, response) {
 
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write('Hello World!!\n');
        response.end();

//        conn.querySync( "select sleep(1);" );

        var ind = poolIndex % 5;
        poolIndex ++;
        
        conns[ind].query( "select sleep(1);", function(err,res) {  // connが1個だからかも. connを配列にしたらok
            sys.puts( "wokeup e:'"+err+"' r:'"+res+"'" );
        });

    }
).listen(8080);
 
sys.log('Server running at http://127.0.0.1:8080/');

