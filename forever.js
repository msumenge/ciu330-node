'use strict';
var forever = require('forever-monitor');
var child = new (forever.Monitor )('app.js', {
  max: 3,
  silent: false
});

//These events not required, but I like to hear about it.
child.on("start", function() {
  console.log("Forever is now running...");
});
child.on("restart", function() {
  console.log("The application has restarted!");
});
child.on("watch:restart", function(info) {
  console.error("Restarting script because " + info.file + " changed");
});
child.on("exit", function() {
  console.log("The application has exited!");
});
child.on('exit:code', function(code) {
  console.error('Forever detected script exited with code ' + code);
});

child.start();
//forever.startServer(child);

//You can catch other signals too
process.on("SIGINT", function() {
  //console.log("> Ctrl + C pressed");
  process.exit();
});

process.on("exit", function() {
  console.log("Forever has stopped.");
});

//Sometimes it helps...
process.on("uncaughtException", function( err ) {
  console.log("Caught exception in 'node forever': " + err );
});