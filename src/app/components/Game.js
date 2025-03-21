"use client";
import { useEffect, useRef, useState } from "react";

const Game = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [detectedCards, setDetectedCards] = useState([]);
  const [isWebSocketStarted, setIsWebSocketStarted] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  // Check Camera Permission
  useEffect(() => {
    async function checkPermission() {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" });

        if (permissionStatus.state === "granted") {
          console.log("✅ Camera permission granted.");
          setCameraPermission(true);
          startCamera(); // Start camera immediately
        } else if (permissionStatus.state === "denied") {
          console.error("❌ Camera permission denied.");
          setCameraPermission(false);
          setCameraError("Camera access is blocked. Please enable it in your browser settings.");
        } else {
          console.log("🔔 Asking user for camera permission...");
          setCameraPermission(null);
        }
      } catch (error) {
        console.error("❌ Error checking camera permission:", error);
        setCameraPermission(false);
      }
    }

    checkPermission();
  }, []);

  // Start Camera Function (Only runs if permission is granted)
  async function startCamera() {
    try {
      console.log("🔍 Detecting cameras...");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === "videoinput");

      if (videoDevices.length === 0) {
        throw new Error("❌ No cameras found.");
      }

      const selectedCamera = videoDevices[videoDevices.length - 1].deviceId; // Use last detected camera
      console.log(`🎥 Using camera: ${selectedCamera}`);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera }, width: 640, height: 480 }
      });

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        console.log("✅ Camera stream loaded!");

        // Start drawing video frames on canvas
        const drawVideoOnCanvas = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Draw detection boxes if available
            drawDetectionBoxes(ctx);
          }

          requestAnimationFrame(drawVideoOnCanvas);
        };

        requestAnimationFrame(drawVideoOnCanvas);
      }
    } catch (err) {
      console.error("❌ Camera access error:", err);
      setCameraError(err.message);
    }
  }

  // Draw bounding boxes for detected cards
  const drawDetectionBoxes = (ctx) => {
    if (!detectedCards || !detectedCards.length) return;
    
    detectedCards.forEach(card => {
      if (!card.bbox || card.bbox.length !== 4) return;
      
      const [x1, y1, x2, y2] = card.bbox;
      const width = x2 - x1;
      const height = y2 - y1;
      
      // Draw rectangle around the card
      ctx.strokeStyle = '#00FF00'; // Bright green
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);
      
      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x1, y1 - 30, width, 30);
      
      // Draw label text
      const confidence = card.confidence ? Math.round(card.confidence * 100) : '??';
      const label = `${card.label} (${confidence}%)`;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(label, x1 + 5, y1 - 10);
    });
  };

  // Start/Stop WebSocket Connection
  const toggleWebSocket = () => {
    if (isWebSocketStarted) {
      // Stop the connection
      console.log("🛑 Stopping WebSocket connection...");
      if (ws) {
        ws.close();
        setWs(null);
      }
      setIsWebSocketStarted(false);
      setDetectedCards([]);
    } else {
      // Start the connection
      try {
        setIsWebSocketStarted(true);
        console.log("🔄 Starting WebSocket connection...");
        
        const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        const backendURL = `${protocol}localhost:8000/video-detect`;
        console.log(`🔗 Connecting to: ${backendURL}`);

        const socket = new WebSocket(backendURL);
        setWs(socket);

        socket.onopen = () => {
          console.log("✅ WebSocket connection established");
          // Start sending frames immediately after connection is established
          const canvas = canvasRef.current;
          if (canvas) {
            console.log("🎥 Canvas ready, starting frame capture");
          } else {
            console.error("❌ Canvas not found");
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📥 Received data:", data);
            
            if (data.error) {
              console.error("❌ Server error:", data.error);
              return;
            } else if (data.info) {
              console.log("ℹ️ Server info:", data.info);
              return;
            } else if (data.detections) {
              console.log(`🎴 Detected ${data.detections.length} cards`);
              setDetectedCards(data.detections);
            }
          } catch (error) {
            console.error("❌ Error parsing WebSocket message:", error);
          }
        };

        socket.onerror = (error) => {
          console.error("❌ WebSocket Error:", error);
          setIsWebSocketStarted(false);
          setWs(null);
        };

        socket.onclose = (event) => {
          console.log("🔌 WebSocket closed", event.code, event.reason);
          setIsWebSocketStarted(false);
          setWs(null);
        };
      } catch (error) {
        console.error("❌ Error creating WebSocket:", error);
        setIsWebSocketStarted(false);
        setWs(null);
      }
    }
  };

  // Capture and send frames to WebSocket
  useEffect(() => {
    if (!isWebSocketStarted || !ws || ws.readyState !== WebSocket.OPEN) {
      console.log("⏳ Waiting for WebSocket connection...", {
        isWebSocketStarted,
        wsState: ws?.readyState
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("❌ Canvas not available");
      return;
    }
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("❌ Canvas context not available");
      return;
    }

    const captureFrame = () => {
      // Direct approach to convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob && ws.readyState === WebSocket.OPEN) {
          ws.send(blob);
          console.log("📤 Sent frame");
        } else {
          console.log("⚠️ WebSocket not ready, skipping frame");
        }
      }, "image/jpeg", 0.8);
    };

    console.log("🎥 Starting frame capture");
    const interval = setInterval(captureFrame, 500);
    return () => {
      console.log("🛑 Stopping frame capture");
      clearInterval(interval);
    };
  }, [ws, isWebSocketStarted]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Edge21</h1>

      {/* Camera Permission Prompt */}
      {cameraPermission === null && (
        <button
          className="px-6 py-2 bg-green-500 text-white rounded-lg mb-4"
          onClick={startCamera}
        >
          Grant Camera Access
        </button>
      )}

      {/* Camera Error Message */}
      {cameraError && <p className="text-red-500">{cameraError}</p>}

      {/* Start/Stop WebSocket Button */}
      <button
        className={`px-6 py-2 text-white rounded-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed ${
          isWebSocketStarted ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
        }`}
        onClick={toggleWebSocket}
      >
        {isWebSocketStarted ? "Stop Detection" : "Start Detection"}
      </button>

      {/* Video is hidden; we display it on the canvas instead */}
      <video ref={videoRef} className="hidden" width="640" height="480" autoPlay playsInline />

      {/* Canvas for Displaying Video & Sending Frames */}
      <canvas ref={canvasRef} width="640" height="480" className="border-4 border-blue-500 rounded-lg shadow-lg" />

      {/* Detected Cards List */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg w-full max-w-md">
        <h2 className="text-xl mb-2">Detected Cards:</h2>
        {detectedCards.length === 0 ? (
          <p className="text-yellow-400">No cards detected</p>
        ) : (
          <div className="space-y-2">
            {detectedCards.map((card, idx) => (
              <div key={idx} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                <span className="text-xl font-semibold text-yellow-400">{card.label}</span>
                {card.confidence && (
                  <span className="bg-blue-600 px-2 py-1 rounded text-sm">
                    {Math.round(card.confidence * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
