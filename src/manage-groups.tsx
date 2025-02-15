import { Action, ActionPanel, Color, Icon, launchCommand, LaunchType, List } from "@raycast/api";
import { useHue } from "./hooks/useHue";
import { Group } from "./types/hue";

function GroupItem({
  id,
  group,
  onStateChange,
  navigate,
}: {
  id: string;
  group: Group;
  onStateChange: () => void;
  navigate: (command: string) => Promise<void>;
}) {
  const { useGroup } = useHue();
  const { setAction } = useGroup(id, navigate);

  const handleToggleGroup = async (currentState: boolean) => {
    const success = await setAction({ on: !currentState });
    if (success) {
      onStateChange();
    }
  };

  return (
    <List.Item
      key={id}
      title={group.name}
      subtitle={`${group.lights.length} lights • ${group.type}`}
      accessories={[
        {
          icon: group.state.any_on
            ? { source: Icon.Circle, tintColor: Color.Green }
            : { source: Icon.Circle, tintColor: Color.SecondaryText },
          tooltip: group.state.any_on ? "Some or all lights are on" : "All lights are off",
        },
        {
          text: group.state.all_on ? "All On" : group.state.any_on ? "Partially On" : "All Off",
          tooltip: "Group state",
        },
        {
          text: `${group.lights.length} lights`,
          tooltip: "Number of lights in group",
        },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title={group.state.any_on ? "Turn off Group" : "Turn on Group"}
              icon={group.state.any_on ? Icon.LightBulbOff : Icon.LightBulb}
              onAction={() => handleToggleGroup(group.state.any_on)}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Refresh Groups"
              icon={Icon.ArrowClockwise}
              onAction={onStateChange}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

export default function ManageGroups() {
  const navigate = async (command: string) => {
    await launchCommand({
      name: command,
      type: LaunchType.UserInitiated,
    });
  };

  const { useGroups } = useHue();
  const { data: groups, isLoading, error, revalidate } = useGroups(navigate);

  // Show error state
  if (error) {
    return (
      <List isLoading={false}>
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Error Loading Groups"
          description={error.message}
          actions={
            <ActionPanel>
              <Action title="Try Again" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Show empty state when no groups are found
  if (!isLoading && (!groups || Object.keys(groups).length === 0)) {
    return (
      <List isLoading={true}>
        <List.EmptyView
          icon={Icon.Folder}
          title="Loading Groups..."
          description="Fetching groups from your Hue Bridge"
          actions={
            <ActionPanel>
              <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={revalidate} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search groups...">
      {groups &&
        Object.entries(groups).map(([id, group]) => (
          <GroupItem key={id} id={id} group={group} onStateChange={revalidate} navigate={navigate} />
        ))}
    </List>
  );
}
