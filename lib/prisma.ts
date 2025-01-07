// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    model: {
      comparison: {
        async groupedComparisons() {
          const results = await prisma.comparison.groupBy({
            by: ['item1', 'item2', 'response'],
            _count: true,
          });

          // Transform the results into the format expected by the frontend
          const comparisons = {};

          results.forEach((result) => {
            const key = `${result.item1}-${result.item2}`;
            if (!comparisons[key]) {
              comparisons[key] = { yes: 0, no: 0 };
            }

            if (result.response) {
              comparisons[key].yes = result._count;
            } else {
              comparisons[key].no = result._count;
            }
          });

          return comparisons;
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;