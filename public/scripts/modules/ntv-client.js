/*
 * NodeTV - scripts/modules/ntv-client.js
 * Author: Gordon Hall
 * 
 * Released under MIT license - see LICENSE
 */

NTV.init = function() {
	
	var modes = {}
	  , result;
	
	// remote mode
	modes.remote = function() {
		
		return {
			success : true,
			mode : 'remote'
		};
	}
	
	// tv mode
	modes.tv = function() {
		
		return {
			success : true,
			mode : 'tv'
		};
	}
	
	// intiialize in mode based on client
	switch(NTV.client) {
		// remote control
		case 'remote':
			console.log('NodeTV initialized in remote control mode.');
			result = modes.remote();
			break;
		case 'tv':
			console.log('NodeTV initialized in TV mode.');
			result = modes.tv();
			break;
		default:
			console.error('NodeTV failed to determine the client type. Initialization failed.');
			result = {
				success : false,
				mode : null
			};
	}
	
	return result;
}
