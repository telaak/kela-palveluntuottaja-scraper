import HyperExpress, { SendableData } from "hyper-express";
import { PrismaClient } from "@prisma/client";

export const therapistRouter = new HyperExpress.Router();
const prisma = new PrismaClient();

therapistRouter.get("/therapist", async (req, res) => {
  try {
    const therapists = await prisma.therapist.findMany({
      include: {
        languages: true,
        orientations: true,
        therapies: true,
        locations: true,
        phoneNumbers: true,
      },
    });
    res.json(therapists);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});
