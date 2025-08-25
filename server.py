import socketio
from aiohttp import web
import logging

# 1. Setup Logging and Socket.IO Server
# -------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('signaling_server')

# Initialize the Socket.IO server. 
# 'cors_allowed_origins='*'' is essential for browser communication.
sio = socketio.AsyncServer(cors_allowed_origins='*')
app = web.Application()
sio.attach(app)

# In-memory store for managing peer connections (Simple P2P Room logic)
rooms = {}  # { room_id: [sid1, sid2, ...] }
peers = {}  # { sid: room_id }

# 2. Connection and Disconnection Handlers
# ----------------------------------------
@sio.event
async def connect(sid, environ):
    """Handles a new client connection."""
    logger.info(f"Connected: {sid}")

@sio.event
def disconnect(sid):
    """Handles client disconnection and notifies the peer."""
    logger.info(f"Disconnected: {sid}")
    room_id = peers.pop(sid, None)
    
    if room_id and room_id in rooms:
        # Remove the user from the room list
        rooms[room_id].remove(sid)
        
        # Notify the remaining peer
        if rooms[room_id]:
            other_peer_id = rooms[room_id][0]
            logger.info(f"Notifying {other_peer_id} about disconnection of {sid}")
            sio.emit('userLeft', sid, room=other_peer_id)
        
        # Clean up empty room
        if not rooms[room_id]:
            del rooms[room_id]

# 3. Join Room Logic
# ------------------
@sio.event
async def joinRoom(sid, data, callback):
    """Client requests to join a specific room (session ID)."""
    room_id = data.get('roomId')
    
    if not room_id:
        callback({'success': False, 'message': 'Invalid room ID'})
        return

    # WebRTC P2P only supports 2 peers per room
    if room_id in rooms and len(rooms[room_id]) >= 2:
        callback({'success': False, 'message': 'Room is full'})
        return

    # Enter the room
    sio.enter_room(sid, room_id)
    peers[sid] = room_id
    rooms.setdefault(room_id, []).append(sid)
    
    logger.info(f"SID {sid} joined room {room_id}")

    # Determine if an "other peer" is present
    other_peer_id = next((s for s in rooms[room_id] if s != sid), None)

    if other_peer_id:
        logger.info(f"New peer {sid} triggering 'userJoined' signal to {other_peer_id}")
        # Signal the existing peer to start the connection negotiation (send offer)
        await sio.emit('userJoined', sid, room=other_peer_id)
        
    callback({'success': True, 'otherPeerId': other_peer_id})

# 4. Signaling Message Relay
# --------------------------
@sio.event
async def signal(sid, data):
    """Relays WebRTC signaling data (Offer, Answer, ICE Candidate)."""
    to_sid = data.get('to')
    signal_data = data.get('signal')
    
    if to_sid and signal_data:
        logger.info(f"Relaying signal from {sid} to {to_sid}")
        # Relay the signal directly to the specified target peer
        await sio.emit('signal', {
            'from': sid,
            'signal': signal_data
        }, room=to_sid)

# 5. AIOHTTP Server Setup
# -----------------------
async def index(request):
    """Simple route to confirm server is running."""
    return web.Response(text="EduMatch Signaling Server is Running", content_type='text/html')

app.router.add_get('/', index)

if __name__ == '__main__':
    print("Starting WebRTC Signaling Server on http://192.168.56.1:5000")
    web.run_app(app, host='192.168.56.1', port=5000)