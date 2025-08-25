// Install dependencies: npm install react react-dom socket.io-client
// For simplicity, we use only built-in WebRTC functionality (RTCPeerConnection)
import React, { useRef, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

// The signaling server address (change if necessary)
const SIGNALING_SERVER_URL = 'http://localhost:5000';

function VideoCall({ sessionId, mentorName, onClose }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const [status, setStatus] = useState('Connecting...');
    const [callStarted, setCallStarted] = useState(false);
    const remotePeerId = useRef(null);

    // --- 1. WebRTC Utilities (The Core Logic) ---

    // Function to set up the WebRTC Peer Connection
    const createPeerConnection = useCallback((isInitiator) => {
        // Public Google STUN server for NAT traversal
        const iceServers = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        const pc = new RTCPeerConnection(iceServers);

        // Track ICE candidates (network info)
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // Send the ICE candidate to the other peer via the signaling server
                socketRef.current.emit('signal', {
                    to: remotePeerId.current,
                    signal: event.candidate,
                });
            }
        };

        // Track remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track');
            if (remoteVideoRef.current && event.streams && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Add local tracks to the connection
        if (localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => {
                pc.addTrack(track, localVideoRef.current.srcObject);
            });
        }
        
        peerConnectionRef.current = pc;
        return pc;
    }, []);

    // Function to initiate an Offer
    const createOffer = useCallback(async (pc) => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Send the Offer to the other peer via the signaling server
            socketRef.current.emit('signal', {
                to: remotePeerId.current,
                signal: pc.localDescription,
            });
            setStatus('Waiting for mentor to accept...');
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }, []);

    // Function to handle receiving a signal (Offer/Answer/Candidate)
    const handleSignal = useCallback(async (data) => {
        if (data.from !== remotePeerId.current || !data.signal) return;
        
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
            if (data.signal.type === 'offer') {
                // Received an Offer, set remote and create Answer
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send the Answer back
                socketRef.current.emit('signal', {
                    to: remotePeerId.current,
                    signal: pc.localDescription,
                });
                setStatus('Call established.');
            } else if (data.signal.type === 'answer') {
                // Received an Answer, set remote
                await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                setStatus('Call established.');
            } else if (data.signal.candidate) {
                // Received an ICE candidate
                await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
            }
        } catch (error) {
            console.error('Error handling signal:', error);
        }
    }, []);

    // --- 2. Initialization and Socket.IO Setup ---

    useEffect(() => {
        const init = async () => {
            // 1. Get Local Media Stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setCallStarted(true);
            } catch (err) {
                console.error('Error accessing media devices:', err);
                setStatus('Error: Microphone/Camera access denied.');
                return;
            }

            // 2. Initialize Socket.IO Connection
            socketRef.current = io(SIGNALING_SERVER_URL);

            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current.id);
                // 3. Join the Call Room
                socketRef.current.emit('joinRoom', sessionId, (response) => {
                    if (response.success) {
                        remotePeerId.current = response.otherPeerId;
                        
                        // If there is another peer already in the room, we are the 'Answerer'
                        if (response.otherPeerId) {
                            setStatus('Connecting to mentor...');
                            createPeerConnection(false);
                        } else {
                            // If we are the first peer, we are the 'Initiator' (will send Offer later)
                            setStatus('Waiting for mentor to join...');
                            createPeerConnection(true);
                        }
                    } else {
                        setStatus(response.message);
                    }
                });
            });

            // 4. Handle Incoming Signals
            socketRef.current.on('signal', handleSignal);

            // 5. Handle New Peer Joining (Initiator Role)
            socketRef.current.on('userJoined', (peerId) => {
                remotePeerId.current = peerId;
                setStatus('Mentor joined, creating offer...');
                // The current peer becomes the Initiator
                createOffer(peerConnectionRef.current);
            });

            // 6. Handle Peer Leaving
            socketRef.current.on('userLeft', () => {
                setStatus('Mentor has disconnected.');
                peerConnectionRef.current.close();
                remoteVideoRef.current.srcObject = null;
            });
        };

        init();

        // --- Cleanup on unmount ---
        return () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                 localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [sessionId, createPeerConnection, createOffer, handleSignal]);

    // --- 3. UI and Actions ---
    
    const handleEndCall = () => {
        // Clean up everything on button click
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (localVideoRef.current && localVideoRef.current.srcObject) {
             localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (socketRef.current) {
            // Notify the server about leaving the room
            socketRef.current.emit('disconnect'); 
        }
        onClose(); // Call the function passed by parent (to close the modal)
    };

    return (
        <div className="video-call-container">
            <h3>Call with {mentorName}</h3>
            <p className="call-status">Status: {status}</p>

            <div className="video-streams">
                <div className="local-video-box">
                    <h4>You</h4>
                    {/* The `autoPlay`, `muted`, and `playsInline` attributes are crucial for video playback */}
                    <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
                </div>
                <div className="remote-video-box">
                    <h4>{mentorName}</h4>
                    <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                </div>
            </div>

            <div className="call-controls">
                <button className="btn btn-primary" onClick={handleEndCall}>
                    <i className="fas fa-phone-slash"></i> End Call
                </button>
            </div>
        </div>
    );
}

export default VideoCall;

// Note: You would also need CSS for 'video-call-container', 'video-streams', etc.