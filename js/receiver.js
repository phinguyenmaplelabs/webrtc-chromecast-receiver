
const CHANNEL 				= 'urn:x-cast:com.tvcast.chromecast';
const ctx 						= cast.framework.CastReceiverContext.getInstance();
const playerManager 	= ctx.getPlayerManager();
const commands      	= cast.framework.messages.Command;
const playbackConfig 	= new cast.framework.PlaybackConfig();

main();

function main() {
	var options 					= new cast.framework.CastReceiverOptions();
	/*
	*	Handle Player
	*/
	playerManager.setMessageInterceptor(cast.framework.messages.MessageType.LOAD, loadRequestData =>{
		const error = new cast.framework.messages.ErrorData(
                      cast.framework.messages.ErrorType.LOAD_FAILED);
      if (!loadRequestData.media) {
        error.reason = cast.framework.messages.ErrorReason.INVALID_PARAM;
        return error;
	  }
	  return loadRequestData;
	});

	/*
	* Handle WebBrowser
	*/
	ctx.addCustomMessageListener(CHANNEL, function(customEvent) {
		var js = customEvent.data;
		if (js.type == 'WEB_RTC') {
			showWebRTC(js.ip, js.port);
		} else if (js.type == 'CAST_PLAYER') {
			showCastPlayer();
		} else if (js.type == 'SPLASH_SCREEN') {
			showSplashScreen(js.url);
		} else if (js.type == 'TEXT') {
			console.log('TEXT: ' + js.text);
			// To Do
		}
	});
	/*
	* Config playback
	*/
	playbackConfig.autoResumeDuration = 1;
	options.playbackConfig 		= playbackConfig;
	options.supportedCommands	= commands.PAUSE | commands.STREAM_VOLUME | commands.STREAM_MUTE
	ctx.start(options);
	showSplashScreen();
}

function showCastPlayer() {
	if (typeof disconnectWebRTC === 'function') {
		disconnectWebRTC();
	}
	document.getElementById("cast_player").style.display    = 'inline';
	document.getElementById("video").style.display 		    = 'none';
	document.getElementById("splash").style.display 	    = 'none';
	document.getElementById('cast_player').style.objectFit 	= 'cover';
}

function showWebRTC(ip, port) {
	playerManager.stop();
	document.getElementById("cast_player").style.display 	= 'none';
	document.getElementById("video").style.display 	        = 'none';
	document.getElementById("splash").style.display         = 'inline';
	document.getElementById('video').style.objectFit 	    = 'cover';
    document.getElementById('splash').style.objectFit       = 'cover';
	connectWebRTC(ip);
	const video = document.getElementById("video");
	video.addEventListener("durationchange", (event) => {
		if (video.playing) {
			if (video.duration - video.currentTime > 2) {
				video.currentTime = video.duration;
			}
		}
		console.log('duration: ' + video.duration);
		console.log('currentTime: ' + video.currentTime);
	});
}

function showSplashScreen(url) {
	if (typeof disconnectWebRTC === 'function') {
		disconnectWebRTC();
	}
	playerManager.stop();
	document.getElementById("cast_player").style.display 	= 'none';
	document.getElementById("video").style.display 		    = 'none';
	document.getElementById("splash").style.display 	    = 'inline';
	document.getElementById('splash').style.objectFit 		= 'cover';
	checkIfImageExists(url, (exists) => {
      if (exists) {
          document.getElementById('splash').src = url;
      } else {
          document.getElementById('splash').src = "splash.jpeg";
      }
    });
}

function checkIfImageExists(url, callback) {
	if (url) {
		const img = new Image();
  	img.src = url;
  
  	if (img.complete) {
    	callback(true);
  	} else {
    	img.onload = () => {
      	callback(true);
    	};
    
    	img.onerror = () => {
      	callback(false);
    	};
  	}
	} else {
		callback(false);
	}
  
}





