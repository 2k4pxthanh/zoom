const socket = io();
const peer = new Peer();

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
const videoElements = {};

// Sử dụng navigator.mediaDevices.getUserMedia để yêu cầu quyền truy cập vào video và audio của người dùng
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream);

    // Set up Web Audio API to detect when user is speaking
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    let speaking = false;
    let silenceThreshold = 23;
    let checkInterval = 500;

    javascriptNode.onaudioprocess = function () {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const volume = array.reduce((a, b) => a + b) / array.length;

        if (volume > silenceThreshold && !speaking) {
            speaking = true;
            myVideo.style.border = '4px solid yellow';
            setTimeout(() => {
                speaking = false;
                myVideo.style.border = '4px solid #999';
            }, checkInterval);
        }
    };

    // Lắng nghe sự kiện 'call' từ PeerJS
    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
            videoElements[call.peer] = video;
        });
    });

    // Lắng nghe sự kiện 'user-connected' từ Socket.io
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });

    const muteButton = document.getElementById('muteButton');
    const cameraButton = document.getElementById('cameraButton');
    let audioEnabled = true;
    let videoEnabled = true;

    muteButton.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        stream.getAudioTracks()[0].enabled = audioEnabled;
        muteButton.innerHTML = audioEnabled ? '<i class="bi bi-mic-fill"></i>' : '<i class="bi bi-mic-mute-fill clred"></i>';
    });

    cameraButton.addEventListener('click', () => {
        videoEnabled = !videoEnabled;
        stream.getVideoTracks()[0].enabled = videoEnabled;
        cameraButton.innerHTML = videoEnabled ? '<i class="bi bi-camera-video-fill"></i>' : '<i class="bi bi-camera-video-off-fill clred"></i>';
    });

}).catch(error => {
    console.error('ERROR! Failed to get user media:', error);
});

// Lắng nghe sự kiện 'user-disconnected' từ Socket.io
socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close();
    if (videoElements[userId]) {
        videoElements[userId].remove();
        delete videoElements[userId];
    }
});

// Khi PeerJS kết nối, gửi sự kiện 'join-room' qua Socket.io
peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});

// Kết nối đến người dùng mới
function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
        videoElements[userId] = video;
    });
    call.on('close', () => {
        if (videoElements[userId]) {
            videoElements[userId].remove();
            delete videoElements[userId];
        }
    });

    peers[userId] = call;
}

// Thêm luồng video vào giao diện
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}
