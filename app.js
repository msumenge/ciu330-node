// =========================== Dependencies =============================
// ======================================================================
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

// ========================= Express Framework ==========================
// ======================================================================
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
app.set('appTitle', 'Delta');
app.set('baseUrl', 'https://delta-msumenge.c9users.io/');
app.set('clientId', '291259846069-6qbl00ojehr061gbpb528ddss885eaqh');
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
		if (typeof(js.socketRef[socket.id])!=='undefined') {
			
			// delete user from client (only when signed in on 1 device)
			if (js.getSocketByEmail(js.socketRef[socket.id]).length === 1) {
				console.log(delete js.clients[js.socketRef[socket.id].charAt(0)][js.socketRef[socket.id]]);
			} else {
				console.log('Socket count: '+js.getSocketByEmail(js.socketRef[socket.id]).length);
			}
			
			// delete user's socketRef
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
									var userData = {};
									userData.profile = r[0];
									userData.contacts = {};
									userData.chats = {};
									
									var index = userData.profile.email.charAt(0);
									if (typeof(js.clients[index])==='undefined') {
										js.clients[index] = {};
									}
									js.clients[index][userData.profile.email] = userData.profile;
									js.socketRef[socket.id] = userData.profile.email;
									
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
								db.query(q, d, function (e, r, f) { console.log(r);
									var userData = {};
									userData.profile = r[0];
									
									var index = userData.profile.email.charAt(0);
									if (typeof(js.clients[index])==='undefined') {
										js.clients[index] = {};
									}
									js.clients[index][userData.profile.email] = userData.profile;
									js.socketRef[socket.id] = userData.profile.email;

									// get contact list
									q = 'SELECT contact.*, u2.name AS name, u2.email AS email, u2.picture AS picture FROM contact JOIN user u2 ON u2.id = contact.receiver_id WHERE contact.sender_id = ? UNION SELECT contact.*, u1.name AS name, u1.email AS email, u1.picture AS picture FROM contact JOIN user u1 ON u1.id = contact.sender_id WHERE contact.receiver_id = ?';
									d = [userData.profile.id, userData.profile.id];
									db.query(q, d, function (e, r, f) {
										userData.contacts = r;
										
										// get active chats
										q = 'SELECT * FROM chat_member WHERE user_id = ?';
										d = [userData.profile.id];
										db.query(q, d, function (e, r, f) { 
											userData.chats = {};
											
											var validId = [];
											
											for (var key in r) {
												validId.push(r[key]['chat_session_id']);
											}

											db.query('SELECT TABLE_C.* FROM (SELECT TABLE_A.user_id, TABLE_B.* FROM (SELECT chat_member.* FROM chat_member WHERE chat_member.chat_session_id IN ('+validId.toString()+') AND chat_member.user_id != "'+userData.profile.id+'") TABLE_A INNER JOIN (SELECT chat_message.* FROM chat_message WHERE chat_message.chat_session_id IN ('+validId.toString()+') ORDER BY chat_message.time_created DESC) TABLE_B ON TABLE_A.chat_session_id = TABLE_B.chat_session_id GROUP BY TABLE_B.chat_session_id) TABLE_C ORDER BY TABLE_C.time_created DESC', function (e, r, f) {
												
												userData.chats = typeof(r)==='undefined' ? {} : r;
												
													
												// send data to client
												socket.emit('setUser', userData);
													
											});
										});
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
					
					socket.emit('resPage', { html: html, url: data.url});
					
				});
				break;
			case '/chat':
				app.render('chat', {title: app.get('appTitle')}, function(e, html) {
					
					var resPage = { html: html, url: data.url, chatSessionId : 0, chat : {}};
					
					var userA = {}; userA.chat_session_id = []; userA.id = data.data.userA;
					var userB = {}; userB.chat_session_id = []; userB.id = data.data.userB;
					
					var q = 'SELECT * FROM chat_member WHERE user_id = ? OR user_id = ?';
					var d = [userA.id, userB.id];
					db.query(q, d, function (e, r, f) {
						
						// sort chat_session_id
						for (var x = 0; x < r.length; x++) {
							if (r[x]['user_id'] == userA.id) {
								userA.chat_session_id.push(r[x]['chat_session_id']);
							} else if (r[x]['user_id'] == userB.id) {
								userB.chat_session_id.push(r[x]['chat_session_id']);
							}
						}
						
						// find chat_session_id
						var chat_session_id = [];
						for(i in userA.chat_session_id) {
								if(userB.chat_session_id.indexOf(userA.chat_session_id[i]) > -1){
										chat_session_id.push(userA.chat_session_id[i]);
								}
						}
						
						
						if (chat_session_id.length == 0) {
							
							// create chat session
							q = 'INSERT INTO chat_session (time_created, uuid) VALUES (?, ?)';
							d = [js.jsDateToMysqlDatetime(), uuid.v4()];
							db.query(q, d, function (e, r, f) {
								resPage.chatSessionId = r.insertId;
								
								// create chat member
								q = 'INSERT INTO chat_member (user_id, chat_session_id) VALUES (?, ?), (?, ?)';
								d = [userA.id, r.insertId, userB.id, r.insertId];
								db.query(q, d, function (e, r, f) {
									// return data to client
									socket.emit('resPage', resPage);
								});
								
							});
							
						}
						else {
							
							resPage.chatSessionId = chat_session_id[0];
							
							// get messages
							q = 'SELECT chat_message.*, user.picture FROM user INNER JOIN chat_message ON chat_message.sender_id = user.id WHERE chat_message.chat_session_id = ? ORDER BY chat_message.time_created ASC';
							d = [chat_session_id[0]];
							db.query(q, d, function (e, r, f) {
								resPage.chat = r;
								socket.emit('resPage', resPage);
							});
						}
						
					});

				});
				break;
			case '/signin': 
				app.render('signin', function(e, html) {
					socket.emit('resPage', { html: html, url: data.url });
				});
				break;
		}
	});
	
	socket.on('chatMessage', function(data) {
		data = JSON.parse(data);
		var message = {type : data.type, msg : data.msg};
		
		var q = 'INSERT INTO chat_message (sender_id, chat_session_id, time_created, read_count, message) VALUES (?, ?, ?, ?, ?)';
		var d = [data.senderId, data.sessionId, js.jsDateToMysqlDatetime(), 0, JSON.stringify(message)];
		
		db.query(q, d, function (e, r, f) {

			// get inserted message
			db.query('SELECT chat_message.*, user.picture FROM user INNER JOIN chat_message ON chat_message.sender_id = user.id WHERE chat_message.id="'+r.insertId+'"', function (e, r, f) {
				var row = r[0];
				
				// get chat member
				db.query('SELECT chat_member.user_id, user.email FROM user INNER JOIN chat_member ON chat_member.user_id = user.id WHERE chat_member.chat_session_id="'+data.sessionId+'"', function (e, r, f) {
					
					row.isPrivate = Object.keys(r).length <= 2 ? true : false;
					
					for(var key in r) {
						var user = r[key];
						user.socket = js.getSocketByEmail(user.email);
						
						if (user.socket != false) {
							user.socket.forEach(function(val, key, arr) {
								
								io.to(val).emit('onMsgReceive', JSON.stringify(row));
								
							});
						}
					}

				});
			});
			
		});
	});
	
	socket.on('reqActiveChatList',  function(data) {
		
		// get active chats
		q = 'SELECT * FROM chat_member WHERE user_id = ?';
		d = [data.userId];
		db.query(q, d, function (e, r, f) {
			
			var validId = [];
			
			for (var key in r) {
				validId.push(r[key]['chat_session_id']);
			}

			db.query('SELECT TABLE_C.* FROM (SELECT TABLE_A.user_id, TABLE_B.* FROM (SELECT chat_member.* FROM chat_member WHERE chat_member.chat_session_id IN ('+validId.toString()+') AND chat_member.user_id != "'+data.user_id+'") TABLE_A INNER JOIN (SELECT chat_message.* FROM chat_message WHERE chat_message.chat_session_id IN ('+validId.toString()+') ORDER BY chat_message.time_created DESC) TABLE_B ON TABLE_A.chat_session_id = TABLE_B.chat_session_id GROUP BY TABLE_B.chat_session_id) TABLE_C ORDER BY TABLE_C.time_created DESC', function (e, r, f) {
				
					// send response
					socket.emit('resActiveChatList', r);
					
			});
		}); /*
		
		// get active chats
		var q = 'SELECT TABLE_B.* FROM (SELECT chat_member.user_id AS userId, chat_member.chat_session_id AS sessionId FROM chat_member WHERE chat_member.user_id = ?) TABLE_A INNER JOIN (SELECT chat_message.sender_id AS senderId, user.name, user.picture, chat_message.chat_session_id AS sessionId, chat_message.time_created, chat_message.time_modified, chat_message.read_count, chat_message.message FROM chat_message INNER JOIN user ON chat_message.sender_id = user.id ORDER BY chat_message.time_created DESC) TABLE_B ON TABLE_A.sessionId = TABLE_B.sessionId GROUP BY TABLE_B.sessionId';
		var d = [data.userId];
		db.query(q, d, function (e, r, f) {
			
			// send response
			socket.emit('resActiveChatList', r);
			
		});*/
	}); 
	
});

// =============================== Pages ================================
// ======================================================================

/*******************************************
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
		//console.log(html);
		//res.send(200);
	});
});
*******************************************/

// ============================= Error Handler ==========================
// ======================================================================

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

/*

TO DO:
-add loading sreen on index.html
-delete chat when contact is deleted
-add emoji picker // https://github.com/one-signal/emoji-picker
-update count on read

*/