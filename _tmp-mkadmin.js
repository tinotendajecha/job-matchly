const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();
(async () => {
  const email = `qa-mob-${Date.now()}@jobmatchly-internal.test`;
  const u = await prisma.user.create({ data: { email, name: "QA Mobile", emailVerified: new Date(), onboardingComplete: true, isAdmin: true } });
  const token = crypto.randomUUID();
  await prisma.session.create({ data: { userId: u.id, token, expires: new Date(Date.now() + 3600000) } });
  console.log(token);
  await prisma.$disconnect();
})();
