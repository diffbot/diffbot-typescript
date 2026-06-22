import type { DiffbotClient } from "./client.js";
import { readBodyText, raiseForStatus } from "./http.js";

export interface ChatMessage {
  role: string;
  content: string;
}

function parseChunk(line: string): string | undefined {
  try {
    const chunk = JSON.parse(line.replace(/^data: /, "")) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = chunk.choices?.[0]?.delta?.content;
    return content ?? undefined;
  } catch {
    return undefined;
  }
}

function* linesFromText(text: string): Generator<string> {
  for (const line of text.split("\n")) {
    if (line) yield line;
  }
}

async function* linesFromStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      if (line) yield line;
    }
  }
  if (buffer) yield buffer;
}

export async function* ask(
  client: DiffbotClient,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const headers = { Authorization: `Bearer ${client.token}` };
  const payload = { model: "diffbot-small-xl", messages, stream: true };

  const response = await client.http.post(client.llmUrl, { headers, json: payload });
  if (!response.ok) {
    const body = await readBodyText(response);
    raiseForStatus(response, body);
    return;
  }

  if (response.body) {
    for await (const line of linesFromStream(response.body)) {
      const content = parseChunk(line);
      if (content) yield content;
    }
    return;
  }

  const text = await response.text();
  for (const line of linesFromText(text)) {
    const content = parseChunk(line);
    if (content) yield content;
  }
}
