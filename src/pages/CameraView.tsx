import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, ZapOff, RefreshCw, Send, Image as ImageIcon } from 'lucide-react';
import { setPendingMedia } from '../pendingMediaStore';

const CameraView = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // States
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mode, setMode] = useState<'photo' | 'video'>('photo');
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0); // seconds

    // Preview States
    const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video', capturedDuration?: number } | null>(null);

    // Custom video player state for preview
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [isFrontCamera]);

    // Handle Flash/Torch
    useEffect(() => {
        if (!stream || isFrontCamera) return;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
            const capabilities = videoTrack.getCapabilities() as any;
            if (capabilities.torch) {
                videoTrack.applyConstraints({
                    advanced: [{ torch: flashOn }]
                } as any).catch(err => console.error("Flash error:", err));
            }
        }
    }, [flashOn, stream, isFrontCamera]);

    const startCamera = async (retryWithVideoOnly = false) => {
        stopCamera();
        setPermissionError(null);
        try {
            // Precise constraints for better compatibility
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: retryWithVideoOnly ? false : true // Decouple audio if requested
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
                // Ensure video plays and handles autoplay policies
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn("Autoplay was prevented, waiting for user interaction");
                }
            }
            setStream(newStream);
            return newStream;
        } catch (err: any) {
            console.error("Camera Access Error:", err.name, err.message);

            // Automatic Fallback: If Audio failed/denied, try Video Only
            if (!retryWithVideoOnly && (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'PermissionDeniedError')) {
                console.log("Audio failed/denied, retrying with Video only...");
                return startCamera(true);
            }

            let errorMsg = "Could not access camera.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg = "Camera/Mic permission denied. Please enable them in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg = "No camera found on this device.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMsg = "Camera is already in use by another application.";
            }

            setPermissionError(errorMsg);
            return null;
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const toggleCamera = () => {
        setIsFrontCamera(!isFrontCamera);
    };

    const handleGalleryClick = () => {
        galleryInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const type = file.type.startsWith('video') ? 'video' : 'image';
            const url = URL.createObjectURL(file);
            setPreviewMedia({ url, type });
            stopCamera();
        }
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            // Use organic video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (isFrontCamera) {
                    // Correct mirroring for front camera captures
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setPreviewMedia({ url: dataUrl, type: 'image' });
                stopCamera();
            }
        }
    };

    const startRecording = (activeStream: MediaStream) => {
        const localChunks: Blob[] = [];

        // Supported mimeTypes (trying most compatible first)
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4', // Common for iOS
            'video/quicktime'
        ];

        const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
        console.log("Recording with:", mimeType);

        try {
            const recorder = new MediaRecorder(activeStream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    localChunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const finalTime = recordingTime; // Capture the current state ref
                console.log("Recorder stopped, finalTime:", finalTime);
                if (localChunks.length > 0) {
                    const blob = new Blob(localChunks, { type: mimeType || 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setPreviewMedia({ url, type: 'video', capturedDuration: finalTime });
                    stopCamera();
                }
            };

            // Timeslice (1000ms) helps ensure data is collected regularly
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingTime(0);
        } catch (err) {
            console.error("MediaRecorder start error:", err);
        }
    };

    const stopRecordingAction = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Recording seconds counter
    useEffect(() => {
        if (!isRecording) return;
        const timer = setInterval(() => setRecordingTime(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, [isRecording]);

    /* Redundant recording completion useEffect removed: logic moved to recorder.onstop */

    const captureAction = async () => {
        if (mode === 'photo') {
            takePhoto();
        } else {
            if (isRecording) {
                stopRecordingAction();
            } else {
                // IMPORTANT: Ensure stream is ready before recording
                let currentStream = stream;
                if (!currentStream || !currentStream.active) {
                    currentStream = await startCamera();
                }
                if (currentStream) {
                    startRecording(currentStream);
                }
            }
        }
    };

    const sendMedia = () => {
        if (!previewMedia) { navigate(-1); return; }
        // Store in-memory (avoids localStorage 5MB limit for videos)
        setPendingMedia({
            url: previewMedia.url,
            type: previewMedia.type,
            timestamp: Date.now()
        });
        navigate(-1);
    };

    const discardPreview = () => {
        if (previewMedia && previewMedia.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewMedia.url);
        }
        setPreviewMedia(null);
        startCamera();
    };

    if (previewMedia) {
        const formatTime = (s: number) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, '0')}`;
        };
        const togglePlay = () => {
            const v = previewVideoRef.current;
            if (!v) return;
            if (v.paused) { v.play(); setIsPlaying(true); }
            else { v.pause(); setIsPlaying(false); }
        };
        const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = previewVideoRef.current;
            if (!v) return;
            const t = parseFloat(e.target.value);
            v.currentTime = t;
            setCurrentTime(t);
        };

        return (
            <div className="preview-container">
                {/* Header overlay */}
                <div className="preview-header">
                    <button className="preview-close-btn" onClick={discardPreview}>
                        <X size={26} />
                    </button>
                    <div style={{ paddingRight: '12px' }}>
                        {/* Optional tools like Crop/Sticker could go here */}
                    </div>
                </div>

                {/* Content - Media in a frame */}
                <div className="preview-content">
                    <div className="media-frame">
                        {previewMedia.type === 'image' ? (
                            <img src={previewMedia.url} alt="Captured" className="framed-media" />
                        ) : (
                            <div className="video-player-container">
                                <video
                                    ref={previewVideoRef}
                                    src={previewMedia.url}
                                    playsInline
                                    autoPlay
                                    preload="auto"
                                    className="framed-media"
                                    onTimeUpdate={() => setCurrentTime(previewVideoRef.current?.currentTime ?? 0)}
                                    onLoadedMetadata={() => {
                                        const video = previewVideoRef.current;
                                        if (video) {
                                            // Handle cases where duration is Infinity or NaN (common for blobs)
                                            const videoDuration = video.duration;
                                            if (videoDuration && isFinite(videoDuration)) {
                                                setDuration(videoDuration);
                                            } else if (previewMedia.capturedDuration) {
                                                setDuration(previewMedia.capturedDuration);
                                            }
                                        }
                                    }}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                {/* Custom video controls - sit inside/below frame */}
                                <div className="custom-video-controls">
                                    <div className="controls-row-top">
                                        <input
                                            type="range"
                                            className="video-seek-bar"
                                            min={0}
                                            max={duration || 1}
                                            step={0.01}
                                            value={currentTime}
                                            onChange={handleSeek}
                                        />
                                    </div>
                                    <div className="controls-row-bottom">
                                        <div className="time-group">
                                            <span className="video-time">{formatTime(currentTime)}</span>
                                            <span className="time-separator">/</span>
                                            <span className="video-time">{formatTime(duration)}</span>
                                        </div>
                                        <div className="main-playback-controls">
                                            <button className="seek-btn" onClick={() => { if (previewVideoRef.current) previewVideoRef.current.currentTime -= 5; }}>
                                                -5s
                                            </button>
                                            <button className="mini-play-btn" onClick={togglePlay}>
                                                {isPlaying ? '⏸' : '▶'}
                                            </button>
                                            <button className="seek-btn" onClick={() => { if (previewVideoRef.current) previewVideoRef.current.currentTime += 5; }}>
                                                +5s
                                            </button>
                                        </div>
                                        <div style={{ width: '60px' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* WhatsApp Style Bottom Actions Bar */}
                <div className="preview-actions-bar">
                    <button className="retake-action" onClick={discardPreview}>
                        <div className="retake-icon">↺</div>
                        <span>Retake</span>
                    </button>

                    <div className="caption-box">
                        <input type="text" placeholder="Add a caption..." className="caption-input" readOnly />
                    </div>

                    <button className="send-fab" onClick={sendMedia}>
                        <Send size={24} color="white" />
                    </button>
                </div>

                {/* Bottom area is now dedicated to video controls or empty for images */}

                <style>{`
                    .preview-container {
                        position: fixed;
                        inset: 0;
                        width: 100dvw;
                        height: 100dvh;
                        background: #000;
                        z-index: 6000;
                        display: flex;
                        flex-direction: column;
                    }
                    .preview-header {
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 16px;
                        padding-top: max(16px, env(safe-area-inset-top));
                        z-index: 10;
                    }
                    .preview-close-btn {
                        background: rgba(0,0,0,0.4);
                        border: none;
                        color: white;
                        width: 44px; height: 44px;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        backdrop-filter: blur(8px);
                        cursor: pointer;
                    }
                    .preview-content {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 70px 0 120px 0;
                        background: #000;
                    }
                    .media-frame {
                        width: 100%;
                        height: 100%;
                        max-width: 95vw;
                        max-height: 75vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        border-radius: 12px;
                        background: #000;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    }
                    .framed-media {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        display: block;
                    }
                    .video-player-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .preview-actions-bar {
                        position: absolute;
                        bottom: 0; left: 0; right: 0;
                        padding: 16px;
                        padding-bottom: max(24px, env(safe-area-inset-bottom));
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
                        z-index: 20;
                    }
                    .retake-action {
                        background: none;
                        border: none;
                        color: white;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 2px;
                        cursor: pointer;
                        min-width: 60px;
                        transition: opacity 0.2s;
                    }
                    .retake-action:active { opacity: 0.6; }
                    .retake-icon {
                        font-size: 26px;
                        line-height: 1;
                    }
                    .retake-action span {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        font-weight: 600;
                        opacity: 0.9;
                    }
                    .caption-box {
                        flex: 1;
                        background: rgba(45,45,45,0.85);
                        backdrop-filter: blur(15px);
                        border-radius: 26px;
                        padding: 12px 18px;
                        border: 1px solid rgba(255,255,255,0.08);
                        display: flex;
                        align-items: center;
                    }
                    .caption-input {
                        width: 100%;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 15px;
                        outline: none;
                        font-family: inherit;
                    }
                    .caption-input::placeholder {
                        color: rgba(255,255,255,0.4);
                    }
                    .send-fab {
                        width: 56px; height: 56px;
                        background: #00a884;
                        border: none;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 4px 16px rgba(0,168,132,0.4);
                        cursor: pointer;
                        transition: transform 0.1s, background-color 0.2s;
                    }
                    .send-fab:active {
                        transform: scale(0.9);
                        background-color: #008f70;
                    }
                    .custom-video-controls {
                        position: absolute;
                        bottom: 4px; left: 4px; right: 4px;
                        padding: 12px 16px;
                        background: rgba(20,20,20,0.7);
                        backdrop-filter: blur(8px);
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.05);
                        z-index: 5;
                    }
                    .controls-row-top { margin-bottom: 6px; }
                    .controls-row-bottom {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .time-group {
                        display: flex; gap: 4px; font-size: 11px; font-weight: 700; color: #fff;
                        font-variant-numeric: tabular-nums;
                        opacity: 0.9;
                    }
                    .main-playback-controls { display: flex; align-items: center; gap: 18px; }
                    .seek-btn {
                        background: rgba(255,255,255,0.1); border: none; color: #fff; 
                        padding: 4px 10px; border-radius: 8px;
                        font-size: 11px; font-weight: 800;
                        cursor: pointer;
                    }
                    .mini-play-btn {
                        background: #fff; color: #000; border: none;
                        width: 36px; height: 36px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 16px; cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    .mini-play-btn:active { transform: scale(0.92); }
                    .video-seek-bar {
                        width: 100%; -webkit-appearance: none; height: 5px; border-radius: 2.5px;
                        background: rgba(255,255,255,0.2); outline: none; cursor: pointer;
                    }
                    .video-seek-bar::-webkit-slider-thumb {
                        -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
                        background: #00a884; border: 2.5px solid white;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    }
                    /* Remove redundant styles */
                `}</style>
            </div>
        );
    }


    return (
        <div className="camera-view-container">
            <input
                type="file"
                ref={galleryInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileChange}
            />

            {/* Header Controls */}
            <div className="camera-header">
                <button className="cam-control-btn" onClick={() => navigate(-1)}>
                    <X size={28} />
                </button>
                {mode === 'photo' && !isRecording && (
                    <button className="cam-control-btn" onClick={() => setFlashOn(!flashOn)}>
                        {flashOn ? <Zap size={24} color="#ffd700" /> : <ZapOff size={24} />}
                    </button>
                )}
            </div>

            {/* Camera Preview */}
            <div className="camera-preview-area">
                {permissionError ? (
                    <div className="permission-error-box">
                        <div className="error-icon-circle">
                            <X size={32} color="white" />
                        </div>
                        <h3>Permissions Required</h3>
                        <p>{permissionError}</p>
                        <div className="permission-hints">
                            <span>Check browser address bar for 🔒 icon</span>
                            <span>Ensure no other app is using the camera</span>
                        </div>
                        <button className="retry-btn" onClick={() => startCamera()}>
                            Grant Permissions
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: isFrontCamera ? 'scaleX(-1)' : 'none' }}
                    />
                )}

                {mode === 'video' && isRecording && (() => {
                    const m = Math.floor(recordingTime / 60);
                    const s = recordingTime % 60;
                    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
                    return (
                        <div className="recording-indicator">
                            <div className="red-dot"></div>
                            <span>REC</span>
                            <span className="rec-timer">{timeStr}</span>
                        </div>
                    );
                })()}
            </div>

            {/* Bottom Controls */}
            <div className="camera-footer">
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${mode === 'video' ? 'active' : ''}`}
                        onClick={() => { setMode('video'); startCamera(); }}
                    >
                        VIDEO
                    </button>
                    <button
                        className={`mode-btn ${mode === 'photo' ? 'active' : ''}`}
                        onClick={() => setMode('photo')}
                    >
                        PHOTO
                    </button>
                </div>

                <div className="main-controls">
                    <button className="cam-secondary-btn" onClick={handleGalleryClick}>
                        <div className="gallery-preview-stub">
                            <ImageIcon size={20} color="white" />
                        </div>
                    </button>

                    <button
                        className={`capture-trigger ${mode === 'video' ? 'video-mode' : ''} ${isRecording ? 'recording' : ''}`}
                        onClick={captureAction}
                    >
                        <div className="inner-circle"></div>
                    </button>

                    <button className="cam-secondary-btn" onClick={toggleCamera}>
                        <RefreshCw size={28} />
                    </button>
                </div>

                <div className="footer-hint">
                    {mode === 'video' ? (isRecording ? "Tap to stop" : "Tap for video") : "Tap for photo"}
                </div>
            </div>

            <style>{`
                .camera-view-container {
                    position: fixed;
                    top: 0; right: 0; bottom: 0; left: 0;
                    background-color: #000;
                    z-index: 5000;
                    display: flex;
                    flex-direction: column;
                    color: white;
                    overflow: hidden;
                }

                .camera-header {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    z-index: 10;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
                }

                .cam-control-btn {
                    background: none; border: none; color: white; cursor: pointer; padding: 8px;
                }

                .camera-preview-area {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .camera-preview-area video {
                    width: 100%; height: 100%; object-fit: cover;
                }

                .permission-error-box {
                    padding: 40px 20px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    max-width: 300px;
                }

                .error-icon-circle {
                    width: 64px; height: 64px; border-radius: 50%; background: #ff3b30;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 8px;
                }

                .permission-error-box h3 { margin: 0; font-size: 20px; font-weight: 700; }
                .permission-error-box p { margin: 0; font-size: 14px; opacity: 0.8; line-height: 1.5; }

                .permission-hints {
                    display: flex; flex-direction: column; gap: 8px; margin: 10px 0;
                    font-size: 12px; opacity: 0.6; font-style: italic;
                }

                .retry-btn {
                    background: #fff; color: #000; border: none; padding: 12px 32px; border-radius: 25px; 
                    font-weight: 700; cursor: pointer; transition: transform 0.2s;
                    box-shadow: 0 4px 12px rgba(255,255,255,0.2);
                }
                .retry-btn:active { transform: scale(0.95); }

                .recording-indicator {
                    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.5); padding: 4px 12px; border-radius: 20px;
                    display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600;
                }

                .rec-timer {
                    color: #ff3b30;
                    font-size: 14px;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.5px;
                }

                .red-dot {
                    width: 10px; height: 10px; background-color: #ff3b30; border-radius: 50%; animation: blink 1s infinite;
                }

                @keyframes blink { 50% { opacity: 0; } }

                .camera-footer {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    padding: 30px 20px 40px;
                    background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
                    display: flex; flex-direction: column; align-items: center; gap: 20px;
                }

                .mode-selector { display: flex; gap: 30px; margin-bottom: 10px; }
                .mode-btn { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 700; letter-spacing: 1px; cursor: pointer; }
                .mode-btn.active { color: #ffd700; }

                .main-controls { width: 100%; display: flex; justify-content: space-around; align-items: center; }
                .cam-secondary-btn {
                    background: rgba(255,255,255,0.15); border: none; color: white;
                    width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
                }

                .gallery-preview-stub {
                    width: 36px; height: 36px; border-radius: 4px; border: 2px solid white;
                    display: flex; align-items: center; justify-content: center;
                }

                .capture-trigger {
                    width: 80px; height: 80px; border-radius: 50%; background: none; border: 5px solid white; padding: 4px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
                }
                .capture-trigger:active { transform: scale(0.9); }
                .inner-circle { width: 100%; height: 100%; background-color: white; border-radius: 50%; transition: all 0.2s; }
                .capture-trigger.video-mode .inner-circle { background-color: #ff3b30; }
                .capture-trigger.recording .inner-circle { transform: scale(0.5); border-radius: 4px; }

                .footer-hint { color: rgba(255,255,255,0.5); font-size: 12px; }
            `}</style>
        </div>
    );
};

export default CameraView;
