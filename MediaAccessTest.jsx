import React, { useRef, useState } from 'react';

function MediaAccessTest() {
    // useRef to directly reference the video DOM element
    const localVideoRef = useRef(null);
    
    // useState to manage the status message displayed to the user
    const [statusMessage, setStatusMessage] = useState(
        'Click the button to grant access and test your media devices.'
    );
    const [streamActive, setStreamActive] = useState(false);

    /**
     * Requests access to the user's camera and microphone.
     * Starts streaming the local video feed.
     */
    const requestMediaAccess = async () => {
        setStatusMessage('Requesting access...');
        
        // Configuration for media access (must be both video and audio for a call)
        const constraints = {
            video: true,
            audio: true
        };

        // Stop any existing stream before starting a new one
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }

        try {
            // 1. Request the media stream (triggers the permission prompt)
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // 2. Attach the stream to the video element
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setStatusMessage('Success! Camera and microphone access granted.');
            setStreamActive(true);
            
            // Note: In a full WebRTC implementation, this 'stream' object is passed 
            // to the RTCPeerConnection to send your media to the remote peer.

        } catch (err) {
            // 3. Handle errors (e.g., permission denied, no camera found)
            let message = 'Error: Could not access media devices. ';
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                message += "You must allow access to your camera and microphone.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                message += "No camera or microphone devices were detected.";
            } else {
                message += err.name;
            }
            
            setStatusMessage(message);
            setStreamActive(false);
            console.error('Media access error:', err);
        }
    };

    /**
     * Stops the media stream and cleans up.
     */
    const stopMediaStream = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }
        setStatusMessage('Media stream stopped. Click "Start Preview" to test again.');
        setStreamActive(false);
    };

    return (
        <div className="media-test-container" style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '15px' }}>
            <h2>Check Your Devices 🎥🎤</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Verify your setup before joining a mentor session.
            </p>

            {/* Video Display Area */}
            <div className="video-preview-box" style={{ 
                maxWidth: '500px', 
                margin: '20px auto', 
                border: streamActive ? '3px solid #667eea' : '2px dashed #ccc', 
                borderRadius: '10px', 
                overflow: 'hidden' 
            }}>
                {/* The video tag needs:
                  - ref: to access the DOM element
                  - autoPlay: to start playback immediately
                  - muted: essential for local preview (avoids feedback loops)
                  - playsInline: necessary for mobile browsers
                */}
                <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    style={{ width: '100%', height: 'auto', display: 'block', background: '#000' }} 
                />
            </div>

            {/* Status Message */}
            <p style={{ marginTop: '15px', color: streamActive ? '#198754' : '#dc3545', fontWeight: 'bold' }}>
                {statusMessage}
            </p>

            {/* Control Buttons */}
            <div className="button-controls" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={requestMediaAccess} 
                    disabled={streamActive}
                >
                    <i className="fas fa-video"></i> Start Preview
                </button>
                <button 
                    className="btn btn-secondary" 
                    onClick={stopMediaStream} 
                    disabled={!streamActive}
                >
                    <i className="fas fa-stop-circle"></i> Stop Preview
                </button>
            </div>
        </div>
    );
}

export default MediaAccessTest;