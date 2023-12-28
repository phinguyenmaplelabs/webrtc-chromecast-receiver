
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
	  showCastPlayer();
	  return loadRequestData;
	});

	/*
	* Handle WebBrowser
	*/
	ctx.addCustomMessageListener(CHANNEL, function(customEvent) {
		var js = customEvent.data;
		console.log(js);
		if (js.type == 'WEB_RTC') {
			showWebRTC(js.ip);
		} else if (js.type == 'CAST_PLAYER') {
			showCastPlayer();
		} else if (js.type == 'SPLASH_SCREEN') {
			showSplashScreen(js.url);
		}
	});
	/*
	* Config playback
	*/
	playbackConfig.autoResumeDuration = 1;
	options.playbackConfig 		= playbackConfig;
	options.supportedCommands	= commands.PAUSE | commands.STREAM_VOLUME | commands.STREAM_MUTE
	ctx.start(options);
}

function showCastPlayer() {
	disconnectWebRTC();
	document.getElementById("cast_player").style.display 	= 'inline';
	document.getElementById("video").style.display 				= 'none';
	document.getElementById("splash").style.display 			= 'none';
	const video = document.getElementById("video");
	video.addEventListener("durationchange", (event) => {
		if (video.playing) {
			if (video.duration - video.currentTime > 3) {
				video.currentTime = video.duration;
			}
		}
	});
}

function showWebRTC(ip) {
	playerManager.stop();
	document.getElementById("cast_player").style.display 	= 'none';
	document.getElementById("video").style.display 				= 'inline';
	document.getElementById("splash").style.display 			= 'none';
	connectWebRTC(ip);
}

function showSplashScreen(url) {
	playerManager.stop();
	disconnectWebRTC();
	document.getElementById("cast_player").style.display 	= 'none';
	document.getElementById("video").style.display 				= 'none';
	document.getElementById("splash").style.display 			= 'inline';
	document.getElementById("splash").src = url;
}







