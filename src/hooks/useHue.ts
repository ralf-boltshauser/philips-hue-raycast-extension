import { useLocalStorage } from "@raycast/utils";
import { useHueApi } from "./useHueApi";

export function useHue() {
  const { value: bridgeIP } = useLocalStorage("bridgeIP", "");
  const { value: bridgeUsername } = useLocalStorage("bridgeUsername", "");

  return useHueApi({ bridgeIP, bridgeUsername });
}
