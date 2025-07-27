(function () {
  const MAX_RECORDING_TIME_MS = 15 * 60 * 1000; // 15 minutes
  const FILENAME_PREFIX = "Replay_";
  let recorder, recordedChunks = [], recordingTimeout, requestInterval;

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
          frameRate: 30,
          width: { max: 1280 },
          height: { max: 720 }
        },
        audio: true
      });

      if (!stream || !stream.getTracks().length) {
        alert("No valid stream selected.");
        return;
      }

      // Try fullscreen for UI-less experience
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.warn);
      }

      recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 2500000
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(requestInterval);

        if (recordedChunks.length === 0) {
          alert("Recording failed: no data was captured.");
          return;
        }

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = url;
        a.download = `${FILENAME_PREFIX}${timestamp}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.warn);
        }
      };

      recorder.start(1000); // 1-second chunking for better reliability

      // Manual flush to ensure all data gets saved periodically
      requestInterval = setInterval(() => {
        if (recorder && recorder.state === "recording") {
          recorder.requestData();
        }
      }, 5000); // every 5 seconds

      btn.textContent = "⏹️";

      recordingTimeout = setTimeout(stopRecording, MAX_RECORDING_TIME_MS);
      stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
    } catch (err) {
      alert("Recording canceled or permission denied.");
      console.error(err);
    }
  }

  function stopRecording() {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      clearTimeout(recordingTimeout);
      clearInterval(requestInterval);
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
