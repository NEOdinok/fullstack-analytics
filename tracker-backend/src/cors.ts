import fp from "fastify-plugin";
import cors from "@fastify/cors";

export default fp(async (app) =>
  app.register(cors, {
    origin: [
      `${process.env.APP_URL}:${process.env.PORT_STATIC}`,
      `${process.env.APP_URL}:${process.env.PORT_API}`,
    ],
    preflight: true,
  })
);
