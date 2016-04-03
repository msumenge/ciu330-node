var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('mysql');
var request = require('request');
var uuid = require('uuid'); //uuid.v4();

var app = express();
var server = app.listen(process.env.PORT, process.env.IP);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ============================== Config ================================
// ======================================================================

//app.set('env', 'production');
app.set('baseUrl', 'https://ciu330-node-msumenge.c9users.io/');
app.set('clientId', '269848732222-ql3iegev0uv7jrrl30b544cvjq17ihlb');
app.set('themeColor', '#2196F3');

var clients = {};
var socketRef = {};

// =============================== MySql ================================
// ======================================================================

var db = mysql.createConnection({
  host     : 'localhost',
  user     : 'msumenge',
  password : '',
  database : 'c9'
});

//db.connect();
//db.end();

// =========================== Socket.io ================================
// ======================================================================

var io = require('socket.io').listen(server);
io.on('connection', function(socket){
  var socketNum = String(socket.id).slice(2);
  
  socket.on('disconnect', function(){
    console.log('Client ' + socketNum +' disconnected');
    
    // remove client from user list
    delete socketRef[socketNum];
  });
  
  // show client number
  console.log('Client ' + socketNum +' connected');
  
  socket.on('googleUser', function(data) {
        // validate token
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+data.idToken, function (error, response, body) {
        // on success
        if (!error && response.statusCode == 200) {
            
          var google = JSON.parse(body);
          console.log(google);
          
          // adjust returned value
          google.picture = google.picture !== undefined ? google.picture : 'undefined';
          google.email_verified = google.email_verified === 'true' ? 1 : 0;
          
          // validate client and server user id
          if (google.email == data.email) {
            
            // check if user exists
            var q = 'SELECT * FROM user WHERE email = "' + google.email + '" AND google_id = "' + google.sub+ '"';
            db.query(q, function (e, r, f) {
              
              // user does not exists
              if (r.length == 0) {
                // insert new user
                var q = 'INSERT INTO user (email, name, google_id, image, is_active) VALUES (?, ?, ?, ?, ?)';
                var d = [google.email, google.name, google.sub, google.picture, google.email_verified];
                db.query(q, d, function (e, r, f) {
                  if (e) throw e;
                  
                  var q = 'SELECT * FROM user WHERE id = "' + r.insertId + '"';
                  db.query(q, function (e, r, f) {
                    clients[r[0].email] = r[0];
                    socketRef[socketNum] = r[0].email;
                    socket.emit('initApp', r[0]);
                    
                    console.log(socketRef);
                  });
                });
              }
              
              // user exists
              else {
                // update user info
                var q = 'UPDATE user SET email = ?, name = ?, google_id = ?, image = ?, is_active = ? WHERE email = ? AND google_id = ?';
                var d = [google.email, google.name, google.sub, google.picture, google.email_verified, google.email, google.sub];
                db.query(q, d, function (e, r, f) {
                  if (e) throw e;
                  
                  var q = 'SELECT * FROM user WHERE email = ? AND google_id = ?';
                  var d = [google.email, google.sub];
                  db.query(q, d, function (e, r, f) {
                    clients[r[0].email] = r[0];
                    socketRef[socketNum] = r[0].email;
                    socket.emit('initApp', r[0]);
                    
                    console.log(socketRef);
                  });
                });
              }
            });
          }
        }
    });
  });
});

// =============================== Pages ================================
// ======================================================================

// index Page
app.get('/', function(req, res, next) {
  
  var data = {
    title: 'CIU330',
    baseUrl: req.app.get('baseUrl'),
    clientId: req.app.get('clientId'),
    themeColor: req.app.get('themeColor')
  };
  
  res.render('index', data);
});

// other pages
app.use('/signin', require('./routes/signin'));

// ======================================================================
// ======================================================================

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;