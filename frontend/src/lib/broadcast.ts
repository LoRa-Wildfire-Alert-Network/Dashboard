const CHANNEL_NAME = "lora-dashboard-auth";

type AuthMessage =
  | { type: "signed-in" }
  | { type: "signed-out"; goto?: string };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcastSignIn() {
  getChannel().postMessage({ type: "signed-in" } satisfies AuthMessage);
}

export function broadcastSignOut(goto?: string) {
  getChannel().postMessage({ type: "signed-out", goto } satisfies AuthMessage);
}

export function onAuthMessage(callback: (msg: AuthMessage) => void): () => void {
  const ch = getChannel();
  const handler = (e: MessageEvent<AuthMessage>) => callback(e.data);
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
