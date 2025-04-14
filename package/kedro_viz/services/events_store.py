from asyncio import Queue
from typing import List
from fastapi import WebSocket

# [TODO: For now storing globals but this can be 
# expanded to be the event storage file]
connected_websockets: List[WebSocket] = []
event_queue: Queue = Queue()
