main();

function main() {
	const CHANNEL 				= 'urn:x-cast:com.tvcast.chromecast';
	const ctx 						= cast.framework.CastReceiverContext.getInstance();
	const playerManager 	= ctx.getPlayerManager();
	const commands      	= cast.framework.messages.Command;
	const playbackConfig 	= new cast.framework.PlaybackConfig();
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
		if (js.type == 'webrtc') {
			let ip = js.ip;
			connect(ip, 8880), tryConnectingWebSocketAlternativePort(ip);
			playerManager.stop();
			showWebRTC();
		} else if (js.type == 'close_browser') {
			showCastPlayer();
		} else if (js.type == 'muted') {
			document.getElementById("video").muted = false;
		} else if (js.type == 'play') {
			document.getElementById("video").play();
		}else if (js.type == 'pause') {
			document.getElementById("video").pause();
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
	document.getElementById("cast_player").style.visibility = 'visible';
	document.getElementById("video").style.visibility 			= 'hidden';
}

function showWebRTC() {
    document.getElementById("cast_player").style.visibility = 'hidden';
    document.getElementById("video").style.visibility 			= 'visible';
}