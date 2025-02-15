import { Action, ActionPanel, Icon, launchCommand, LaunchType, List, showToast, Toast } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";
import { useHue } from "./hooks/useHue";

export default function SelectPrimaryGroup() {
  const navigate = async (command: string) => {
    await launchCommand({
      name: command,
      type: LaunchType.UserInitiated,
    });
  };

  const { useGroups } = useHue();
  const { value: primaryGroupId, setValue: setPrimaryGroupId } = useLocalStorage("primaryGroupId", "");
  const { data: groups, isLoading } = useGroups(navigate);

  return (
    <List isLoading={isLoading}>
      {groups &&
        Object.entries(groups).map(([id, group]) => (
          <List.Item
            key={id}
            title={group.name}
            subtitle={`${group.lights.length} lights`}
            accessories={[
              {
                icon: primaryGroupId === id ? Icon.Checkmark : Icon.Circle,
                tooltip: primaryGroupId === id ? "Primary Group" : "Secondary Group",
              },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Select as Primary Group"
                  icon={Icon.Star}
                  onAction={() => {
                    setPrimaryGroupId(id);
                    showToast({
                      title: "Primary Group Updated",
                      message: `${group.name} is now your primary group`,
                      style: Toast.Style.Success,
                    });
                  }}
                />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
