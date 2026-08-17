import { DiffbotClient, dql, resolveTokenFromEnv } from "@diffbot/typescript";

interface Env {
  DIFFBOT_API_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const client = new DiffbotClient({ token: resolveTokenFromEnv(undefined, env) });
    const result = await dql(client, 'type:Organization name:"Diffbot"', { size: 1 });
    return Response.json(result);
  },
};
