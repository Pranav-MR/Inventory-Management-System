import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.create({ data: { email: DEMO_EMAIL, passwordHash, name: 'Demo User' } });

  // Medicine A: the worked example from the product spec — supplied 16/month, consumed
  // 10/month, current batch expiry Dec 2027. Surplus accumulates ~6/month.
  const medicineA = await prisma.item.create({
    data: { userId: user.id, name: 'Medicine A', unit: 'tablet', category: 'Medicine' },
  });
  await prisma.consumptionRate.create({
    data: { itemId: medicineA.id, ratePerPeriod: 10, periodUnit: 'MONTH' },
  });
  await prisma.recurringSupplySchedule.create({
    data: {
      itemId: medicineA.id,
      intervalValue: 1,
      intervalUnit: 'MONTH',
      quantityPerDelivery: 16,
      nextExpectedDeliveryDate: addMonths(new Date(), 1),
    },
  });
  await prisma.batch.create({
    data: {
      itemId: medicineA.id,
      receivedDate: new Date(),
      expiryDate: new Date('2027-12-31'),
      quantityReceived: 16,
      quantityRemaining: 16,
      quantityAsOfDate: new Date(),
    },
  });

  // A simple depleting item with no recurring supply, to show a plain stock-out projection.
  const vitaminC = await prisma.item.create({
    data: { userId: user.id, name: 'Vitamin C', unit: 'tablet', category: 'Supplement' },
  });
  await prisma.consumptionRate.create({
    data: { itemId: vitaminC.id, ratePerPeriod: 1, periodUnit: 'DAY' },
  });
  await prisma.batch.create({
    data: {
      itemId: vitaminC.id,
      receivedDate: new Date(),
      expiryDate: addMonths(new Date(), 6),
      quantityReceived: 20,
      quantityRemaining: 20,
      quantityAsOfDate: new Date(),
    },
  });

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
