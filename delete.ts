import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

prisma.therapist.deleteMany({}).then(console.log)