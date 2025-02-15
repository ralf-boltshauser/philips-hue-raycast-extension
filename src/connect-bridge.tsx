import { Action, ActionPanel, Detail, Form, showToast, Toast } from "@raycast/api";
import { useFetch, useLocalStorage } from "@raycast/utils";
import fetch from "node-fetch";

type Values = {
  bridgeIP: string;
};

export function ConnectBridge() {
  const { value: bridgeUsername, setValue: setBridgeUsername } = useLocalStorage("bridgeUsername", "");
  const { value: bridgeIP, setValue: setBridgeIP } = useLocalStorage("bridgeIP", "");

  const { data } = useFetch<
    {
      internalipaddress: string;
      port: number;
    }[]
  >("https://discovery.meethue.com/", {
    execute: !bridgeUsername,
    onWillExecute: () => {
      console.log("will execute discovery");
    },
  });

  console.log(data);

  async function handleSubmit(values: Values) {
    setBridgeIP(values.bridgeIP);
    try {
      console.log("will execute connection");
      const response = await fetch(`http://${values.bridgeIP}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devicetype: "raycast-app",
        }),
      });

      const data = (await response.json()) as { success: { username: string }; error: { description: string } }[];
      console.log("data", data);

      const entry = data[0];
      if (entry.success) {
        setBridgeUsername(entry.success.username);
        showToast({ title: "Success", message: "Bridge connected successfully.", style: Toast.Style.Success });
      } else {
        showToast({
          title: "Error",
          message: "Error connecting to bridge " + entry.error.description,
          style: Toast.Style.Failure,
        });
      }
    } catch (error) {
      console.error("error", error);
      showToast({
        title: "Error",
        message: "Error connecting to bridge." + (error instanceof Error ? error.message : String(error)),
        style: Toast.Style.Failure,
      });
    }
  }

  return bridgeUsername ? (
    <Detail
      markdown={`# Connected to Bridge\nYou are connected to the bridge at ${bridgeIP} with username ${bridgeUsername}`}
      actions={
        <ActionPanel>
          <Action
            title="Disconnect"
            onAction={() => {
              setBridgeUsername("");
              setBridgeIP("");
            }}
          />
        </ActionPanel>
      }
    />
  ) : (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} title="Connect" />
        </ActionPanel>
      }
      navigationTitle="Connect to Bridge"
    >
      <Form.TextField
        id="bridgeIP"
        title="Bridge IP"
        placeholder="Enter bridge IP"
        defaultValue={data?.[0].internalipaddress}
      />
    </Form>
  );
}

export default ConnectBridge;
