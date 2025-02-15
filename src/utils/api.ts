import fetch from "node-fetch";
import { BridgeConnectionResponse, BridgeDiscoveryResponse, GroupAction, LightState } from "../types/hue";
import { ConnectionError, ensureBridgeConfigured, HueBridgeError, validateBridgeIP } from "./errors";

const DISCOVERY_URL = "https://discovery.meethue.com/";
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * HueAPI client for handling all Hue Bridge API calls
 */
export class HueAPI {
  private baseUrl: string;

  constructor(
    private bridgeIP: string,
    private username: string,
  ) {
    validateBridgeIP(bridgeIP);
    this.baseUrl = `http://${bridgeIP}/api/${username}`;
  }

  /**
   * Discover Hue bridges on the network
   */
  static async discoverBridge(): Promise<BridgeDiscoveryResponse[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(DISCOVERY_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new ConnectionError(`Failed to discover bridges: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate the response structure
      if (
        !Array.isArray(data) ||
        !data.every(
          (item) => typeof item === "object" && item !== null && "internalipaddress" in item && "port" in item,
        )
      ) {
        throw new HueBridgeError("Invalid discovery response format");
      }

      return data as BridgeDiscoveryResponse[];
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConnectionError("Bridge discovery timed out");
      }
      throw error;
    }
  }

  /**
   * Connect to a Hue bridge and get username
   */
  static async connectToBridge(bridgeIP: string): Promise<string> {
    try {
      validateBridgeIP(bridgeIP);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`http://${bridgeIP}/api`, {
        method: "POST",
        body: JSON.stringify({ devicetype: "raycast-app" }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new ConnectionError(`Failed to connect to bridge: ${response.statusText}`);
      }

      const data = (await response.json()) as BridgeConnectionResponse[];
      const result = data[0];

      if (result.error) {
        throw new HueBridgeError(result.error.description);
      }

      if (!result.success?.username) {
        throw new HueBridgeError("No username received from bridge");
      }

      return result.success.username;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConnectionError("Bridge connection timed out");
      }
      throw error;
    }
  }

  /**
   * Make an API call to the Hue bridge
   */
  private async makeRequest<T>(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    ensureBridgeConfigured(this.bridgeIP, this.username);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options.method || "GET",
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new ConnectionError(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data[0]?.error) {
        throw new HueBridgeError(data[0].error.description, data[0].error.type);
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConnectionError("API request timed out");
      }
      throw error;
    }
  }

  /**
   * Get all lights
   */
  async getLights() {
    return this.makeRequest("/lights");
  }

  /**
   * Get a specific light
   */
  async getLight(lightId: string) {
    return this.makeRequest(`/lights/${lightId}`);
  }

  /**
   * Set state for a specific light
   */
  async setLightState(lightId: string, state: LightState) {
    return this.makeRequest(`/lights/${lightId}/state`, {
      method: "PUT",
      body: state,
    });
  }

  /**
   * Get all groups
   */
  async getGroups() {
    return this.makeRequest("/groups");
  }

  /**
   * Get a specific group
   */
  async getGroup(groupId: string) {
    return this.makeRequest(`/groups/${groupId}`);
  }

  /**
   * Set action for a specific group
   */
  async setGroupAction(groupId: string, action: GroupAction) {
    return this.makeRequest(`/groups/${groupId}/action`, {
      method: "PUT",
      body: action,
    });
  }
}
