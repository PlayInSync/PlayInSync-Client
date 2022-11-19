let clientIO: any;
let SERVERURL: string;
let lockDuration = 1000;
let lastLocked = -1000;

type videoStateType = {
  playState: boolean;
  playbackTime: number;
  playbackSpeed: number;
};

// get current playback State Local.
const getPlaybackState = (): videoStateType => {
  const playState = !videoPlayer.paused;
  const playbackTime = videoPlayer.currentTime;
  const playbackSpeed = videoPlayer.playbackRate;

  return { playState, playbackTime, playbackSpeed };
};

// connecting to the server.
const connectHandler = async () => {
  urlInput.disabled = true;
  connectButton.disabled = true;

  if (urlInput.value) {
    try {
      const res = await fetch(urlInput.value);
      if (res) {
        let response = await res.json();
        if (response['state'] === 'Success') {
          localStorage.setItem('SERVERURL', urlInput.value);
          window.location.href = `./watch.html?SERVERURL=${urlInput.value}`;
        }
      }
    } catch (err) {
      urlInput.disabled = false;
      connectButton.disabled = false;

      console.log(err);
      alert('Failed to connect to the server.');
    }
  } else {
    urlInput.disabled = false;
    connectButton.disabled = false;

    alert('Please enter a valid server url.');
  }
};

// handeling first load of /watch page
const onLoadWatch = () => {
  const queryParams = new URLSearchParams(window.location.search);
  SERVERURL =
    localStorage.getItem('SERVERURL') ||
    queryParams.get('SERVERURL') ||
    'http://0.0.0.0:3000';
};


// handeling when sync/play button is pressed
const playHandler = async (e: Event) => {
  e.preventDefault();

  if (file_input.files !== null && file_input.files[0] !== undefined) {
    const objectUrl = URL.createObjectURL(file_input.files[0]);
    videoPlayerDiv.style.display = 'block';
    videoPlayer.src = objectUrl;
    file_div.style.display = 'none';

    // @ts-ignore
    clientIO = io(SERVERURL);
    clientIO.on('connect', (socket: any) => {
      console.log('Connected.');
    });
    clientIO.on('recieve-update', onReceiveUpdate);
  }
};

const sendUpdate = (e: Event) => {
  if (performance.now() - lastLocked > lockDuration) {
    const currentVideoState = getPlaybackState();
    clientIO.emit('update', currentVideoState);
  }
};

const onReceiveUpdate = (playbackState: videoStateType) => {
  lastLocked = performance.now();
  videoPlayer.currentTime = playbackState.playbackTime;
  videoPlayer.playbackRate = playbackState.playbackSpeed;
  playbackState.playState ? videoPlayer.play() : videoPlayer.pause();
};
