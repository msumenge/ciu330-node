/*
  
  //Snackbar
  document.querySelector('#snackbar').MaterialSnackbar.showSnackbar({message: 'Something'});
  
*/

// =====================================================================
// =====================================================================

socket.on('setUser', function(data) {
    app.setUser(data);
    app.reqPage();
});

socket.on('resPage', function(data) {
    app.renderPage(data);
});

socket.on('resultPeople', function(data) {
    app.showSearchContactReasult(data);
});

socket.on('notification', function(data) {
    app.setNotification(data);
});

socket.on('refreshContactList', function(data) {
    app.refreshContactList(data);
});

socket.on('onMsgReceive', function(data) {
    app.onMsgReceive(data);
});

socket.on('resActiveChatList', function(data) {
    localStorage.chats = JSON.stringify(data);
    //if (localStorage.chats !== 'undefined') 
    app.renderActiveChat();
});

// =====================================================================
// =====================================================================

app = {
    $body : $('#BODY'), 
    client : {},
    searchContactResult : {},
    selectedUser : {},
    chatSessionId : false,
    currentPage : 'signin',
    init : function() {
      document.title = "Delta";
      var themeColor = '#2196F3';
      $('meta[name=theme-color]').attr('content', themeColor);
      $('meta[name=msapplication-navbutton-color]').attr('content', themeColor);
      $('meta[name=apple-mobile-web-app-status-bar-style]').attr('content', themeColor);
      
      if(typeof(Storage) !== "undefined") {
          // STORE  : localStorage.item = 'item';
          // GET    : localStorage.item;
          // REMOVE : localStorage.removeItem("item");
      } else {
          // Sorry! No Web Storage support..
      }
    },
    reqPage : function(url, data){
      if (typeof(url)==='undefined') url = '/';
      if (typeof(data)==='undefined') data = {};
      
      socket.emit('reqPage', { url : url, data : data, userId : this.client.id });
    },
    renderPage : function (data) {
      
      // set contents
      app.$body.empty().html(data.html);
      
      // bind events
      switch(data.url) {
        case '/': 
          this.cacheIndexDom();
          this.bindIndexEvents();
          this.renderActiveChat();
          this.renderContactList();
          
          this.$profileImage.css('background-image', 'url('+this.client.picture+')');
          this.$profileName.text(this.client.name);
          this.$profileEmail.text(this.client.email);
          break;
      case '/chat': 
          this.cacheChatDom();
          this.bindChatEvents();
          
          this.$layoutTitle.text(this.selectedUser.name);
          this.renderChat(data.chat);
          this.chatSessionId = data.chatSessionId;
          break;
      case '/signin':
          renderButton();
          break;
      }
      
      this.currentPage = data.url;
      
      // Init MDL
      componentHandler.upgradeDom();
    },
    cacheIndexDom : function () {
      this.$drawer = $('.mdl-layout__drawer');
      this.$profileImage = this.$drawer.find('#profile-image');
      this.$profileName = this.$drawer.find('#profile-name');
      this.$profileEmail = this.$drawer.find('#profile-email');
      
      this.$tab = $('.mdl-layout__tab');
      this.$sectionOne = $('#fixed-tab-1');
      this.$privateChat = this.$sectionOne.find('#privat-chat-list');
      
      this.$signOutBtn = $('#signout-btn');
      
      this.$popup = $('#popup');
      this.$popupOverlay = this.$popup.find('.popup-overlay');
      this.$popupFeedback = this.$popup.find('.popup-feedback');
      this.$popupProfileName = this.$popup.find('.profile-name');
      this.$popupProfileEmail = this.$popup.find('.profile-email');
      this.$popupProfileImage = this.$popup.find('.profile-image');
      this.$popupProfileId = this.$popup.find('.profile-id');
      
      this.$searchBox = $('#search-box');
      this.$searchIcon = this.$searchBox.find('i');
      this.$searchInput = this.$searchBox.find('input');
      
      this.$contactList = $('.contact-list');
      this.$requestList = $('.request-list');
      this.$pendingList = $('.pending-list');
      this.$searchList = $('.search-list');
      
      this.$setContact = $('.set-contact');
      this.$contactProfileEmail = $('.profile-email');
      
      this.$addContactBtn = $('button[data-action="add"]');
      this.$acceptContactBtn = $('button[data-action="accept"]');
      this.$declineContactBtn = $('button[data-action="decline"]');
      this.$blockContactBtn = $('button[data-action="block"]');
      this.$cancelContactBtn = $('button[data-action="cancel"]');
      this.$removeContactBtn = $('button[data-action="remove"]');
      this.$unblockContactBtn = $('button[data-action="unblock"]');

      this.$soundPing = $('#sound-ping')[0];
    },
    bindIndexEvents : function () {
      this.$popupOverlay.on('click', this.hidePopup.bind(this));
      this.$searchIcon.on('click', this.toggleSearchContact.bind(this));
      this.$setContact.on('click', this.setContact.bind(this));
      this.$searchList.on('click', '.mdl-list__item', this.renderPopup.bind(this));
      this.$contactList.on('click', '.mdl-list__item', this.openChat.bind(this));
      this.$privateChat.on('click', '.mdl-list__item', this.openChat.bind(this));
      this.$contactList.on('click', 'i', this.renderPopup.bind(this));
      this.$pendingList.on('click', '.mdl-list__item', this.renderPopup.bind(this));
      this.$pendingList.on('click', 'i', this.setContactShortcut.bind(this));
      this.$requestList.on('click', '.mdl-list__item', this.renderPopup.bind(this));
      this.$requestList.on('click', 'i', this.setContactShortcut.bind(this));
      this.$searchInput.on('keyup', this.searchContact.bind(this));
      this.$tab.on('click', this.unsetNotification.bind(this));
      this.$signOutBtn.on('click', this.signOut.bind(this));
    },
    cacheChatDom : function () {
      this.$layoutHeader = $('.mdl-layout__header');
      this.$layoutTitle = this.$layoutHeader.find('.mdl-layout-title');
      this.$backBtn = this.$layoutHeader.find('#back-btn');
      
      //this.$layoutContent = $('.mdl-layout__content');
      
      this.$inputOptBtn = $('#input-option');
      this.$inputOptsBtn = $('.input-option');
      
      this.$chatContainer = $('#chat-container');
      this.$inputContainer = $('#input-container');
      
      this.$inputText = $('#input-text');
      this.$inputCanvas = $('#input-canvas');
      this.$inputLocation = $('#input-location');
      this.$inputImage = $('#input-image');
      
      this.$sendBtn = $('.send-btn');
      
      this.canvas = document.getElementById('canvas');
      this.canvasContext = this.canvas.getContext('2d');
      this.canvasRadius = 2;
      this.canvasDragging = false;
      this.$canvas = this.$inputCanvas.find('#canvas');
      this.$canvasInputColor = this.$inputCanvas.find('input[name="canvas-input-color"]');
      this.$canvasInputLineWidth = this.$inputCanvas.find('#canvas-input-lineWidth input');
      
      this.$canvasDeleteBtn = this.$inputCanvas.find('.canvas-delete');
      this.$canvasColorBtn = this.$inputCanvas.find('.canvas-color');
      this.$canvasLineWidthBtn = this.$inputCanvas.find('.canvas-lineWidth');
    },
    bindChatEvents : function () {
      this.$backBtn.on('click', this.openHome.bind(this));
      this.$inputOptBtn.on('click', this.toggleChatOpt.bind(this));
      this.$inputOptsBtn.on('click', this.selectInput.bind(this));
      this.$sendBtn.on('click', this.sendMsg.bind(this));
      this.$canvas.on('mousedown vmousedown', this.mousedownCanvas.bind(this))
                  .on('mousemove vmousemove', this.mousemoveCanvas.bind(this))
                  .on('mouseup vmouseup', this.mouseupCanvas.bind(this));
      this.$canvasDeleteBtn.on('click', this.clearCanvas.bind(this));
      this.$canvasColorBtn.on('click', this.selectCanvasColor.bind(this));
      this.$canvasInputColor.on('change', this.updateCanvasColor.bind(this));
      this.$canvasLineWidthBtn.on('click', this.toggleLineWidthInput.bind(this));
      this.$canvasInputLineWidth.on('change', this.setCanvasLineWidth.bind(this));
    },
    mousedownCanvas : function (e) {
      this.canvasDragging = true;
      this.drawCanvas(e);
    },
    mousemoveCanvas : function (e) {
      this.drawCanvas(e);
    },
    mouseupCanvas : function (e) {
      this.canvasDragging = false;
      this.canvasContext.beginPath();
    },
    drawCanvas : function (e) {
      if(this.canvasDragging) {
        var rect = this.canvas.getBoundingClientRect();
        var xPos = (e.clientX - rect.left) / (rect.right - rect.left) * this.canvas.width;
        var yPos = (e.clientY - rect.top) / (rect.bottom - rect.top) * this.canvas.height;
        
        this.canvasContext.lineWidth = this.canvasRadius*2;
        this.canvasContext.lineTo(xPos, yPos);
        this.canvasContext.stroke();
        this.canvasContext.beginPath();
        this.canvasContext.arc(xPos, yPos, this.canvasRadius, 0, Math.PI*2);
        this.canvasContext.fill();
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(xPos, yPos);
      }
    },
    clearCanvas : function () {
      this.canvas.width = this.$canvas.width();
      this.canvas.height = this.$canvas.height();
      this.canvasContext.lineWidth = this.canvasRadius*2;
      this.canvasContext.fillStyle = '#354b60';
      this.canvasContext.strokeStyle = '#354b60';
      this.$canvasColorBtn.css('color', '#354b60');
    },
    selectCanvasColor : function () {
      this.$canvasInputColor.click();
    },
    updateCanvasColor : function () {
      var val = this.$canvasInputColor.val();
      this.$canvasColorBtn.css('color', val);
      this.canvasContext.fillStyle = val;
      this.canvasContext.strokeStyle = val;
    },
    toggleLineWidthInput : function () {
      var inputContainer = this.$canvasInputLineWidth.closest('#canvas-input-lineWidth');
      if (inputContainer.css('bottom') == '60px') {
        inputContainer.css('bottom', '-90px');
      } else {
        inputContainer.css('bottom', '60px');
      }
    },
    setCanvasLineWidth : function () {
      this.canvasRadius = this.$canvasInputLineWidth.val();
      this.canvasContext.lineWidth = this.canvasRadius*2;
      
      setTimeout(function(){ app.toggleLineWidthInput(); }, 1000);
    },
    openHome : function () {
      this.reqPage();
    },
    openChat : function (e) {
      this.selectedUser = JSON.parse($(e.target).closest('.mdl-list__item').find('input').val());
      
      this.chatSessionId = false;
      this.reqPage('/chat', { userA: this.client.id, userB: this.selectedUser.userId });
    },
    renderChat : function (chats) {
      if(!this.chatSessionId) {
        
        for (var key in chats) {
          var data = chats[key];
          data.message = JSON.parse(data.message)
          
          var time = this.isoTimeToAmPm(data.time_created);
          var message = '';
          
          switch (data.message.type) {
            case 'text':
              message = '<div>'+data.message.msg+'</div>';
              break;
            case 'canvas':
              message = '<img src="'+data.message.msg+'" />';
              break;
            case 'location':
              message = '<img src="'+data.message.msg+'" />';
              break;
            case 'image':
              break;
          }
          
          var picture = data.picture;
          var html = '';
          
          if (data.sender_id == this.client.id) {
            html = '<div class="msg-from me fullwidth"><div class="bg-cover" style="background-image : url('+picture+');"></div><div class="msg-time">'+time+'</div>'+message+'</div>';
          } else {
            html = '<div class="msg-from other fullwidth"><div class="bg-cover" style="background-image : url('+picture+');"></div><div class="msg-time">'+time+'</div>'+message+'</div>';
          }
          
          this.$chatContainer.append(html);
        }
        
        // scroll to bottom
        this.$chatContainer.stop().animate({ scrollTop: this.$chatContainer[0].scrollHeight });
      }
    },
    sendMsg : function (e) {
      var type = $(e.target).closest('.send-btn').data('input');
      var msg = '';
      var data = {};
      
      switch (type) {
        case 'text':
          msg = this.$inputText.find('textarea').val();
          this.$inputText.find('textarea').val('');
          break;
        case 'canvas':
          msg = this.canvas.toDataURL();
          this.clearCanvas();
          //##########################################
          break;
        case 'location':
          break;
        case 'image':
          break;
      }
      
      data.type = type;
      data.msg = msg;
      data.senderId = this.client.id;
      data.sessionId = this.chatSessionId;
      
      // do nothing if msg is empty
      if (data.msg == '' || data.msg == ' ') return;
      
      data = JSON.stringify(data);
      
      socket.emit('chatMessage', data);
    },
    onMsgReceive : function (data) {
      data = JSON.parse(data);
      data.message = JSON.parse(data.message);
      
      switch (this.currentPage) {
        case '/':
          if (data.isPrivate) {
            this.updateBadge('.mdl-layout__tab:nth-child(1) i', 1);
          } else {
            this.updateBadge('.mdl-layout__tab:nth-child(2) i', 1);
          }
          socket.emit('reqActiveChatList', {userId: this.client.id });
          break;
        case '/chat':
          // convert to JS date
          var time = this.isoTimeToAmPm(data.time_created);
          var message = '';
          
          switch (data.message.type) {
            case 'text':
              message = '<div>'+data.message.msg+'</div>';
              break;
            case 'canvas':
              message = '<img src="'+data.message.msg+'" />';
              break;
            case 'location':
              break;
            case 'image':
              break;
          }
          
          var picture = data.picture;
          var html = '';
          
          if (data.sender_id == this.client.id) {
            html = '<div class="msg-from me fullwidth"><div class="bg-cover" style="background-image : url('+picture+');"></div><div class="msg-time">'+time+'</div>'+message+'</div>';
          } else {
            html = '<div class="msg-from other fullwidth"><div class="bg-cover" style="background-image : url('+picture+');"></div><div class="msg-time">'+time+'</div>'+message+'</div>';
          }
          
          this.$chatContainer.append(html);
          
          // scroll to bottom
          this.$chatContainer.stop().animate({ scrollTop: this.$chatContainer[0].scrollHeight });
          break;
      }
    },
    selectInput : function (e) {
      var type = $(e.target).closest('.input-option').data('input');
      
      // hide all
      this.$inputText.hide();
      this.$inputCanvas.hide();
      this.$inputLocation.hide();
      this.$inputImage.hide();
      
      switch (type) {
        case 'text':
          this.$inputText.show();
          this.$inputContainer.css('min-height', '60px');
          break;
        case 'canvas':
          this.$inputCanvas.show();
          this.$inputContainer.css('min-height', '310px');
          break;
        case 'location':
          this.$inputLocation.show();
          this.$inputContainer.css('min-height', '260px');
          break;
        case 'image':
          this.$inputImage.show();
          this.$inputContainer.css('min-height', '260px');
          break;
      }
      
      // scroll to bottom
      this.$chatContainer.stop().animate({ scrollTop: this.$chatContainer[0].scrollHeight });
      
      this.toggleChatOpt();
    },
    toggleChatOpt : function () {
        
        var isActive = this.$inputOptBtn.hasClass('active');
        
        if (isActive) {
            this.$inputOptBtn.removeClass('active');
            
            this.$inputOptsBtn.each(function (key, val) {
                setTimeout(function(){
                    $(val).css('right', '-50px');
                }, 50*key);
            });
        }
        
        //
        else {
            this.$inputOptBtn.addClass('active');
            
            this.$inputOptsBtn.each(function (key, val) {
                
                setTimeout(function(){
                    $(val).css('right', '10px');
                }, 50*key);
            });
        }
    },
    setUser : function (data) {
        if (typeof(data)==='undefined') return false;
        
        // set data
        this.client = data.profile;
        
        var contacts = data.contacts;
        
        if (Object.getOwnPropertyNames(contacts).length === 0) return;
        
        contacts.forEach(function(val, key, arr) {
            val.userId = val.sender_id == app.client.id ? val.receiver_id : val.sender_id;
        });
        
        localStorage.contacts = JSON.stringify(data.contacts);
        localStorage.chats = JSON.stringify(data.chats);
    },
    renderActiveChat : function () {
        // reset container
        app.$privateChat.empty();
      
        var chats = JSON.parse(localStorage.chats);
        var contacts = JSON.parse(localStorage.contacts);
        var name = '';
        var picture = '';
        var time = '';
        var message = '';
        var msg = '';
        var readCount = '<i class="material-icons">check</i>';
        var html = '';
        
        if (Object.getOwnPropertyNames(chats).length === 0) return;
        
        chats.forEach(function(val, key, arr) {
            for (var key in contacts ) {
              if (contacts[key]['userId'] == val.user_id) {
                
                var contact = contacts[key];
                
                name = contact.name;
                picture = contact.picture;
                time = app.isoTimeToAmPm(val.time_created);
                message = JSON.parse(val.message);
                
                switch(message.type) {
                  case 'text':
                    msg = message.msg.length > 50 ? message.msg.substr(0, 50) + '...' : message.msg ;
                    break;
                  case 'canvas':
                    msg = 'Drawn Image';
                    break;
                  case 'location':
                    msg = 'Location';
                    break;
                  case 'image':
                    msg = 'Image / File';
                    break;
                }
                
                
                readCount = '<i class="material-icons">check</i>';
                
                html = '<li class="mdl-list__item mdl-list__item--two-line"><input type="text" value=\''+JSON.stringify(contact)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+picture+');"></div><span>'+name+'</span><span class="mdl-list__item-sub-title">'+msg+'</span></span><span class="mdl-list__item-secondary-content"><span class="mdl-list__item-secondary-info">'+time+'</span>'+readCount+'</span></li>';
                
                app.$privateChat.append(html);
                
              }
            }
        });
    },
    renderContactList : function () {
        var contacts = JSON.parse(localStorage.contacts);
      
        this.$contactList.empty().append('<div class="section-label">Contacts</div>').hide();
        this.$requestList.empty().append('<div class="section-label">Requests</div>').hide();
        this.$pendingList.empty().append('<div class="section-label">Pending</div>').hide();
        
        contacts.forEach(function(val, key, arr) {
            var template = '<div class="mdl-list__item" data-userId="'+val.id+'"><input type="text" value=\''+JSON.stringify(val)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+val.picture+');"></div><span>'+val.name+'</span></span><span class="mdl-list__item-secondary-content"><a class="mdl-list__item-secondary-action" href="#"><i class="material-icons">info_outline</i></a></span></div>';
            
            switch(val.contact_status_id) {
                case 1:
                    // add to pending list
                    if (val.sender_id == app.client.id) {
                        template = '<div class="mdl-list__item" data-userId="'+val.id+'"><input type="text" value=\''+JSON.stringify(val)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+val.picture+');"></div><span>'+val.name+'</span></span><span class="mdl-list__item-secondary-content"><a class="mdl-list__item-secondary-action" href="#"><i class="material-icons" data-shortcut="0">highlight_off</i></a></span></div>';
                        app.$pendingList.append(template).show();
                    }
                        
                    // add to request list
                    else if (val.receiver_id == app.client.id) {
                        template = '<div class="mdl-list__item" data-userId="'+val.id+'"><input type="text" value=\''+JSON.stringify(val)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+val.picture+');"></div><span>'+val.name+'</span></span><span class="mdl-list__item-secondary-content"><a class="mdl-list__item-secondary-action" href="#"><i class="material-icons" data-shortcut="2">check_circle</i></a></span></div>';
                        
                        app.$requestList.append(template).show();
                        app.updateBadge('.mdl-layout__tab:nth-child(3) i', 1);
                    }
                        
                    break;
                case 2:
                    // add to contact list
                    app.$contactList.append(template).show();
                    break;
            }
        });
    },
    renderPopup : function (e) {
        
        if (typeof(e) !== 'undefined') {
            e.preventDefault();
            e.stopPropagation();
            this.selectedUser = JSON.parse($(e.target).closest('.mdl-list__item').find('input').val());
        }
        
        // add userId to searched profile
        if(typeof(this.selectedUser.contact_status_id)==='undefined') {
            this.selectedUser.userId = this.selectedUser.id;
            this.selectedUser.contact_status_id = 0;
        }
        
        var contacts = JSON.parse(localStorage.contacts);
        contacts.forEach(function(val, key, arr) {
            if (val.userId == app.selectedUser.userId) {
                app.selectedUser = val;
            }
        });
        
        this.$popupProfileImage.css('background-image', 'url('+this.selectedUser.picture+')');
        this.$popupProfileName.text(this.selectedUser.name);
        this.$popupProfileEmail.text(this.selectedUser.email);
        this.$popupProfileId.val(this.selectedUser.userId);
            
        // hide all buttons and feedback
        this.$addContactBtn.hide();
        this.$acceptContactBtn.hide();
        this.$declineContactBtn.hide();
        this.$blockContactBtn.hide();
        this.$cancelContactBtn.hide();
        this.$removeContactBtn.hide();
        this.$unblockContactBtn.hide();
        this.$popupFeedback.hide();
        
        if (this.selectedUser.sender_id == this.client.id) {
            
            switch(this.selectedUser.contact_status_id) {
                case 1: // pending
                    this.$blockContactBtn.show();
                    this.$cancelContactBtn.show();
                    this.$popupFeedback.show();
                    break;
                case 2: // accepted
                    this.$blockContactBtn.show();
                    this.$removeContactBtn.show();
                    break;
                case 3: // declined
                    this.$blockContactBtn.show();
                    break;
                case 4: // blocked
                    this.$unblockContactBtn.show();
                    break;
                default:
                    this.$addContactBtn.show();
                    this.$blockContactBtn.show();
                    break;
            }
        }
        else if (this.selectedUser.receiver_id == this.client.id) {
            switch(this.selectedUser.contact_status_id) {
                case 1:
                    this.$acceptContactBtn.show();
                    this.$declineContactBtn.show();
                    break;
                case 2:
                    this.$blockContactBtn.show();
                    this.$removeContactBtn.show();
                    break;
                case 3:
                    this.$blockContactBtn.show();
                    this.$acceptContactBtn.show();
                    break;
                case 4:
                    break;
                default:
                    this.$addContactBtn.show();
                    this.$blockContactBtn.show();
                    break;
            }
        } else {
            console.log('Not In Contact List'); //return;
            
            this.$addContactBtn.show();
            this.$blockContactBtn.show();

        }
        
        this.$popup.show();
    },
    hidePopup : function () {
        this.$popup.hide();
        this.selectedUser = {};
    },
    toggleSearchContact : function () {
        if(this.$searchIcon.hasClass('active')) {
            this.$searchIcon.removeClass('active');
            this.$searchInput.attr('placeholder', 'Search contact');
            this.$searchList.hide();
        } else {
            this.$searchIcon.addClass('active');
            this.$searchInput.attr('placeholder', 'Search people');
        }
    },
    updateBadge : function (target, val) {
        if (typeof(target)==='undefined') return false;
        if (typeof(val)==='undefined') return false;
        
        //calculate badge
        var badge_count = val == 0 ? 0 : parseInt($(target).data('badge')) + val;

        //hide badge if empty
        if (badge_count <= 0) {
            
            $(target)
                .removeClass('mdl-badge')
                .attr('data-badge', 0)
                .data('badge', 0);
        } 
        //show badge
        else {
            $(target)
                .addClass('mdl-badge')
                .attr('data-badge', badge_count)
                .data('badge', badge_count);    
        }
    },
    setNotification : function (data) {
        if (typeof(data)==='undefined') return false;
        
        switch (data.type) {
            case 'contact-add':
                //this.updateBadge('.mdl-layout__tab:nth-child(3) i', 1);
                this.vibrate();
                this.playSound();
                break;
            case 'contact-cancel':
                this.updateBadge('.mdl-layout__tab:nth-child(3) i', -1);
                this.selectedUser.contact_status_id = 0;
                if (this.$popup.css('display') == 'block') {
                    this.renderPopup();
                }
                break;
        }
    },
    unsetNotification : function (e) {
        this.updateBadge($(e.target).closest('.mdl-layout__tab').find('i'), 0);
    },
    setContact : function (e) {
        
        socket.emit('setContact', {
            sender: this.client.id,
            senderEmail: this.client.email,
            receiver: this.selectedUser.userId,
            receiverEmail: this.selectedUser.email,
            statusId: $(e.target).closest('button').data('contact-status-id')
        });
        
        this.selectedUser.contact_status_id = $(e.target).closest('button').data('contact-status-id');
        
        // re-render pop up
        if (this.$popup.css('display') == 'block') {
            this.renderPopup();
        }
        
        // subtract 1 notif if contact is "Accepted"
        if (parseInt($(e.target).closest('button').data('contact-status-id')) == 2) {
            app.updateBadge('.mdl-layout__tab:nth-child(3) i', -1);
        }
    },
    setContactShortcut : function (e) {
        // stop parent event
        e.stopPropagation();
        
        var userData = $(e.target).closest('.mdl-list__item').find('input').val();
        this.selectedUser = JSON.parse(userData);
        console.log(userData);
        
        socket.emit('setContact', {
            sender: this.client.id,
            senderEmail: this.client.email,
            receiver: this.selectedUser.userId,
            receiverEmail: this.selectedUser.email,
            statusId: $(e.target).data('shortcut')
        });
        
        // subtract 1 notif if contact is "Accepted"
        if (parseInt($(e.target).data('shortcut')) == 2) {
            app.updateBadge('.mdl-layout__tab:nth-child(3) i', -1);
        }
    },
    searchContact : function () {
        
        // search database
        if(this.$searchIcon.hasClass('active')) {
            
            // exit if input is empty
            if(this.$searchInput.val() == '' || this.$searchInput.val() == ' ') {
                this.$searchList.find('p').show();
                this.$searchList.empty().append('<div class="section-label">Search results</div><p>no result</p>');
                return;
            }
            
            socket.emit('searchPeople', { keyword: this.$searchInput.val(), clientId: this.client.id });
        }
        
        // search local contact
        else {
            
            // if input is not empty
            if(this.$searchInput.val() != '' || this.$searchInput.val() != ' ') {
                
                this.$contactList.find('.mdl-list__item').each(function(key, val) {
                    var user = JSON.parse($(this).find('input').val());
                    
                    if (user.name.toLowerCase().indexOf(app.$searchInput.val().toLowerCase()) == 0 ||
                        user.email.toLowerCase().indexOf(app.$searchInput.val().toLowerCase()) == 0 ) {
                        
                        $(this).show();    
                    } else {
                        $(this).hide();
                    }
                });
                
            }
        }
    },
    showSearchContactReasult : function (data) {
        this.searchContactResult = JSON.parse(data);
        
        // show "no result" message
        if($.isEmptyObject(this.searchContactResult)) {
            this.$searchList.show();
            this.$searchList.find('p').show();
        }
        // show result
        else {
            this.$searchList.show();
            this.$searchList.find('p').hide();
            
            this.$searchList.empty().append('<div class="section-label">Search results</div>');
            
            this.searchContactResult.forEach(function(val, key, arr) {
                if(val.id == app.client.id) return;
                
                var template = '<div class="mdl-list__item"><input type="text" value=\''+JSON.stringify(val)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+val.picture+');"></div><span>'+val.name+'</span></span></div>';

                app.$searchList.append(template);
            });
        }
    },
    refreshContactList : function (data) {
        localStorage.contacts = data;
        this.renderContactList();
        if (this.$popup.css('display') == 'block') {
            this.renderPopup();
        }
    },
    vibrate : function (duration) {
        if (typeof(duration)==='undefined') duration = 500;
        
        // enable vibration support
        navigator.vibrate = navigator.vibrate ||
                            navigator.webkitVibrate ||
                            navigator.mozVibrate ||
                            navigator.msVibrate;
        
        if (navigator.vibrate) {
        	navigator.vibrate(duration);
        }
    },
    playSound : function () {
        
    },
    signOut : function () {
        googleSignOut();
    },
    isoTimeToAmPm : function (isoDate) {
      var t = new Date(isoDate);
      var time = t.toLocaleTimeString('en-US');
      time = time.split(' ');
      time = time[0].substr(0, time[0].length - 3) + ' ' + time[1];
      
      return time;
    }
};