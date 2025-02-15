import { useCallback, useEffect, useRef, useState } from "react";
import { Group, GroupAction, GroupHueResponse, HueResponse, Light, LightState } from "../types/hue";
import { HueAPI } from "../utils/api";
import { handleError } from "../utils/errors";
import { handleBridgeNavigation } from "../utils/hue";

interface UseHueApiOptions {
  bridgeIP?: string;
  bridgeUsername?: string;
}

function isRecord<T>(value: unknown): value is Record<string, T> {
  return typeof value === "object" && value !== null;
}

function isLight(value: unknown): value is Light {
  if (!isRecord(value)) return false;
  return "state" in value && "name" in value && "type" in value && isRecord(value.state) && "on" in value.state;
}

function isGroup(value: unknown): value is Group {
  if (!isRecord(value)) return false;
  return "name" in value && "lights" in value && "type" in value && Array.isArray(value.lights);
}

export function useHueApi({ bridgeIP, bridgeUsername }: UseHueApiOptions) {
  const [api, setApi] = useState<HueAPI | null>(null);

  useEffect(() => {
    if (bridgeIP && bridgeUsername) {
      setApi(new HueAPI(bridgeIP, bridgeUsername));
    } else {
      setApi(null);
    }
  }, [bridgeIP, bridgeUsername]);

  const useLights = (navigate?: (command: string) => Promise<void>): HueResponse<Record<string, Light>> => {
    const [data, setData] = useState<Record<string, Light> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const fetchTimeoutRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async () => {
      if (!api) {
        setError(new Error("Bridge not configured"));
        await handleBridgeNavigation(navigate);
        return;
      }
      if (isLoading) return;

      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      setIsLoading(true);
      try {
        const result = await api.getLights();
        if (isMountedRef.current) {
          if (isRecord(result) && Object.values(result).every(isLight)) {
            setData(result as Record<string, Light>);
            setError(undefined);
          } else {
            throw new Error("Invalid response format from API");
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          handleError(err, "Failed to fetch lights");
          setError(err instanceof Error ? err : new Error(String(err)));
          if (err instanceof Error && err.message.includes("Internal Server Error")) {
            await handleBridgeNavigation(navigate);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, [api, navigate]);

    useEffect(() => {
      isMountedRef.current = true;

      const execute = () => {
        if (isMountedRef.current) {
          fetchTimeoutRef.current = setTimeout(fetchData, 500);
        }
      };

      execute();

      return () => {
        isMountedRef.current = false;
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }, [fetchData]);

    return { data, isLoading, error, revalidate: fetchData };
  };

  const useLight = (lightId: string, navigate?: (command: string) => Promise<void>): HueResponse<Light> => {
    const [data, setData] = useState<Light | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const fetchTimeoutRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async () => {
      if (!api) {
        await handleBridgeNavigation(navigate);
        return;
      }
      if (isLoading) return;

      setIsLoading(true);
      try {
        const result = await api.getLight(lightId);
        if (isMountedRef.current) {
          if (isLight(result)) {
            setData(result);
            setError(undefined);
          } else {
            throw new Error("Invalid response format from API");
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          handleError(err, `Failed to fetch light ${lightId}`);
          setError(err instanceof Error ? err : new Error(String(err)));
          await handleBridgeNavigation(navigate);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, [api, lightId, navigate]);

    useEffect(() => {
      isMountedRef.current = true;

      const execute = () => {
        if (isMountedRef.current) {
          fetchTimeoutRef.current = setTimeout(fetchData, 500);
        }
      };

      execute();

      return () => {
        isMountedRef.current = false;
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }, [fetchData]);

    return { data, isLoading, error, revalidate: fetchData };
  };

  const useGroups = (navigate?: (command: string) => Promise<void>): HueResponse<Record<string, Group>> => {
    const [data, setData] = useState<Record<string, Group> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const fetchTimeoutRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async () => {
      if (!api) {
        await handleBridgeNavigation(navigate);
        return;
      }
      if (isLoading) return;

      setIsLoading(true);
      try {
        const groups = await api.getGroups();
        if (isMountedRef.current) {
          if (isRecord(groups) && Object.values(groups).every(isGroup)) {
            const typedGroups = groups as Record<string, Group>;
            const filteredGroups = Object.fromEntries(
              Object.entries(typedGroups).filter(([, group]) => group.lights.length > 1),
            );
            setData(filteredGroups);
            setError(undefined);
          } else {
            throw new Error("Invalid response format from API");
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          handleError(err, "Failed to fetch groups");
          setError(err instanceof Error ? err : new Error(String(err)));
          await handleBridgeNavigation(navigate);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, [api, navigate]);

    useEffect(() => {
      isMountedRef.current = true;

      const execute = () => {
        if (isMountedRef.current) {
          fetchTimeoutRef.current = setTimeout(fetchData, 500);
        }
      };

      execute();

      return () => {
        isMountedRef.current = false;
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }, [fetchData]);

    return { data, isLoading, error, revalidate: fetchData };
  };

  const useGroup = (groupId: string, navigate?: (command: string) => Promise<void>): GroupHueResponse => {
    const [data, setData] = useState<Group | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const fetchTimeoutRef = useRef<NodeJS.Timeout>();
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async () => {
      if (!api) {
        await handleBridgeNavigation(navigate);
        return;
      }
      if (isLoading) return;

      setIsLoading(true);
      try {
        const result = await api.getGroup(groupId);
        if (isMountedRef.current) {
          if (isGroup(result)) {
            setData(result);
            setError(undefined);
          } else {
            throw new Error("Invalid response format from API");
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          handleError(err, `Failed to fetch group ${groupId}`);
          setError(err instanceof Error ? err : new Error(String(err)));
          await handleBridgeNavigation(navigate);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, [api, groupId, navigate]);

    useEffect(() => {
      isMountedRef.current = true;

      const execute = () => {
        if (isMountedRef.current) {
          fetchTimeoutRef.current = setTimeout(fetchData, 500);
        }
      };

      execute();

      return () => {
        isMountedRef.current = false;
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }, [fetchData]);

    const setAction = async (action: GroupAction): Promise<boolean> => {
      if (!api) {
        await handleBridgeNavigation(navigate);
        return false;
      }
      try {
        const result = await api.setGroupAction(groupId, action);
        return Boolean(result);
      } catch (err) {
        handleError(err, `Failed to set group action for ${groupId}`);
        await handleBridgeNavigation(navigate);
        return false;
      }
    };

    return { data, isLoading, error, revalidate: fetchData, setAction };
  };

  const setLightState = async (
    lightId: string,
    state: LightState,
    navigate?: (command: string) => Promise<void>,
  ): Promise<boolean> => {
    if (!api) {
      await handleBridgeNavigation(navigate);
      return false;
    }
    try {
      const result = await api.setLightState(lightId, state);
      return Boolean(result);
    } catch (err) {
      handleError(err, `Failed to set light state for ${lightId}`);
      await handleBridgeNavigation(navigate);
      return false;
    }
  };

  return {
    useLights,
    useLight,
    useGroups,
    useGroup,
    setLightState,
  };
}
