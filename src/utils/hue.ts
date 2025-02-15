import { LocalStorage, showToast, Toast, updateCommandMetadata } from "@raycast/api";
import fetch from "node-fetch";

export const getBridgeIP = async (): Promise<string> => {
  const bridgeIP = (await LocalStorage.getItem("bridgeIP")) as string | undefined;
  if (!bridgeIP) return "";
  try {
    const parsed = JSON.parse(bridgeIP);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return bridgeIP;
  }
};

export const getBridgeUsername = async (): Promise<string> => {
  const username = (await LocalStorage.getItem("bridgeUsername")) as string | undefined;
  if (!username) return "";
  try {
    const parsed = JSON.parse(username);
    return typeof parsed === "string" ? parsed : "";
  } catch {
    return username;
  }
};

export const getGroup = async (groupId: string, navigate?: (command: string) => Promise<void>) => {
  try {
    const bridgeIP = await getBridgeIP();
    const bridgeUsername = await getBridgeUsername();

    if (!bridgeIP || !bridgeUsername) {
      await handleBridgeNavigation(navigate);
      return;
    }

    console.log(`http://${bridgeIP}/api/${bridgeUsername}/groups/${groupId}`);

    const res = await fetch(`http://${bridgeIP}/api/${bridgeUsername}/groups/${groupId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error("Failed to get group state");
    }

    return data;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to get group state",
      message: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes("Bridge not configured")) {
      await handleBridgeNavigation(navigate);
    }
    throw error;
  }
};

export const setGroupAction = async (
  groupId: string,
  action: { on: boolean },
  navigate?: (command: string) => Promise<void>,
) => {
  try {
    const bridgeIP = await getBridgeIP();
    const bridgeUsername = await getBridgeUsername();

    if (!bridgeIP || !bridgeUsername) {
      await handleBridgeNavigation(navigate);
      return;
    }

    const res = await fetch(`http://${bridgeIP}/api/${bridgeUsername}/groups/${groupId}/action`, {
      method: "PUT",
      body: JSON.stringify(action),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error("Failed to set group state");
    }

    return data;
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to set group state",
      message: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes("Bridge not configured")) {
      await handleBridgeNavigation(navigate);
    }
    throw error;
  }
};

export const toggleGroup = async (groupId: string, navigate?: (command: string) => Promise<void>) => {
  try {
    const group = (await getGroup(groupId, navigate)) as { state: { any_on: boolean }; name: string };
    if (!group) return;

    const newState = !(group as { state: { any_on: boolean } }).state.any_on;
    const result = await setGroupAction(groupId, { on: newState }, navigate);
    if (!result) return;

    showToast({
      style: Toast.Style.Success,
      title: "Group toggled",
      message: `Group ${groupId} toggled to ${newState ? "on" : "off"}`,
    });

    updateCommandMetadata({
      subtitle: `Turn ${group.name}  ${!newState ? "on" : "off"}`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to toggle group",
      message: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message.includes("Bridge not configured")) {
      await handleBridgeNavigation(navigate);
    }
    throw error;
  }
};

export const handleBridgeNavigation = async (navigate?: (command: string) => Promise<void>) => {
  if (!navigate) return;

  await showToast({
    style: Toast.Style.Failure,
    title: "Bridge Error",
    message: "Bridge not connected or not reachable. Redirecting to connection screen...",
  });

  try {
    await navigate("connect-bridge");
  } catch (error) {
    // Ignore navigation errors, as they might occur if we're already on the connect bridge screen
    console.log("Navigation error:", error);
  }
};
