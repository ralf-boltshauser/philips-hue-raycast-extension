import { Action, ActionPanel, Color, Icon, launchCommand, LaunchType, List } from "@raycast/api";
import { useHue } from "./hooks/useHue";

export default function ManageLights() {
  const navigate = async (command: string) => {
    await launchCommand({
      name: command,
      type: LaunchType.UserInitiated,
    });
  };

  const { useLights, setLightState } = useHue();
  const { data, isLoading, error, revalidate } = useLights(navigate);

  const handleToggleLight = async (id: string, currentState: boolean) => {
    const success = await setLightState(id, { on: !currentState }, navigate);
    if (success) {
      revalidate();
    }
  };

  // Show error state
  if (error) {
    return (
      <List isLoading={false}>
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Error Loading Lights"
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

  // Show empty state when no lights are found
  if (!isLoading && (!data || Object.keys(data).length === 0)) {
    return (
      <List isLoading={true}>
        <List.EmptyView
          icon={Icon.LightBulb}
          title="Loading Lights..."
          description="Fetching lights from your Hue Bridge"
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
    <List isLoading={isLoading} searchBarPlaceholder="Search lights...">
      {data &&
        Object.entries(data).map(([id, light]) => (
          <List.Item
            key={id}
            title={light.name}
            subtitle={`${light.type} • ${light.productname}`}
            accessories={[
              {
                icon: light.state.reachable
                  ? { source: Icon.Circle, tintColor: light.state.on ? Color.Green : Color.SecondaryText }
                  : { source: Icon.XMarkCircle, tintColor: Color.Red },
                tooltip: light.state.reachable ? `Light is ${light.state.on ? "on" : "off"}` : "Light is not reachable",
              },
              {
                text: `Brightness: ${Math.round((light.state.bri / 254) * 100)}%`,
                tooltip: "Current brightness level",
              },
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title={light.state.on ? "Turn Off" : "Turn On"}
                    icon={light.state.on ? Icon.LightBulbOff : Icon.LightBulb}
                    onAction={() => handleToggleLight(id, light.state.on)}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Refresh Lights"
                    icon={Icon.ArrowClockwise}
                    onAction={revalidate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
