/*
 * NodeTV - scripts/modules/remote-client.js
 * Author: Gordon Hall
 * 
 * Released under MIT license - see LICENSE
 */

NTV.remote = (function() {
	
	// get remote DOM elements
	var remote = $('#remote')
	  , buttons = {
			left : $('.left', remote),
			right : $('.right', remote),
			up : $('.up', remote),
			down : $('.down', remote),
			menu : $('.menu', remote),
			back : $('.back', remote),
			select : $('.select', remote),
			play : $('.play', remote),
			stop : $('.stop', remote),
			trackLeft : $('.trackLeft', remote),
			trackRight : $('.trackRight', remote)
		}
	  , actions = null
	  , touchpad = $('#touchpad')
	  , hint = $('.instructions', touchpad)
	  , connected = false
	  , autoScroll;
		
	// we need to create an action set that can be switched
	// on the fly, so first an action set constructor and
	// then a method for switching the current active action set
	var ActionSet = function(action_obj) {	
		// pull in all the valid properties
		this.actions = action_obj;
	}
	// allow switching out actions indirectly
	ActionSet.prototype.enable = function() {
		actions = this.actions;
	}
	
	// create the default action set
	NTV.actions.applist = new ActionSet({
		up : function(e) {
			NTV.remote.navList.go('up');
		},
		down : function(e) {
			NTV.remote.navList.go('down');
		},
		select : function(e) {
			NTV.remote.navList.go('select');
		}
	});
	// enable the default action set for app list
	NTV.actions.applist.enable();
	
	// bind the remote buttons to the mapped actions
	if (NTV.client === 'remote') {
	    // prevent scroll
	    $(document).bind('touchmove', function(event) {
	       event.preventDefault();    
	    });
	    // bind button interaction
		blueprint.each(buttons, function(button, elm) {
			elm.bind('touchstart', function(event) {
			    // add active class
			    $(event.target).addClass('pressed');
				// send socket.io event
				NTV.socket.emit('buttonPress', { 
					pressed : button
				});
			});
			elm.bind('touchend', function(event) {
			    // remove active class
                $(event.target).removeClass('pressed');
			});
		});
		// set up touchpad logic
		touchpad.bind('touchstart', function(event) {
		    var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]
		      , pos = {
		        x : touch.pageX,
		        y : touch.pageY
		    }, dist = 64;
		    // dismiss hints
		    hint.fadeOut(1200, function() {
		        hint.remove();
		    });
		    // if only one finger is detected
		    if (event.originalEvent.touches.length === 1) {
    		    // try to kill the interval if it's still alive
    		    if (autoScroll) {
    		        clearInterval(autoScroll);
    		    }		    
    		    // trigger select on tap
    		    touchpad.bind('touchend', function(event) {
    		        buttons.select.trigger('touchstart');
    		    });
    		    // cancel select on move and scroll in appropriate direction
    		    touchpad.bind('touchmove', function(event) {
    		        // create a handler for when the user swipes and hold position
    		        function onHold(callback) {
    		            touchpad.unbind('touchmove');
                        autoScroll = setInterval(callback, 200);
                        touchpad.bind('touchend', function() {
                            clearInterval(autoScroll);
                            touchpad.unbind('touchend');
                        });
                        touchpad.bind('touchcancel', function() {
                            clearInterval(autoScroll);
                            touchpad.unbind('touchcancel');
                        });
    		        }
    		        // prevent select from firing
    		        touchpad.unbind('touchend');
    		        // get touch event data
    		        var newTouch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]
    		          , newPos = {
    		            x : newTouch.pageX,
    		            y : newTouch.pageY
    		        };
    		        // determine the direction of the swipe
    		        if (newPos.x >= pos.x + dist) { // tracking right
    		            buttons.right.trigger('touchstart');
    		            onHold(function() {
                            buttons.right.trigger('touchstart');
                        });
    		        } else if (newPos.x <= pos.x - dist) { // tracking left
                        buttons.left.trigger('touchstart');
                        onHold(function() {
                            buttons.left.trigger('touchstart');
                        });
    		        } else if (newPos.y >= pos.y + dist) { // tracking down 
                        buttons.down.trigger('touchstart');
                        onHold(function() {
                            buttons.down.trigger('touchstart');
                        });
    		        } else if (newPos.y <= pos.y - dist) { // tracking up
                        buttons.up.trigger('touchstart');
                        onHold(function() {
                            buttons.up.trigger('touchstart');
                        });
    		        }
    		    });
    	    } else {
    	        var touches = event.originalEvent.touches;
    	        // catch multi touch actions
    	        switch(touches.length) {
    	            case 2:
    	               // 2 fingers
    	               break;
    	            default:
    	               // do nothing
    	        }
    	    }
		});
		
	}
	
	// listen for socket.io event to execute callback
	// if in tv mode, also map to keyboard function 
	// in case user does not have a remote
	if (NTV.client === 'tv') {
		// tell server what type of device connected
		NTV.socket.on('remoteConnected', function(data) {
			NTV.ui.notify('Remote Connected!');
			NTV.remote.connected = true;
		});
		
		NTV.socket.on('buttonPress', function(button) {
			console.log('Remote input detected: ' + button.pressed);
			// play click sound
			NTV.ui.sounds.play('click');
			if (actions[button.pressed]) {
				actions[button.pressed].call(this);
			}
		});
	
		// map button events to keyboard
		tappa.state({
			'up' : function() {
				// up
				NTV.ui.sounds.play('click');
				NTV.remote.navList.go('up');
			},
			'down' : function() {
				// down
				NTV.ui.sounds.play('click');
				NTV.remote.navList.go('down');
			},
			'enter' : function() {
				// select
				NTV.ui.sounds.play('click');
				NTV.remote.navList.go('select');
			}
		});
	}
	
	// app list navigation logic
	var navList = (function() {
	    
	    function go(direction) {
	        var list = $('.ntv_app')
	          , current = $('.ntv_app.has_focus')[0]
	          , id = $(current).attr('data-appid');
	        
	        switch(direction) {
	            case 'up':
	               // move up
	               if (!(current === list[0])) {
	                   NTV.ui.focusOn($(current).prev());
	               } else {
	                   NTV.ui.focusOn(list[list.length - 1]);
	               }
	               break;
	            case 'down':
	               // move down
                   if (!(current === (list[list.length - 1]))) {
                       NTV.ui.focusOn($(current).next());
                   } else {
                       NTV.ui.focusOn(list[0]);
                   }
	               break;
	            case 'select':
	               NTV.launch(id);	               
	               break;
	            default:
	               // do nothing
	        }
	        
	        return {
	            go : go
	        };
	    }
	    
	    return {
	        go : go
	    };
	    
	})();
	
	return {
		ActionSet : ActionSet,
		navList : navList,
		connected : connected
	};
	
})();
