import Fastify from "fastify";
import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs/promises";
import http from "node:http";
import { RawEventArraySchema } from "@/types";
import dbPlugin from "./db";
import corsPlugin from "./cors";
import staticPlugin from "./static";

config();

const portStatic = Number(process.env.PORT_STATIC);
const portApi = Number(process.env.PORT_API);
const staticDir = path.resolve(__dirname, "../static");
const api = Fastify({ logger: true });

api.post("/track", async (request, reply) => {
  const parseResult = RawEventArraySchema.safeParse(request.body);

  if (!parseResult.success) {
    reply
      .code(422)
      .send({ error: "Validation error", details: parseResult.error.format() });
    return;
  }

  reply.code(200).send({ ok: true });

  const events = parseResult.data;
  const collection = api.mongo.db!.collection("tracks");
  await collection.insertMany(events, { ordered: false });
});

async function main() {
  await api.register(dbPlugin);
  await api.register(corsPlugin);
  await api.register(staticPlugin);

  api.listen({ port: portApi }, (err) => {
    if (err) throw err;
    api.log.info(`API started on port ${portApi}`);
  });

  http
    .createServer(async (req, res) => {
      const file = ["1.html", "2.html", "3.html"].includes(req.url?.slice(1)!)
        ? req.url!.slice(1)
        : "1.html";
      const html = await fs.readFile(path.join(staticDir, file));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    })
    .listen(portStatic, () =>
      console.log(`Static pages → http://localhost:${portStatic}/1.html`)
    );
}

main();
