import HyperExpress from "hyper-express";
import cors from "cors";
import { therapistRouter } from "./routes/therapist";

const Server = new HyperExpress.Server();
Server.use(cors());
Server.options("/*", (request, response) => {
  return response.send("");
});

Server.use("/api", therapistRouter);

const serverPort = Number(process.env.PORT) || 4000

Server.listen(serverPort)
  .then((socket) => console.log(`Webserver started on port ${serverPort}`))
  .catch((error) => console.log(`Failed to start webserver on port ${serverPort}`));