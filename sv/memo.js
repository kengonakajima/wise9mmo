// DBアクセス用コード




var Sequelize = require("./sequelize").Sequelize



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
