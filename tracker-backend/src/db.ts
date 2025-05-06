import fastifyPlugin from "fastify-plugin";
import fastifyMongo from "@fastify/mongodb";
import { FastifyInstance } from "fastify";
import { config } from "dotenv";

config();

export default fastifyPlugin(async function (fastify: FastifyInstance) {
  await fastify.register(fastifyMongo, {
    url: process.env.MONGO_URI,
    database: process.env.DB_NAME,
    forceClose: true,
  });
});
