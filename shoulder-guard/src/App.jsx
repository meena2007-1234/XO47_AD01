import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceCount, setFaceCount] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Registration & Security States
  const [isRegistered, setIsRegistered] = useState(() => {
    return localStorage.getItem("shoulderguard_registered") === "true";
  });
  const [shouldBlur, setShouldBlur] = useState(false);
  const audioCtxRef = useRef(null);

  // Audio Warning Alert
  const playAlertSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error("Audio Error:", e);
    }
  };

  // Load Models
  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelLoaded(true);
      } catch (err) {
        console.error("Model loading error:", err);
        setCameraError("Failed to load face detection model.");
      }
    }
    loadModels();
  }, []);

  // Multi-Face Detection Loop
  const detectFaces = async () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === 4 &&
      canvasRef.current &&
      modelLoaded
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const displaySize = {
        width: video.videoWidth || 640,
        height: video.videoHeight || 480,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.15,
        })
      );

      const totalFaces = detections.length;
      setFaceCount(totalFaces);

      // Trigger Blur & Alert if Stranger Detected (> 1 face)
      if (totalFaces > 1) {
        setShouldBlur(true);
        playAlertSound();
      } else {
        setShouldBlur(false);
      }

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach((det, index) => {
        const { x, y, width, height } = det.box;

        const isMulti = totalFaces > 1;
        const strokeColor = isMulti ? (index === 0 ? "#00e676" : "#ff4d4d") : "#00e676";
        const labelText = isMulti ? (index === 0 ? "Primary User" : "Stranger 🚨") : "Primary User";

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.font = "bold 16px Arial";
        ctx.fillText(labelText, x, y > 20 ? y - 8 : y + 20);
      });
    }

    animFrameId.current = requestAnimationFrame(detectFaces);
  };

  const startCamera = async (isRegistering = false) => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true);
          if (!isRegistering) {
            detectFaces();
          }
        };
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      setCameraError("Camera access denied or unavailable.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setFaceCount(0);
    setShouldBlur(false);
  };

  useEffect(() => {
    if (screen === "camera" || screen === "register") {
      startCamera(screen === "register");
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [screen, modelLoaded]);

  // Handler Functions
  const sendOtp = () => {
    if (mobile.length === 10) setScreen("otp");
    else alert("Please enter a valid 10-digit mobile number");
  };

  const verifyOtp = () => {
    if (otp.length === 6) {
      if (isRegistered) {
        setScreen("dashboard");
      } else {
        setScreen("register");
      }
    } else {
      alert("Please enter a 6-digit OTP");
    }
  };

  const handleRegisterFace = () => {
    localStorage.setItem("shoulderguard_registered", "true");
    setIsRegistered(true);
    alert("Primary Face Registered Successfully! Redirecting to Dashboard...");
    setScreen("dashboard");
  };

  const handleResetRegistration = () => {
    localStorage.removeItem("shoulderguard_registered");
    setIsRegistered(false);
    setScreen("register");
  };

  return (
    <div className="app">
      {/* 1. WELCOME SCREEN */}
      {screen === "welcome" && (
        <div className="card">
          <div className="shield">🛡️</div>
          <h1>ShoulderGuard</h1>
          <p className="subtitle">Smart Shoulder Surfing Protection</p>
          <p className="description">
            Protect your sensitive information from people looking at your screen.
          </p>
          <button onClick={() => setScreen("login")}>Get Started</button>
          <div className="privacy">🔒 Your privacy is our priority</div>
        </div>
      )}

      {/* 2. LOGIN SCREEN */}
      {screen === "login" && (
        <div className="card">
          <div className="icon">📱</div>
          <h2>Welcome Back</h2>
          <p className="description">Enter your mobile number to continue</p>
          <input
            type="tel"
            placeholder="Enter mobile number"
            maxLength="10"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          />
          <button onClick={sendOtp}>Send OTP</button>
        </div>
      )}

      {/* 3. OTP SCREEN */}
      {screen === "otp" && (
        <div className="card">
          <div className="icon">🔐</div>
          <h2>Verify OTP</h2>
          <p className="description">Enter 6-digit OTP sent to <strong>+91 {mobile}</strong></p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />
          <button onClick={verifyOtp}>Verify & Continue</button>
        </div>
      )}

      {/* 4. PRIMARY FACE REGISTRATION SCREEN */}
      {screen === "register" && (
        <div className="card camera-card">
          <div className="icon">👤</div>
          <h2>Register Primary Face</h2>
          <p className="description">Look directly into the camera to save your profile.</p>

          <div className="camera-box">
            {cameraError ? (
              <p className="error-message">{cameraError}</p>
            ) : (
              <div className="video-container">
                <video ref={videoRef} autoPlay playsInline muted />
              </div>
            )}
          </div>

          <button onClick={handleRegisterFace} style={{ background: "#28a745" }}>
            📸 Capture & Save Profile
          </button>
        </div>
      )}

      {/* 5. DASHBOARD SCREEN */}
      {screen === "dashboard" && (
        <div className="card">
          <div className="shield">🛡️</div>
          <h1>User Dashboard</h1>
          <p className="subtitle">System Status: Ready</p>
          <div className="status" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            🟢 Primary Profile Registered
          </div>

          <button onClick={() => setScreen("camera")} style={{ marginBottom: "10px" }}>
            📷 Start Protection Monitoring
          </button>

          <button onClick={handleResetRegistration} style={{ background: "#6c757d" }}>
            ⚙️ Re-register Face Profile
          </button>
        </div>
      )}

      {/* 6. CAMERA MONITORING SCREEN */}
      {screen === "camera" && (
        <div className="card camera-card">
          <div className="icon">👥</div>
          <h2>Active Protection Feed</h2>
          <p className="description">Real-time Multi-Face Detection Enabled</p>

          <div className={`camera-box ${shouldBlur ? "blur-screen" : ""}`}>
            {cameraError ? (
              <p className="error-message">{cameraError}</p>
            ) : (
              <div className="video-container">
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} className="overlay-canvas" />
              </div>
            )}
          </div>

          <div className={`status ${faceCount > 1 ? "status-warning" : "status-safe"}`}>
            {!modelLoaded && "⌛ Loading AI Face Model..."}
            {modelLoaded && faceCount === 0 && "🟡 Searching for faces..."}
            {modelLoaded && faceCount === 1 && "🟢 1 Face Detected (Safe)"}
            {modelLoaded && faceCount > 1 && `🚨 ${faceCount} Faces Detected! (Blur Active)`}
          </div>

          <button onClick={() => setScreen("dashboard")}>
            Stop Monitoring
          </button>
        </div>
      )}
    </div>
  );
}

export default App;