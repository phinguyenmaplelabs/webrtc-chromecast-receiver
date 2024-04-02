'use strict';

var connected = false,
    aspect = 0,
    peerConnection = null,
    socket = null,
    alternatePort = false,
    oldObjectURL = null;

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
    showSplash(true);
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
            /*
             * Đóng socket hiện tại, nhưng timer của hàm tryConnectingWebSocketAlternativePort bên dưới sẽ tự động connect lại
             * (Suy nghĩ thêm giúp anh chỗ này....)
             */
            showSplash(true), console.log('disconnected'), socket.close();
        case 'failed':
            /*
             * Đóng socket hiện tại, nhưng timer của hàm tryConnectingWebSocketAlternativePort bên dưới sẽ tự động connect lại
             * (Suy nghĩ thêm giúp anh chỗ này....)
             */
            showSplash(true), console.log('failed'), socket.close();
            break;
        case 'closed':
            /*
             * Đóng hoàn toàn Socket, ko tự động connect lại
             */
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
        }), typeof event.data == 'string' && (event.data == 'limited' ? init(true) : init(false));
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



