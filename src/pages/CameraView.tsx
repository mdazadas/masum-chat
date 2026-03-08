import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, ZapOff, RefreshCw, Send, Image as ImageIcon, Moon, Type, Trash2, Sparkles } from 'lucide-react';
import { setPendingMedia } from '../pendingMediaStore';

const CameraView = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const lightDetectorCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestCountRef = useRef(0);

    // States
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mode, setMode] = useState<'photo' | 'video'>('photo');
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0); // seconds
    const [isLowLight, setIsLowLight] = useState(false);

    // Preview States
    interface PreviewContent {
        url: string;
        type: 'image' | 'video';
        capturedDuration?: number; // In seconds, for videos
        file?: File | Blob;
        autoEnhanced?: boolean;
    }
    const [previewMedia, setPreviewMedia] = useState<PreviewContent | null>(null);
    const [caption, setCaption] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Custom video player state for preview
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Auto Light Detection Loop
    useEffect(() => {
        if (!stream || !videoRef.current) return;
        const video = videoRef.current;
        let canvas = lightDetectorCanvasRef.current;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            (lightDetectorCanvasRef as any).current = canvas;
        }

        const detectLight = () => {
            if (!video || !canvas) return;
            // Only analyze if video is actively playing
            if (video.readyState < 2) return;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            try {
                // Draw a downsampled frame to minimize CPU usage
                ctx.drawImage(video, 0, 0, 64, 64);
                const imageData = ctx.getImageData(0, 0, 64, 64).data;
                let sumLuminance = 0;
                let sampleCount = 0;

                // Sample every 4th pixel for speed
                for (let i = 0; i < imageData.length; i += 16) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    // Standard luminance formula
                    sumLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
                    sampleCount++;
                }

                const avgLuminance = sumLuminance / sampleCount;

                // Aggressive low light threshold (under ~100 out of 255 covers most indoor/dim lighting)
                const DARKEN_THRESHOLD = 100;

                if (avgLuminance < DARKEN_THRESHOLD && !isLowLight) {
                    setIsLowLight(true);
                    triggerLowLightConstraints(stream, true);
                } else if (avgLuminance > DARKEN_THRESHOLD + 20 && isLowLight) {
                    // Add hysteresis (+20) so it doesn't flicker
                    setIsLowLight(false);
                    triggerLowLightConstraints(stream, false);
                }
            } catch (err) { }
        };

        const intervalId = setInterval(detectLight, 1000);
        return () => clearInterval(intervalId);
    }, [stream, isLowLight]);

    // Apply hardware constraints to brighten the feed
    const triggerLowLightConstraints = async (activeStream: MediaStream, lowLightOn: boolean) => {
        const videoTrack = activeStream.getVideoTracks()[0];
        if (!videoTrack || !videoTrack.getCapabilities) return;

        try {
            const capabilities: any = videoTrack.getCapabilities();
            const constraints: any = { advanced: [{}] };

            if (lowLightOn) {
                // Drop framerate to allow more light per frame
                if (capabilities.frameRate) {
                    videoTrack.applyConstraints({ frameRate: { ideal: 15 } }).catch(() => { });
                }
                // Try ImageCapture auto-enhancements if supported
                if (capabilities.exposureMode?.includes('continuous')) {
                    constraints.advanced[0].exposureMode = 'continuous';
                }
                if (capabilities.whiteBalanceMode?.includes('continuous')) {
                    constraints.advanced[0].whiteBalanceMode = 'continuous';
                }
                if (capabilities.exposureCompensation) {
                    constraints.advanced[0].exposureCompensation = capabilities.exposureCompensation.max;
                }
            } else {
                // Restore normal framerate
                if (capabilities.frameRate) {
                    videoTrack.applyConstraints({ frameRate: { ideal: 30 } }).catch(() => { });
                }
                if (capabilities.exposureCompensation) {
                    constraints.advanced[0].exposureCompensation = 0;
                }
            }

            if (Object.keys(constraints.advanced[0]).length > 0) {
                await videoTrack.applyConstraints(constraints);
            }
        } catch (err) {
            console.warn("Could not apply low light constraints:", err);
        }
    };


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

        const currentReq = ++requestCountRef.current;

        // Wait for the hardware to fully release the previous camera track.
        // This is strictly required on Android Chrome to prevent 'NotReadableError' when switching lenses.
        await new Promise(resolve => setTimeout(resolve, 300));

        setPermissionError(null);
        setIsLowLight(false);
        try {
            // Precise constraints for better compatibility
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                    // Removed initial advanced focus constraints as they crash front-facing cameras on many devices.
                },
                audio: retryWithVideoOnly ? false : true // Decouple audio if requested
            };

            const newStream = await navigator.mediaDevices.getUserMedia(constraints);

            // If the user rapidly toggled the camera while we were waiting, abort immediately
            if (!videoRef.current || currentReq !== requestCountRef.current) {
                newStream.getTracks().forEach(t => t.stop());
                return null;
            }

            streamRef.current = newStream;
            videoRef.current.srcObject = newStream;

            // Ensure video plays and handles autoplay policies
            try {
                await videoRef.current.play();
            } catch (playErr) {
                console.warn("Autoplay was prevented, waiting for user interaction");
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
        const activeStream = streamRef.current || stream;
        if (activeStream) {
            // Reverting constraints right before track.stop() causes race conditions in WebRTC on some devices
            // Just stop the tracks, the hardware reset will handle the rest natively.
            activeStream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
            streamRef.current = null;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
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
            setPreviewMedia({ url, type, file });
            stopCamera();
        }
    };

    const takePhoto = async () => {
        if (videoRef.current) {
            const video = videoRef.current;

            // Safety Check: Ensure video is ready and has valid dimensions
            if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn("Camera not ready for capture yet.");
                return;
            }

            // Use organic video dimensions
            const width = video.videoWidth;
            const height = video.videoHeight;

            // 1. Capture the raw, unmodified frame
            const rawCanvas = document.createElement('canvas');
            rawCanvas.width = width;
            rawCanvas.height = height;
            const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });

            if (rawCtx) {
                if (isFrontCamera) {
                    rawCtx.translate(width, 0);
                    rawCtx.scale(-1, 1);
                }
                rawCtx.drawImage(video, 0, 0, width, height);

                // 2. Analyze the actual captured frame (skip every 4th pixel for speed)
                const imageData = rawCtx.getImageData(0, 0, width, height).data;
                let sumLuminance = 0;
                let sampleCount = 0;

                for (let i = 0; i < imageData.length; i += 16) {
                    // Standard luminance formula: 0.299*R + 0.587*G + 0.114*B
                    sumLuminance += (0.299 * imageData[i]) + (0.587 * imageData[i + 1]) + (0.114 * imageData[i + 2]);
                    sampleCount++;
                }

                const avgLuminance = sumLuminance / sampleCount;
                console.log(`Captured photo average luminance: ${avgLuminance.toFixed(2)} / 255`);

                // 3. Apply Dynamic Enhancement if dark
                // A bright office is ~150-200. A standard room is ~90-120. Dark is < 70.
                if (avgLuminance < 110) {
                    // Calculate dynamic multipliers. 
                    // The darker it is, the stronger the multiplier, but capped to avoid white-out.
                    // E.g., if avgLuminance is 55, ratio is 110/55 = 2.0. We cap brightness boost to max 1.6x
                    const brightnessRatio = Math.min(1.6, Math.max(1.1, 110 / Math.max(avgLuminance, 20)));

                    // Contrast boost gets slightly higher the darker it is to combat washed out grey shadows
                    const contrastBoost = Math.min(1.3, 1.05 + ((110 - avgLuminance) * 0.003));

                    // Slight saturation boost to restore color lost in darkness
                    const saturationBoost = 1.15;

                    console.log(`Applying enhancement: brightness(${brightnessRatio.toFixed(2)}) contrast(${contrastBoost.toFixed(2)})`);

                    // Create a secondary canvas for the final processed image
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = width;
                    finalCanvas.height = height;
                    const finalCtx = finalCanvas.getContext('2d');

                    if (finalCtx) {
                        // Apply the calculated hardware filters natively to the rendering context
                        finalCtx.filter = `brightness(${brightnessRatio}) contrast(${contrastBoost}) saturate(${saturationBoost})`;
                        // Draw the raw image *through* the filter onto the final canvas
                        finalCtx.drawImage(rawCanvas, 0, 0);

                        // Output the enhanced blob
                        finalCanvas.toBlob((blob) => {
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                setPreviewMedia({ url, type: 'image', file: blob, autoEnhanced: true });
                                stopCamera();
                            }
                        }, 'image/jpeg', 0.95);
                        return; // Exit early since we handled the enhanced path
                    }
                }

                // 4. Output the raw blob if no enhancement was needed (or if finalCtx failed)
                rawCanvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setPreviewMedia({ url, type: 'image', file: blob, autoEnhanced: false });
                        stopCamera();
                    }
                }, 'image/jpeg', 0.92);
            }
        }
    };

    const startRecording = (activeStream: MediaStream) => {
        const localChunks: Blob[] = [];
        const startTimeMs = Date.now();

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
                // Calculate precise duration to avoid React state stale closures
                const finalTimeSec = (Date.now() - startTimeMs) / 1000;
                console.log("Recorder stopped, finalTime:", finalTimeSec);
                if (localChunks.length > 0) {
                    const blob = new Blob(localChunks, { type: mimeType || 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setPreviewMedia({ url, type: 'video', capturedDuration: finalTimeSec, file: blob });
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
        if (!previewMedia || isSending) { navigate(-1); return; }
        setIsSending(true);
        // Store in-memory (avoids localStorage 5MB limit for videos)
        setPendingMedia({
            url: previewMedia.url,
            type: previewMedia.type,
            caption: caption.trim() || undefined,
            timestamp: Date.now(),
            file: previewMedia.file // Pass the raw Blob/File to avoid failing blob URL fetches across components
        });
        navigate(-1);
    };

    const discardPreview = () => {
        if (previewMedia && previewMedia.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewMedia.url);
        }
        setPreviewMedia(null);
        setCaption('');
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
                        {previewMedia.autoEnhanced && (
                            <div className="auto-enhanced-badge fade-in">
                                <Sparkles size={14} color="#ffd700" fill="#ffd700" />
                                <span>Auto-Enhanced</span>
                            </div>
                        )}
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

                {/* Send Controls - Fixed at bottom */}
                <div className="send-controls-container">
                    {/* Caption input similar to WhatsApp */}
                    <div className="caption-input-wrapper">
                        <Type size={20} color="#fff" style={{ opacity: 0.7 }} />
                        <input
                            type="text"
                            placeholder="Add a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="caption-input"
                            onKeyPress={(e) => e.key === 'Enter' && sendMedia()}
                        />
                    </div>

                    <div className="send-action-row">
                        <button className="preview-action-btn delete-btn" onClick={discardPreview}>
                            <Trash2 size={24} color="#ff3b30" />
                        </button>

                        <button className="preview-action-btn send-btn" onClick={sendMedia} disabled={isSending}>
                            {isSending ? (
                                <div className="mini-spinner" style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            ) : (
                                <Send size={24} color="#fff" style={{ marginLeft: '2px' }} />
                            )}
                        </button>
                    </div>
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
                   /* Preview UI Reset */
                .send-controls-container {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 12px 12px max(24px, env(safe-area-inset-bottom));
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    box-sizing: border-box;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(10px);
                    z-index: 20;
                }

                .caption-input-wrapper {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 24px;
                    padding: 10px 14px;
                }

                .caption-input {
                    flex: 1;
                    min-width: 0;
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    margin-left: 8px;
                }

                .caption-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .send-action-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .preview-action-btn {
                    width: 48px;
                    height: 48px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.2s, background 0.2s;
                }
                
                .preview-action-btn:active {
                    transform: scale(0.9);
                }
                
                .delete-btn {
                    background: rgba(255, 59, 48, 0.2);
                }
                
                .send-btn {
                    background: #25D366;
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
                <div style={{ display: 'flex', gap: '15px' }}>
                    {isLowLight && (
                        <div className="night-mode-indicator fade-in">
                            <Moon size={20} color="#ffd700" fill="#ffd700" />
                        </div>
                    )}
                    {mode === 'photo' && !isRecording && (
                        <button className="cam-control-btn" onClick={() => setFlashOn(!flashOn)}>
                            {flashOn ? <Zap size={24} color="#ffd700" /> : <ZapOff size={24} />}
                        </button>
                    )}
                </div>
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
                        className={isLowLight ? 'low-light-video' : ''}
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
                    <button className="cam-secondary-btn" onClick={handleGalleryClick} title="Gallery">
                        <div className="gallery-preview-stub">
                            <ImageIcon size={20} color="white" />
                        </div>
                    </button>

                    <button
                        className={`capture-trigger ${mode === 'video' ? 'video-mode' : ''} ${isRecording ? 'recording' : ''}`}
                        onClick={captureAction}
                        title={isRecording ? "Stop recording" : (mode === 'video' ? "Start recording" : "Take photo")}
                    >
                        <div className="inner-circle"></div>
                    </button>

                    <button className="cam-secondary-btn" onClick={toggleCamera} title="Switch camera">
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
                
                .night-mode-indicator {
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(10px);
                    padding: 8px 12px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,215,0,0.3);
                }
                
                .fade-in {
                    animation: fadeInNight 0.4s ease-out;
                }
                
                @keyframes fadeInNight {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .low-light-video {
                    /* Software night brightness enhancement for viewfinder */
                    filter: brightness(1.25) contrast(1.15) saturate(1.1);
                    transition: filter 0.5s ease;
                }
                
                /* Auto-Enhanced Badge */
                .auto-enhanced-badge {
                    position: absolute;
                    top: 15px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(8px);
                    padding: 6px 14px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    z-index: 50;
                    border: 1px solid rgba(255,215,0,0.4);
                }
                
                .auto-enhanced-badge span {
                    color: #fff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default CameraView;
