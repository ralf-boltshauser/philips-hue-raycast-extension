import { launchCommand, LaunchType, LocalStorage, showToast, Toast } from "@raycast/api";
import { toggleGroup } from "./utils/hue";

export default async function TogglePrimaryGroup() {
  const item = (await LocalStorage.getItem("primaryGroupId")) as string | undefined;
  const primaryGroupId = item ? JSON.parse(item) : null;

  if (!primaryGroupId) {
    showToast({
      title: "No primary group selected",
      message: "Please select a primary group",
      style: Toast.Style.Failure,
    });
    await launchCommand({
      name: "select-primary-group",
      type: LaunchType.UserInitiated,
    });
    return;
  }

  const navigate = async (command: string) => {
    await launchCommand({
      name: command,
      type: LaunchType.UserInitiated,
    });
  };

  await toggleGroup(primaryGroupId, navigate);
}
