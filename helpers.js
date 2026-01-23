import { Agent } from "undici";
export async function longLivedFetch(url, options = {}) {
  const longTimeoutAgent = new Agent({
    connectTimeout: 600000, // 10 minutes for connection
    headersTimeout: 600000, // 10 minutes for headers
    bodyTimeout: 600000, // 10 minutes for body
  });

  const webhookResponse = await fetch(url, {
    ...options,
    dispatcher: longTimeoutAgent,
  });

  if (!webhookResponse.ok) {
    throw new Error(`Webhook failed: ${webhookResponse.status}`);
  }

  const result = await webhookResponse.json();
  console.log("✓ Received workflow response\n");

  return result;
}
