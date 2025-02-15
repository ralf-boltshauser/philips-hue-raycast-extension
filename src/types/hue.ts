/**
 * Represents the state of a Hue light
 */
export interface LightState {
  on?: boolean;
  bri?: number;
  hue?: number;
  sat?: number;
  xy?: [number, number];
  ct?: number;
  alert?: string;
  effect?: string;
}

/**
 * Represents a Philips Hue light device
 */
export interface Light {
  state: {
    on: boolean;
    bri: number;
    hue: number;
    sat: number;
    xy: [number, number];
    ct: number;
    alert: string;
    effect: string;
    colormode: string;
    reachable: boolean;
  };
  swupdate: {
    state: string;
    lastinstall: string;
  };
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname: string;
  capabilities: {
    certified: boolean;
    control: {
      mindimlevel: number;
      maxlumen: number;
      colorgamuttype: string;
      colorgamut: [[number, number], [number, number], [number, number]];
      ct: {
        min: number;
        max: number;
      };
    };
    streaming: {
      renderer: boolean;
      proxy: boolean;
    };
  };
  config: {
    archetype: string;
    function: string;
    direction: string;
    startup: {
      mode: string;
      configured: boolean;
    };
  };
  uniqueid: string;
  swversion: string;
  swconfigid: string;
  productid: string;
}

/**
 * Represents a group of Hue lights
 */
export interface Group {
  name: string;
  lights: string[];
  type: string;
  action: {
    on: boolean;
    bri: number;
    hue: number;
    sat: number;
    effect: string;
    xy: [number, number];
    ct: number;
    alert: string;
    colormode: string;
  };
  state: {
    all_on: boolean;
    any_on: boolean;
  };
}

/**
 * Represents an action that can be applied to a group
 */
export interface GroupAction {
  on?: boolean;
  bri?: number;
  hue?: number;
  sat?: number;
  xy?: [number, number];
  ct?: number;
  alert?: string;
  effect?: string;
}

/**
 * Generic response type for Hue API calls
 */
export interface HueResponse<T> {
  data?: T;
  isLoading: boolean;
  error?: Error;
  revalidate: () => void;
}

/**
 * Extended response type for group-specific operations
 */
export interface GroupHueResponse extends HueResponse<Group> {
  setAction: (action: GroupAction) => Promise<boolean>;
}

/**
 * Bridge discovery response type
 */
export interface BridgeDiscoveryResponse {
  internalipaddress: string;
  port: number;
}

/**
 * Bridge connection response type
 */
export interface BridgeConnectionResponse {
  success?: { username: string };
  error?: { description: string };
}
