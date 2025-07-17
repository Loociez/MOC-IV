(function () {
  const MAX_RECORDING_TIME_MS = 5 * 60 * 1000;
  const FILENAME_PREFIX = "Replay_";
  let recorder, recordedChunks = [], recordingTimeout;

  // == UI Button ==
  const btn = document.createElement("button");
  btn.textContent = "▶️";
  Object.assign(btn.style, {
    position: "fixed",
    top: "10px",
    left: "10px",
    width: "80px",
    height: "30px",
    fontSize: "14px",
    backgroundColor: "#222",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    padding: "2px 6px",
    cursor: "pointer",
    zIndex: 999999999,
    opacity: 0.85
  });
  document.body.appendChild(btn);

  async function startRecording() {
    recordedChunks = [];

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 30, // Lower FPS for less lag
          width: { max: 1280 }, // Downscale width
          height: { max: 720 }  // Downscale height
        },
        audio: false
      });

      recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8", // VP8 uses less CPU than VP9
        videoBitsPerSecond: 2500000 // 2.5 Mbps = decent quality, less lag
      });

      recorder.ondataavailable = e => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `${FILENAME_PREFIX}${timestamp}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      btn.textContent = "⏹️";

      recordingTimeout = setTimeout(stopRecording, MAX_RECORDING_TIME_MS);
      stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
    } catch (err) {
      alert("Recording canceled or permission denied.");
    }
  }

  function stopRecording() {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      clearTimeout(recordingTimeout);
      btn.textContent = "▶️";
    }
  }

  btn.onclick = () => {
    if (recorder && recorder.state === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  };
})();
