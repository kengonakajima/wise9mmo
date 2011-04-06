var Sequelize = require("./sequelize").Sequelize
var sys = require( "sys") ;
var sequelize = new Sequelize('test', 'wise9', '', {
  host: "localhost",
  port: 3306
})

var Project = sequelize.define('Project', {
  title: Sequelize.STRING,
  description: Sequelize.TEXT
})

var Task = sequelize.define('Task', {
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  deadline: Sequelize.DATE
})


var project = new Project({
  title: 'my awesome project',
  description: 'woot woot. this will make me a rich man'
})

var task = new Task({
  title: 'specify the project idea',
  description: 'bla',
  deadline: new Date()
})

// make table
Task.sync(function(){ sys.puts( "task.sync fin" ); })
Project.sync(function(){     sys.puts( "project.sync fin" );})

// way 1
task.title = 'a very different title now'
task.save(function(){
    sys.puts( "task.save fin");
    var t2 = Task.findAll(function(tasks) {
        sys.puts( "task selected:" + tasks[0].title );
    })
})

// way 2
task.updateAttributes({
  title: 'a very different title now'
}, function(){})

Sequelize.chainQueries([ 
  {save: project}, {save: task}
], function() {
  // woot! saved.
})
