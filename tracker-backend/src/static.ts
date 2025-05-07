import fp from "fastify-plugin";
import path from "node:path";

const clientDist = path.resolve(__dirname, "../../tracker-client/dist");

export default fp(async (app) =>
  app.register(import("@fastify/static"), {
    root: clientDist,
    prefix: "/",
  })
);
