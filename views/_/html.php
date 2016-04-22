<?php
    function base_url($i) {
        $url = 'http://localhost/ciu330/';
        
        if(isset($i))
            $url .= $i;
        
        return $url;
    }

    $page = isset($_GET['p']) ? $_GET['p'] : 0;
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CIU330</title>

    <!-- Bootstrap -->
    <link href="<?php echo base_url('css/bootstrap.min.css'); ?>" rel="stylesheet">

    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="<?php echo base_url('css/font-awesome.min.css'); ?>">
    
    <!-- jQuery -->
    <script src="<?php echo base_url('js/jquery-1.12.0.min.js'); ?>"></script>
    
    <!-- Site -->
    <link rel="stylesheet" href="<?php echo base_url('css/main.css'); ?>">
    
    <!--Favicon-->
    <link rel="icon" type="image/png" href="<?php echo base_url('images/icon.png'); ?>">
</head>
<body>
    <h1 class="text-center" style="margin-top: 0px; padding-top: 20px;">CIU330</h1>
<?php if($page == 0) { ?>
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4 form-container">
                <form class="form" method="post" action="">
                    <div class="marg-top-15">
                        <span class="animate">Username</span>
                        <input type="text" name="form-username" class="form-control fullwidth" required />
                    </div>
                    <div class="marg-top-40">
                        <span class="animate">Password</span>
                        <input type="password" name="form-password" class="form-control fullwidth" required />
                    </div>
                    <div class="checkbox no-select marg-top-25">
                        <i class="fa fa-square-o"></i> Keep me signed in
                        <input type="checkbox" hidden="hidden" name="form-auto-login"/>
                    </div>
                    
                    <button type="submit" class="btn action-btn fullwidth marg-top-15">Sign in</button>
                </form>
            </div>
        </div>
    </div>
    
    
    
<?php } else if($page == 1) { ?>
    <div class="container">
        <div class="row">
            <div class="col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3 col-xs-10 col-xs-offset-1 form-container">
                <form class="form" method="post" action="">
                    <div class="marg-top-15">
                        <span class="animate">Username</span>
                        <input type="text" name="form-username" class="form-control fullwidth" required />
                    </div>
                    <div class="marg-top-40">
                        <span class="animate">Password</span>
                        <input type="password" name="form-password" class="form-control fullwidth" required />
                    </div>
                    <div class="marg-top-40">
                        <span class="animate">Re-type Password</span>
                        <input type="password" name="form-password2" class="form-control fullwidth" required disabled />
                    </div>
                    
                    <button type="submit" class="btn action-btn fullwidth marg-top-15" disabled>Register</button>
                </form>
            </div>
        </div>
    </div>
    <script>
        $('input[name="form-password"]').on('keyup', function() {
            if($(this).val() == '') {
                $('input[name="form-password2"]').prop('disabled', true);
            } else {
                $('input[name="form-password2"]').prop('disabled', false);
            }
        });
        
        $('input[name="form-password2"]').on('keyup', function() {
            var selected = $(this);
            
            if(selected.val() == $('input[name="form-password"]').val()) {
                selected.css('border-color', '#2ecc71');
                $('.form button[type="submit"]').prop('disabled', false);
            } else {
                selected.css('border-color', '#e74c3c');
                $('.form button[type="submit"]').prop('disabled', true);
            }
            
            if(selected.val() == '') {
                selected.css('border-color', '#ccc');
                $('.form button[type="submit"]').prop('disabled', true);
            }
        });
    </script>
    
    
    
<?php } else if($page == 2) { ?>
    <div class="container-fluid chat-window-container">
        <div class="row fullheight">
            <div class="col-lg-3 col-md-3 col-sm-2">
                <!--div class="flex-container border marg-bottom-20">
                    <div class="flex-item">
                        <input type="text" id="search-user" class="form-control fullwidth border-0 no-shadow" />
                    </div>
                    <div id="add-user-group" class="icon-sqr">
                        <i class="fa fa-user-plus"></i>
                    </div>
                </div-->
                <div class="contact-opt">
                    <div><i class="fa fa-plus"></i></div>
                    <div>
                        <input type="text" id="search-contact" class="form-control fullwidth fullheight no-shadow" placeholder="Search"/>
                    </div>
                </div>
                <div class="contact-opt2">
                    <div><i class="fa fa-ellipsis-v"></i></div>
                </div>
                <div class="contact-profile">
                    <div></div>
                    <div>User name</div>
                </div>
                <div class="contact-profile">
                    <div></div>
                    <div>User name</div>
                </div>
                <div class="contact-profile">
                    <div></div>
                    <div>User name</div>
                </div>
                <div class="contact-profile">
                    <div></div>
                    <div>User name</div>
                </div>
            </div>
            <div class="col-lg-8 col-md-8 col-sm-8 chat-window border fullheight">
                <div class="msg-recipient flex-container">
                    <div id="back-btn" class="icon-sqr"><i class="fa fa-chevron-left"></i></div>
                    <div class="flex-item"><h4>User name</h4></div>
                    <div class="icon-sqr"><i class="fa fa-plus"></i></div>
                    <div class="icon-sqr"><i class="fa fa-cog"></i></div>
                </div>
                
                <div>
                    <div class="msg-from me fullwidth">
                        <div class="bg-cover"></div>
                        <div class="msg-time">10:27 am</div>
                        <div>Some text message</div>
                    </div>
                    <div class="msg-from other fullwidth">
                        <div class="bg-cover"></div>
                        <div class="msg-time">10:27 am</div>
                        <div>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</div>
                    </div>
                </div>
                
                <!-- chat input -->
                <div class="input-text fullwidth">
                    <div><i class="fa fa-cog"></i></div>
                    <div><input type="text" name="form-password" class="form-control fullwidth" placeholder="Enter a message" required /></div>
                    <div><i class="fa fa-paper-plane"></i> SEND</div>
                </div>
                
                <!-- live text input -->
                <div class="input-text2 fullwidth display-none">
                    <div class="flex-container">
                        <div class="flex-item"><textarea class="input-text2-input"></textarea></div>
                        <div class="input-text2-opt">
                            <div><i class="fa fa-cog"></i></div>
                            <div><i class="fa fa-floppy-o"></i></div>
                        </div>
                    </div>
                </div>
                
                <!-- canvas -->
                <div class="input-canvas fullwidth display-none">
                    <div class="flex-container">
                        <div class="flex-item">
                            <canvas id="canvas" class="input-canvas-input">
                                Sorry, your browser does not support HTML5. Please update to a newer browser.
                            </canvas>
                        </div>
                        <div class="input-canvas-opt">
                            <div><i class="fa fa-paper-plane-o"></i></div>
                            <div id="canvas-opt-save"><i class="fa fa-floppy-o"></i></div>
                            <div id="canvas-opt-clear"><i class="fa fa-trash"></i></div>
                            <div><i class="fa fa-paint-brush"></i></div>
                            <div id="canvas-opt-color">
                                <i class="fa fa-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>
				
				<!-- file upload -->
                <div class="input-file fullwidth display-none">
					<img id="file-prev">
					<i class="fa fa-upload"></i>
                </div>
				
				<!-- geolocation -->
                <div class="input-location fullwidth display-none">
					<!-- id="geolocation-prev" -->
                    <div id="geolocation-prev"></div>
                </div>
				
                <div class="hidden-canvas-input marg-0">
                    <input type="color" value="#354b60" id="color-input"/>
					<input type="file" name="file" id="file-input" />
                </div>
                
            </div>
            <div class="col-lg-1 col-md-1 col-sm-2 padd-0">
                <div class="chat-opt marg-top-0 active" data-chat-opt="text">
                    <i class="fa fa-comment"></i>
                </div>
                <div class="chat-opt" data-chat-opt="canvas">
                    <i class="fa fa-paint-brush"></i>
                </div>
                <div class="chat-opt" data-chat-opt="file">
                    <i class="fa fa-paperclip"></i>
                </div>
                <div class="chat-opt" data-chat-opt="location">
                    <i class="fa fa-map-marker"></i>
                </div>
                <div class="chat-opt" data-chat-opt="tap">
                    <i class="fa fa-hand-pointer-o"></i>
                </div>
                <div class="chat-opt" data-chat-opt="camera">
                    <i class="fa fa-camera"></i>
                </div>
                <div class="chat-opt" data-chat-opt="email">
                    <i class="fa fa-envelope"></i>
                </div>
                <!--div class="chat-opt">
                    <i class="fa fa-font"></i>
                </div-->
            </div>
        </div>
    </div>
    
<?php } ?>
    
    <!--script src="< ?php echo base_url('js/bootstrap.min.js'); ?>"></script-->
    <script src="<?php echo base_url('js/jquery.mobile.custom.min.js'); ?>"></script> 
    <script src="<?php echo base_url('js/main.js'); ?>"></script> 
    <script>

    </script>
</body>
</html>