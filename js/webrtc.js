'use strict';

var connected = false,
    aspect = 0,
    peerConnection = null,
    socket = null,
    alternatePort = false,
    oldObjectURL = null;
showSplash(true);

function shouldUseBasicMode() {
    var browser = getBrowser();
    if (browser == 'Tesla') return false;
    if (browser == 'Samsung' || browser == 'Unknown') return true;
    if (browser == 'Chrome' && getBrowserVersion() <= 79) return true;
    if (browser == 'Safari' && getBrowserVersion() < 11) return true;
    return false;
}

function getBrowser() {
    var userAgent = navigator['userAgent'];
    if (userAgent.indexOf('Tesla') > -1) return 'Tesla';
    else {
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        else {
            if (userAgent.indexOf('SamsungBrowser') > -1) return 'Samsung';
            else {
                if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'Opera';
                else {
                    if (userAgent.indexOf('Trident') > -1) return 'Internet Explorer';
                    else {
                        if (userAgent.indexOf('Edge') > -1) return 'Edge';
                        else {
                            if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
                            else return userAgent.indexOf('Safari') > -1 ? 'Safari' : 'Unknown';
                        }
                    }
                }
            }
        }
    }
}

function getBrowserVersion() {
    var userAgent = navigator['userAgent'],
        version, info = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i ['test'](info[1])) return version = /\brv[ :]+(\d+)/g ['exec'](userAgent) || [], {
        'name': 'IE',
        'version': version[1] || ''
    };
    if (info[1] === 'Chrome') {
        version = userAgent.match(/\bOPR|Edge\/(\d+)/);
        if (version != null) return {
            'name': 'Opera',
            'version': version[1]
        };
    }
    return info = info[2] ? [info[1], info[2]] : [navigator.appName, navigator.appVersion, '-?'], (version = userAgent.match(/version\/(\d+)/i)) != null && info.splice(1, 1, version[1]), info[1];
}

function init(isLimited) {
    var mode = isLimited ? 'limited' : 'full',
        json = JSON.stringify({
            'mode': mode
        }),
        data = new Blob([json], {
            'type': 'application/json'
        });
    socket.send(data), initRtcMode();
}

document.getElementById('video') && document.getElementById('video').addEventListener('resize', function () {
    aspect == 0 && (document.getElementById('video').videoWidth > document.getElementById('video').videoHeight ? document.getElementById('video').style.objectFit = 'cover' : document.getElementById('video').style.objectFit = 'contain');
});

function initRtcMode() {
    var optional = {
            'DtlsSrtpKeyAgreement': true
        },
    config = {
            'optional': [optional]
        };
    peerConnection = new RTCPeerConnection(null, config), peerConnection.addEventListener('track', function (track) {
        console.log('rs'), document.getElementById('video').srcObject = track.streams[0], document.getElementById('video').play();
    }, false), peerConnection.onconnectionstatechange = function (event) {
        switch (peerConnection.connectionState) {
        case 'connected':
            showSplash(false), console.log('connected');
            break;
        case 'disconnected':
            showSplash(true), console.log('disconnected'), socket.close();
        case 'failed':
            showSplash(true), console.log('failed'), socket.close();
            break;
        case 'closed':
            closeSocket(), console.log('closed');
            break;
        }
    };
}

function closeSocket() {
    showSplash(true);
    if (socket) {
        socket.onopen = function () {}, socket.onmessage = function () {}, socket.onerror = function () {}, socket.onclose = function () {}, socket.close();
    }   
}

function setRemoteDescription(remoteDescription) {
    peerConnection.setRemoteDescription(remoteDescription).then(function () {
        return console.log('r'), peerConnection.createAnswer([{
            'offerToReceiveAudio': 1,
            'offerToReceiveVideo': 1
        }]);
    }).then(function (localDescription) {
        return console.log('l'), peerConnection.setLocalDescription(localDescription), localDescription;
    }).then(function (payload) {
        console.log('s');
        var message = JSON.stringify({
                'payload': payload,
                'type': 'SessionDescription'
            }),
            data = new Blob([message], {
                'type': 'application/json'
            });
        if (socket == null) return;
        socket.send(data), connected = true;
    }).catch(handleRtcError);
}

function handleRtcError(msgError) {
    console.log(msgError);
}

function onIceCandidate(_0x36634a, _0x1aab27) {
    if (_0x1aab27.candidate == null) return;
    if (socket == null) return;
    var payload = {
            'sdp': _0x1aab27.candidate.candidate,
            'sdpMid': _0x1aab27.candidate.sdpMid,
            'sdpMLineIndex': _0x1aab27.candidate.sdpMLineIndex
        },
        message = JSON.stringify({
            'payload': payload,
            'type': 'IceCandidate'
        }),
        data = new Blob([message], {
            'type': 'application/json'
        });
    socket.send(data);
}

function readFile(data) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result);
        }, reader.readAsText(data);
    });
}

function onLoadReader(data) {
    var message = JSON.parse(data),
        payload = message.payload;
    if (message.type == 'IceCandidate') {
        var iceCandidate = new RTCIceCandidate({
            'candidate': payload.sdp,
            'sdpMid': payload.sdpMid,
            'sdpMLineIndex': payload.sdpMLineIndex
        });
        peerConnection.addIceCandidate(iceCandidate);
        return;
    }
    if (message.type == 'SessionDescription') {
        setRemoteDescription(payload);
        return;
    }
    if (payload.hasOwnProperty('aspect')) {
        aspect = payload.aspect;
        aspect == 1 && (document.getElementById('video').style.objectFit = 'contain');
        aspect == 2 && (document.getElementById('video').style.objectFit = 'cover');
        return;
    }
}

function showSplash(show) {
    document.getElementById('video').style.display = show ? 'none'   : 'inline';
    document.getElementById('splash').style.display = show ? 'inline' : 'none';
    document.getElementById('splash').style.objectFit = 'cover';
}

function connect(ip, port) {
    socket = new WebSocket('ws://'.concat(ip).concat(':').concat(port)), socket.binaryType = 'blob', socket.onopen = function (event) {}, socket.onmessage = function (event) {
        event.data instanceof Blob && readFile(event.data).then(function (data) {
            onLoadReader(data);
        }), typeof event.data == 'string' && (event.data == 'limited' ? init(true) : init(shouldUseBasicMode()));
    }, socket.onclose = function (event) {
        setTimeout(function () {
            if (socket.readyState == 1) return;
            tryConnectingWebSocketAlternativePort(ip);
        }, 1500);
    };
}

function tryConnectingWebSocketAlternativePort(ip) {
    setTimeout(function () {
        if (socket.readyState == 1) return;
        socket.close(), alternatePort = !alternatePort, alternatePort ? connect(ip, 8881) : connect(ip, 8880);
    }, 1500);
}

function connectWebRTC(ip) {
    connect(ip, 8880);
    tryConnectingWebSocketAlternativePort(ip);
}

function disconnectWebRTC() {
    closeSocket();
    if (peerConnection) {
        peerConnection.close();
        peerConnection  = null;
    }
    connected       = false;
    aspect          = 0;
    socket          = null;
    alternatePort   = false;
    oldObjectURL    = null;
}



