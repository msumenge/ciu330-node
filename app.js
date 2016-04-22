var express = require('express');
var path = require('path');
var logger = require('morgan')('combined');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('mysql');
var request = require('request');
var uuid = require('uuid'); //uuid.v4();
var randomstring = require("randomstring");
var js = require('./functions/functions.js');

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
app.set('appTitle', 'CUI330');
app.set('baseUrl', 'https://ciu330-node-msumenge.c9users.io/');
app.set('clientId', '291259846069-jei8sh0n4bcs0mebh9biuse2uf065k52');
app.set('themeColor', '#2196F3');
app.set('themeColorRgba', js.hexToRgb(app.set('themeColor'), '0.7'));

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

// =============================== DEV ENV ==============================
// ======================================================================

//generate random user
function generateUser (x) {
  if (typeof(x)==='undefined') x = 10;
  for(var a = 0; a < x; a++) {
      var randChar = randomstring.generate({length: 8, charset: 'alphabetic', capitalization: 'lowercase'});
      var randName = randChar.substring(0, 4) + ' ' + randChar.substring(4, 8)
      var randEmail = randChar +'@'+ randomstring.generate({length: 5, charset: 'alphabetic', capitalization: 'lowercase'}) + '.com';
      
      var q = 'INSERT INTO user (email, name, google_id, picture, is_active) VALUES (?, ?, ?, ?, ?)';
      var d = [randEmail, randName, Math.floor(100000000 + Math.random() * 900000000), './img/user.png', 1];
      db.query(q, d, function (e, r, f) {});
  }
}

//generateUser(20);

// ============================= Socket.io ==============================
// ======================================================================

var io = require('socket.io').listen(server);
io.on('connection', function(socket){
  //var socketID = socket.id; //String(socket.id).slice(2);
  
  socket.on('disconnect', function(){
    console.log('Client ' + socket.id +' disconnected');
    
    // remove client from clients and socketRef
    console.log(js.socketRef);
    if (typeof(js.socketRef[socket.id])!=='undefined') {
      
      // IMPORTANT ___________________________________
      // check if client is loged in on mutiple device
      // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      console.log(delete js.clients[js.socketRef[socket.id].charAt(0)][js.socketRef[socket.id]]);
      console.log(delete js.socketRef[socket.id]);
    }
  });
  
  // show client number
  console.log('Client ' + socket.id +' connected');
  
  
  socket.on('googleUser', function(data) {
        // validate token
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+data.idToken, function (error, response, body) {
        // on success
        if (!error && response.statusCode == 200) {
            
          var google = JSON.parse(body);
          
          // adjust returned value
          //google.picture = google.picture !== undefined ? 'external' : 'undefined';
          //google.picture = google.picture !== undefined ? google.picture : 'undefined';
          google.picture = google.picture !== undefined ? google.picture : './img/user.png';
          google.email_verified = google.email_verified === 'true' ? 1 : 0;
          
          // validate client and server user id
          if (google.email == data.email) {
            
            // check if user exists
            var q = 'SELECT COUNT(id) FROM user WHERE email = "' + google.email + '" AND google_id = "' + google.sub+ '"';
            db.query(q, function (e, r, f) {
              
              // user does not exists
              if (r[0]['COUNT(id)'] == 0) {
                
                
                // insert new user
                var q = 'INSERT INTO user (email, name, google_id, picture, is_active) VALUES (?, ?, ?, ?, ?)';
                var d = [google.email, google.name, google.sub, google.picture, google.email_verified];
                db.query(q, d, function (e, r, f) {
                  if (e) throw e;
                  
                  var q = 'SELECT * FROM user WHERE id = "' + r.insertId + '"';
                  db.query(q, function (e, r, f) {
                    var userData = r[0];
                    userData.contact = {};
                    
                    var index = userData.email.charAt(0);
                    if (typeof(js.clients[index])==='undefined') {
                      js.clients[index] = {};
                    }
                    js.clients[index][userData.email] = userData;
                    js.socketRef[socket.id] = userData.email;
                    
                    socket.emit('setUser', userData);
                  });
                });
              }
              
              // existing user
              else {
                // update user info
                var q = 'UPDATE user SET email = ?, name = ?, google_id = ?, picture = ?, is_active = ? WHERE email = ? AND google_id = ?';
                var d = [google.email, google.name, google.sub, google.picture, google.email_verified, google.email, google.sub];
                db.query(q, d, function (e, r, f) {
                  if (e) throw e;
                  
                  // get user data
                  q = 'SELECT * FROM user WHERE email = ? AND google_id = ?';
                  d = [google.email, google.sub];
                  db.query(q, d, function (e, r, f) {
                    var userData = r[0];
                    
                    var index = userData.email.charAt(0);
                    if (typeof(js.clients[index])==='undefined') {
                      js.clients[index] = {};
                    }
                    js.clients[index][userData.email] = userData;
                    js.socketRef[socket.id] = userData.email;

                    // get contact list
                    q = 'SELECT contact.*, u2.name AS name, u2.email AS email, u2.picture AS picture FROM contact JOIN user u2 ON u2.id = contact.receiver_id WHERE contact.sender_id=? UNION SELECT contact.*, u1.name AS name, u1.email AS email, u1.picture AS picture FROM contact JOIN user u1 ON u1.id = contact.sender_id WHERE contact.receiver_id=?';
                    d = [userData.id, userData.id];
                    db.query(q, d, function (e, r, f) {
                      userData.contact = r;
                      
                      // send data to client
                      socket.emit('setUser', userData);
                    });
                  });
                });
              }
            });
          }
        }
    });
  });
  
  socket.on('searchPeople', function(data){
    //search keyword
    
    // 'SELECT * FROM user WHERE name LIKE "%'+data.keyword+'%" OR email LIKE "%'+data.keyword+'%" ORDER BY name LIMIT 10';
    
    db.query('SELECT * FROM user WHERE name LIKE "'+data.keyword+'%"  ORDER BY name LIMIT 10', function (e, r, f) {
      socket.emit('resultPeople', JSON.stringify(r));
    });
  });
  
  
  socket.on('setContact', function(data){
    
    //check if row exist
    db.query('SELECT COUNT(id) FROM contact WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)', [data.sender, data.receiver, data.receiver, data.sender], function (e, r, f) {
      if (e) throw e;
      
      var q;
      var d;
      var is_data_exists = false;
      
      // update if data exist
      if (parseInt(r[0]['COUNT(id)']) > 0) {
        is_data_exists = true;
      }
      
      switch (data.statusId) {
        case 0:
          q = 'DELETE FROM contact WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
          d = [data.sender, data.receiver, data.receiver, data.sender];
          break;
        case 1:
          q = 'INSERT INTO contact (sender_id, receiver_id, contact_status_id, time_created) VALUES (?, ?, ?, ?)';
          d = [data.sender, data.receiver, data.statusId, js.jsDateToMysqlDatetime()];
          break;
        case 2:
        case 3:
          q = 'UPDATE contact SET contact_status_id = ? WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
          d = [data.statusId, data.sender, data.receiver, data.receiver, data.sender];
          break;
        case 4:
          
          if(is_data_exists) {
            q = 'UPDATE contact SET sender_id = ?, receiver_id = ?, contact_status_id = ? WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
            d = [data.sender, data.receiver, data.statusId, data.sender, data.receiver, data.receiver, data.sender];
          } else {
            q = 'INSERT INTO contact (sender_id, receiver_id, contact_status_id, time_created) VALUES (?, ?, ?, ?)';
            d = [data.sender, data.receiver, data.statusId, js.jsDateToMysqlDatetime()];
          }
          break;
      }

      // create contact request
      db.query(q, d, function (e, r, f) {
        if (e) throw e;
        
        var sender   = js.getSocketByEmail(data.senderEmail);
        var receiver = js.getSocketByEmail(data.receiverEmail);
        
        if (sender != false) {
          sender.forEach(function(val, key, arr) {
            
            // update search result list
            q = 'SELECT contact.*, u2.name AS name, u2.email AS email, u2.picture AS picture FROM contact JOIN user u2 ON u2.id = contact.receiver_id WHERE contact.sender_id=? UNION SELECT contact.*, u1.name AS name, u1.email AS email, u1.picture AS picture FROM contact JOIN user u1 ON u1.id = contact.sender_id WHERE contact.receiver_id=?';
            d = [data.sender, data.sender];
            db.query(q, d, function (e, r, f) {
              io.to(val).emit('refreshContactList', JSON.stringify(r));
              //console.log('SENDER'+JSON.stringify(r));
            });
            
          });
        }
        
        if (receiver != false) {
          
          receiver.forEach(function(val, key, arr) {

            if (data.statusId == 0) {
              io.to(val).emit("notification", {type: 'contact-cancel'});
            } else if (data.statusId == 1) {
              io.to(val).emit("notification", {type: 'contact-add'});
            }
            
            // update search result list
            q = 'SELECT contact.*, u2.name AS name, u2.email AS email, u2.picture AS picture FROM contact JOIN user u2 ON u2.id = contact.receiver_id WHERE contact.sender_id=? UNION SELECT contact.*, u1.name AS name, u1.email AS email, u1.picture AS picture FROM contact JOIN user u1 ON u1.id = contact.sender_id WHERE contact.receiver_id=?';
            d = [data.receiver, data.receiver];
            db.query(q, d, function (e, r, f) {
              io.to(val).emit('refreshContactList', JSON.stringify(r));
              //console.log('RECEIVER'+JSON.stringify(r));
            });
            
          });
        }
        
      });
    });
  });
  
  socket.on('reqPage', function(data){
    
    switch(data.url) {
      case '/': 
        app.render('home', {title: app.get('appTitle')}, function(e, html) {
          socket.emit('resPage', { html: html, url: data.url });
        });
        break;
      case '/chat': 
        app.render('chat', {title: app.get('appTitle')}, function(e, html) {
          socket.emit('resPage', { html: html, url: data.url });
        });
        break;
    }
  });
  
});

// =============================== Pages ================================
// ======================================================================

// index Page
app.get('/', function(req, res, next) {
  
  var data = {
    title: req.app.get('appTitle'),
    baseUrl: req.app.get('baseUrl'),
    clientId: req.app.get('clientId'),
    themeColor: req.app.get('themeColor'),
    themeColorRgba: req.app.get('themeColorRgba')
  };
  
  res.render('index', data, function(e, html) {
    res.send(html);
    //res.send(200);
  });
});

// signin page
app.use('/signin', function(req, res, next) {
  
  var data = {
      title: req.app.get('appTitle'),
      baseUrl: req.app.get('baseUrl'),
      clientId: req.app.get('clientId'),
      themeColor: req.app.get('themeColor'),
      themeColorRgba: req.app.get('themeColorRgba')
    };
    
    res.render('signin', data);
  
});

// chat page
app.use('/chat', function(req, res, next) {
  
  var data = {
      title: req.app.get('appTitle'),
      baseUrl: req.app.get('baseUrl'),
      clientId: req.app.get('clientId'),
      themeColor: req.app.get('themeColor'),
      themeColorRgba: req.app.get('themeColorRgba')
    };
    
    res.render('chat', data);
});

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