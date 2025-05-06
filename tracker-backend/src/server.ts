import Fastify from "fastify";
import fastifyMongo from "@fastify/mongodb";
import path from "node:path";
import fs from "node:fs/promises";
import http from "node:http";
import { type RawEvent, RawEventSchema, RawEventArraySchema } from "@/types";
import { config } from "dotenv";
import fastifyCors from "@fastify/cors";

config({ path: path.join(__dirname, "../../.env") });

const portStatic = Number(process.env.PORT_STATIC);
const portApi = Number(process.env.PORT_API);

const staticDir = path.resolve(__dirname, "../static"); // static html pages

const trackerDist = path.resolve(__dirname, "../../tracker-client/dist");

const api = Fastify({ logger: true });

api.register(fastifyMongo, {
  url: process.env.MONGO_URI,
  database: process.env.DB_NAME,
  forceClose: true,
});

api.get("/tracker", (_, reply) => {
  reply.type("application/javascript").sendFile("tracker.js");
});

api.post("/track", async (request, reply) => {
  const parseResult = RawEventArraySchema.safeParse(request.body);

  if (!parseResult.success) {
    reply
      .code(422)
      .send({ error: "Validation error", details: parseResult.error.format() });
    return;
  }

  const events = parseResult.data;

  reply.code(200).send({ ok: true });

  const collection = api.mongo.db!.collection("tracks");
  try {
    await collection.insertMany(events, { ordered: false });
  } catch (err) {
    api.log.error({ err }, "insertMany failed");
  }
});

async function main() {
  await api.register(import("@fastify/static"), {
    root: trackerDist,
    prefix: "/", // reply.sendFile ищет от root; /1.html /2.html игнорируются
  });

  await api.register(fastifyCors, {
    origin: (origin, cb) => {
      const allowed = ["http://localhost:50000"];

      if (!origin || allowed.includes(origin)) cb(null, true);
      else cb(new Error("Not allowed"), false);
    },
  });

  api.listen({ port: portApi }, (err, addr) => {
    if (err) {
      api.log.error(err);
      process.exit(1);
    }
    api.log.info(`API: ${addr}  (DB: ${process.env.DB_NAME})`);
  });

  // --- простейший статика-сервер для demo-страниц ----------------
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
