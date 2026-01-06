import { EnvironmentalData, RiskLevel } from '../types';

export interface IoTSensorConfig {
  sensorId: string;
  location: string;
  type: 'temperature' | 'humidity' | 'combined';
  calibrationOffset?: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface IoTDataCallback {
  onData: (data: EnvironmentalData) => void;
  onError: (error: Error) => void;
  onConnectionChange: (connected: boolean) => void;
}

export class IoTDataService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private callbacks: IoTDataCallback[] = [];
  private lastData: Map<string, EnvironmentalData> = new Map();
  
  private readonly config: Required<WebSocketConfig>;
  private readonly sensors: Map<string, IoTSensorConfig> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Register IoT sensor configuration
   */
  registerSensor(sensor: IoTSensorConfig): void {
    this.sensors.set(sensor.sensorId, sensor);
  }

  /**
   * Start IoT data connection
   */
  async connect(): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      await this.establishConnection();
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionChange(true);
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from IoT data stream
   */
  disconnect(): void {
    this.cleanup();
    this.notifyConnectionChange(false);
  }

  /**
   * Subscribe to IoT data updates
   */
  subscribe(callback: IoTDataCallback): () => void {
    this.callbacks.push(callback);

    // Send last known data immediately if available
    this.lastData.forEach(data => {
      callback.onData(data);
    });

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get last known data for all sensors
   */
  getLastKnownData(): EnvironmentalData[] {
    return Array.from(this.lastData.values());
  }

  /**
   * Get last known data for specific sensor
   */
  getLastKnownDataBySensor(sensorId: string): EnvironmentalData | null {
    return this.lastData.get(sensorId) || null;
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status information
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    lastDataTimestamp: Date | null;
    activeSensors: number;
  } {
    const lastTimestamps = Array.from(this.lastData.values()).map(d => d.timestamp);
    const lastDataTimestamp = lastTimestamps.length > 0 
      ? new Date(Math.max(...lastTimestamps.map(d => d.getTime())))
      : null;

    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      lastDataTimestamp,
      activeSensors: this.lastData.size
    };
  }

  /**
   * Simulate IoT data for testing/demo purposes
   */
  startSimulation(interval: number = 5000): () => void {
    const simulationTimer = setInterval(() => {
      const mockData = this.generateMockData();
      this.processIncomingData(mockData);
    }, interval);

    return () => clearInterval(simulationTimer);
  }

  // Private methods

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.url);

        this.websocket.onopen = () => {
          console.log('IoT WebSocket connected');
          this.isConnecting = false;
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log('IoT WebSocket closed:', event.code, event.reason);
          this.handleDisconnection();
        };

        this.websocket.onerror = (error) => {
          console.error('IoT WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            this.websocket?.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const rawData = JSON.parse(event.data);
      
      // Validate and process the data
      if (this.isValidIoTMessage(rawData)) {
        const environmentalData = this.parseIoTMessage(rawData);
        this.processIncomingData(environmentalData);
      } else {
        console.warn('Invalid IoT message format:', rawData);
      }
    } catch (error) {
      console.error('Failed to parse IoT message:', error);
      this.notifyError(new Error('Invalid IoT data format'));
    }
  }

  private isValidIoTMessage(data: any): boolean {
    return (
      data &&
      typeof data.sensorId === 'string' &&
      typeof data.temperature === 'number' &&
      typeof data.humidity === 'number' &&
      data.timestamp
    );
  }

  private parseIoTMessage(rawData: any): EnvironmentalData {
    const sensor = this.sensors.get(rawData.sensorId);
    const calibrationOffset = sensor?.calibrationOffset || 0;

    return {
      temperature: rawData.temperature + calibrationOffset,
      humidity: rawData.humidity,
      timestamp: new Date(rawData.timestamp),
      sensorId: rawData.sensorId,
      riskLevel: this.calculateRiskLevel(
        rawData.temperature + calibrationOffset,
        rawData.humidity
      )
    };
  }

  private calculateRiskLevel(temperature: number, humidity: number): RiskLevel {
    // Risk assessment based on agricultural storage conditions
    const tempRisk = temperature > 35 || temperature < 5;
    const humidityRisk = humidity > 80 || humidity < 10;

    if (tempRisk && humidityRisk) {
      return RiskLevel.RED;
    } else if (tempRisk || humidityRisk) {
      return RiskLevel.YELLOW;
    } else {
      return RiskLevel.GREEN;
    }
  }

  private processIncomingData(data: EnvironmentalData): void {
    // Store last known data
    this.lastData.set(data.sensorId, data);

    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback.onData(data);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  private handleDisconnection(): void {
    this.cleanup();
    this.notifyConnectionChange(false);
    this.attemptReconnection();
  }

  private handleConnectionError(error: Error): void {
    console.error('IoT connection error:', error);
    this.notifyError(error);
    this.attemptReconnection();
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyError(new Error('Failed to reconnect to IoT service'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  private cleanup(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.isConnecting = false;
  }

  private notifyConnectionChange(connected: boolean): void {
    this.callbacks.forEach(callback => {
      try {
        callback.onConnectionChange(connected);
      } catch (error) {
        console.error('Connection change callback error:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.callbacks.forEach(callback => {
      try {
        callback.onError(error);
      } catch (callbackError) {
        console.error('Error callback failed:', callbackError);
      }
    });
  }

  private generateMockData(): EnvironmentalData {
    // Generate realistic mock data for demo
    const sensorIds = ['sensor-001', 'sensor-002'];
    const sensorId = sensorIds[Math.floor(Math.random() * sensorIds.length)];
    
    const temperature = 20 + Math.random() * 20; // 20-40°C
    const humidity = 30 + Math.random() * 50; // 30-80%

    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      timestamp: new Date(),
      sensorId,
      riskLevel: this.calculateRiskLevel(temperature, humidity)
    };
  }
}