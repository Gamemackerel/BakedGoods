import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

type ExtendedPrismaClient = PrismaClient & {
  comparison: {
    groupedComparisons(): Promise<Record<string, { yes: number; no: number }>>;
  };
};

const prismaClientSingleton = () => {
  const prisma = new PrismaClient().$extends({
    model: {
      comparison: {
        async groupedComparisons() {
          try {
            const results = await prisma.comparison.groupBy({
              by: ['item1', 'item2', 'response'],
              _count: {
                _all: true
              }
            });

            // Initialize with empty object even if no results
            const comparisons: Record<string, { yes: number; no: number }> = {};

            // Process results if we have any
            if (results && results.length > 0) {
              results.forEach((result) => {
                const key = `${result.item1}-${result.item2}`;
                if (!comparisons[key]) {
                  comparisons[key] = { yes: 0, no: 0 };
                }

                if (result.response) {
                  comparisons[key].yes = result._count._all;
                } else {
                  comparisons[key].no = result._count._all;
                }
              });
            }

            return comparisons;
          } catch (error) {
            console.error('Error in groupedComparisons:', JSON.stringify(error));
            // Return empty object instead of null on error
            return {};
          }
        },
      },
    },
  }) ;

  return prisma as unknown as ExtendedPrismaClient;
};

const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;