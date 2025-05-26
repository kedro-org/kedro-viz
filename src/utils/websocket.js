/**
 * WebSocket manager for real-time pipeline updates
 */

class PipelineWebSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = {
      beforeDatasetLoaded: [],
      afterDatasetLoaded: [],
      beforeNodeRun: [],
      afterNodeRun: [],
      beforeDatasetSaved: [],
      afterDatasetSaved: [],
      afterPipelineRun: [],
      onNodeError: [],
      onPipelineError: [],
    };
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.isConnected = true;
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleEvent(message.type, message.data);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;

      // Optional: auto-reconnect after delay
      setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  addEventListener(eventType, callback) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(callback);
    return this;
  }

  removeEventListener(eventType, callback) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(
        (handler) => handler !== callback
      );
    }
    return this;
  }

  handleEvent(eventType, data) {
    const handlers = this.eventHandlers[eventType] || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    });
  }
}

const pipelineWebSocketInstance = new PipelineWebSocket();
export default pipelineWebSocketInstance;
