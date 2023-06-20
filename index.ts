import HyperExpress from "hyper-express";
import cors from "cors";
import { therapistRouter } from "./routes/therapist";
import { WebSocket } from "ws";
import ReconnectingWebSocket from "reconnecting-websocket";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const Server = new HyperExpress.Server();
Server.use(cors());
Server.options("/*", (request, response) => {
  return response.send("");
});

Server.use("/api", therapistRouter);

const serverPort = Number(process.env.PORT) || 4000;

const ws = new ReconnectingWebSocket(
  process.env.WEBSOCKET || "ws://127.0.0.1:4000/ws/connect",
  [],
  {
    WebSocket: WebSocket,
    maxReconnectionDelay: 250,
    minReconnectionDelay: 10,
  }
);

export type SMSHeader = {
  encoding: string;
  smsc: string;
  smscType: string;
  smscPlan: string;
};

export type SMSUdh = {
  referenceNumber: number;
  parts: number;
  part: 1;
};

export type SMSMessage = {
  sender: string;
  index: number;
  message: string;
  dateTimeSent: Date;
  msgStatus: number;
  header: SMSHeader;
  udh?: SMSUdh;
  udhs?: SMSUdh[];
  rowid?: number | string;
};

// @ts-ignore:next-line
ws.addEventListener("message", async (event) => {
  const data = JSON.parse(event.data);
  const textMessage: SMSMessage = data.message;
  if (data.type === "newMessage") {
    switch (textMessage.message) {
      case "Kyllä": {
        const therapists = await prisma.therapist.updateMany({
          where: {
            isActive: false,
          },
          data: {
            isActive: true,
          },
        });
        revalidateNext()
        break;
      }
      case "Ei": {
        const therapists = await prisma.therapist.updateMany({
          where: {
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
        revalidateNext()
        break;
      }
    }
  }
});

const revalidateNext = async () => {
  return fetch(
    `${process.env.NEXT_URL}/api/revalidate?secret=${process.env.REVALIDATE_TOKEN}`
  ).then((res) => res.json().then((json) => console.log(json)));
};

Server.listen(serverPort)
  .then((socket) => console.log(`Webserver started on port ${serverPort}`))
  .catch((error) =>
    console.log(`Failed to start webserver on port ${serverPort}`)
  );
