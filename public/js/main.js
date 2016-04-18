/*

$('.chat-opt').on('click', function () {
    
    var selected = $(this).data('chat-opt');
    var active = $('.chat-opt.active').data('chat-opt');
    
    // do nothing if input is already selected
    if(selected == active) return;
    
    // show and hide input
    $('.input-'+selected).removeClass('display-none');
    $('.input-'+active).addClass('display-none');
    
    // change input indicator
    $('.chat-opt.active').removeClass('active');
    $(this).addClass('active');
    
    switch (selected) {
        case 'text':
            console.log(selected);
            $('.input-'+selected+' div textarea').focus();
            break;
        case 'canvas':
            resetCanvas();
            console.log(selected);
            break;
        case 'file':
            console.log(selected);
            break;
        case 'location':
            getLocation();
            showPosition(position);
            console.log(selected);
            break;
        case 'tap':
            console.log(selected);
            break;
        case 'camera':
            console.log(selected);
            break;
        case 'email':
            console.log(selected);
            break;
    }
});

// add new chat
$('#new-chat-button').on('click', function() {
    $('.mdl-layout__tab.is-active, .mdl-layout__tab-panel.is-active').removeClass('is-active');
    $('.mdl-layout__tab-bar .mdl-layout__tab:nth-child(3), #fixed-tab-3').addClass('is-active');
    
    document.querySelector('#snackbar').MaterialSnackbar.showSnackbar({message: 'Please select a recipient'});
});

*/

socket.on('initApp', function(data) {
    app.init(data);
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

// MODULES
var app = {
    client : {},
    searchContactResult : {},
    selectedUser: {},
    init : function(data) {
        
        this.cacheDom();
        this.bindEvents();
        this.setClient(data);
        this.renderContactList();
    
        this.$profileImage.css('background-image', 'url('+this.client.picture+')');
        this.$profileName.text(this.client.name);
        this.$profileEmail.text(this.client.email);
    },
    cacheDom : function () {
        this.$drawer = $('.mdl-layout__drawer');
        this.$profileImage = this.$drawer.find('#profile-image');
        this.$profileName = this.$drawer.find('#profile-name');
        this.$profileEmail = this.$drawer.find('#profile-email');
        
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
    bindEvents : function () {
        this.$popupOverlay.on('click', this.hidePopup.bind(this));
        this.$searchIcon.on('click', this.toggleSearchContact.bind(this));
        this.$setContact.on('click', this.setContact.bind(this));
        this.$searchList.on('click', '.mdl-list__item', this.showPopup.bind(this));
        this.$contactList.on('click', 'i', this.showPopup.bind(this));
        this.$pendingList.on('click', '.mdl-list__item', this.showPopup.bind(this));
        this.$pendingList.on('click', 'i', this.contactShortcut.bind(this));
        this.$requestList.on('click', '.mdl-list__item', this.showPopup.bind(this));
        this.$requestList.on('click', 'i', this.contactShortcut.bind(this));
        this.$searchInput.on('keyup', this.searchContact.bind(this));
    },
    setClient : function (data) {
        if (typeof(data)==='undefined') return false;
        
        // set data
        this.client = data;
    },
    renderContactList : function () {
        this.client.contact.forEach(function(val, key, arr) {
            val.userId = val.sender_id == app.client.id ? val.receiver_id : val.sender_id;
        });
        
        this.$contactList.empty().append('<div class="section-label">Contacts</div>').hide();
        this.$requestList.empty().append('<div class="section-label">Requests</div>').hide();
        this.$pendingList.empty().append('<div class="section-label">Pending</div>').hide();
        
        this.client.contact.forEach(function(val, key, arr) {
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
                    }
                        
                    break;
                case 2:
                    // add to contact list
                    app.$contactList.append(template).show();
                    break;
            }
        });
    },
    showPopup : function (e) {
        
        if (typeof(e) !== 'undefined') {
            e.preventDefault();
            this.selectedUser = JSON.parse($(e.target).closest('.mdl-list__item').find('input').val());
        }
        
        // add userId to searched profile
        if(typeof(this.selectedUser.contact_status_id)==='undefined') {
            this.selectedUser.userId = this.selectedUser.id;
        }
        
        this.client.contact.forEach(function(val, key, arr) {
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
                case 0:
                    this.$addContactBtn.show();
                    this.$blockContactBtn.show();
                    break;
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
            }
        } else {
            console.log('Not In Contact List'); //return;
            
            this.$addContactBtn.hide();
            this.$acceptContactBtn.hide();
            this.$declineContactBtn.hide();
            this.$blockContactBtn.hide();
            this.$cancelContactBtn.hide();
            this.$removeContactBtn.hide();
            this.$unblockContactBtn.hide();
            this.$popupFeedback.hide();
            
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
        
        // int type of val
        var num_val = parseInt(val.substring(1));
        
        //calculate badge
        var badge_count = val.charAt(0) == '+' ? parseInt($(target).data('badge')) + num_val : parseInt($(target).data('badge')) - num_val;
        
        //hide badge if empty
        if (badge_count <= 0) {
            $(target)
                .removeClass('mdl-badge')
                .attr('data-badge', badge_count)
                .data('badge', badge_count);
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
                this.updateBadge('.mdl-layout__tab:nth-child(3) i', '+1');
                this.vibrate();
                this.playSound();
                break;
            case 'contact-cancel':
                this.updateBadge('.mdl-layout__tab:nth-child(3) i', '-1');
                break;
        }
    },
    setContact : function (e) {
        
        socket.emit('setContact', {
            sender: this.client.id,
            senderEmail: this.client.email,
            receiver: this.selectedUser.userId,
            receiverEmail: this.selectedUser.email,
            statusId: $(e.target).closest('button').data('contact-status-id')
        });
        
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
                
                console.log(val);
                
                var template = '<div class="mdl-list__item"><input type="text" value=\''+JSON.stringify(val)+'\' hidden /><span class="mdl-list__item-primary-content"><div class="bg-cover profile-img-thumbnail" style="background-image: url('+val.picture+');"></div><span>'+val.name+'</span></span></div>';

                app.$searchList.append(template);
            });
        }
    },
    refreshContactList : function (data) {
        this.client.contact = JSON.parse(data);
        this.renderContactList();
        if (this.$popup.css('display') == 'block') {
            //delete this.selectedUser.contact_status_id;
            this.showPopup();
        }
    },
    contactShortcut : function (e) {
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
        
    }
};