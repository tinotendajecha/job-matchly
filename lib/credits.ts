// lib/credits.ts
import { prisma } from "@/lib/prisma";

export async function addCredits(userId: string, n: number) {
  await prisma.user.update({ where: { id: userId }, data: { credits: { increment: n } } });
}


export async function spendCredits(userId: string, amount = 1) {
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!u || u.credits < amount) throw new Error("INSUFFICIENT_CREDITS");
    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
  });
}

// lib/credits.ts (add a refund helper)
export async function refundCredits(userId: string, amount: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });
}

