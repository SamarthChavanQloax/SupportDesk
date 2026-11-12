process.env.NODE_ENV = 'test';

import newman from 'newman';
import path from 'path';
import { app } from './src/app';
import { resetAndSeedDatabase } from './src/__tests__/setup-test-db';
import { prisma } from './src/repositories/prisma.client';

const collectionPath = path.resolve(
  __dirname,
  '../../postman/SupportDesk_Day12_API_Demo.postman_collection.json'
);

async function main(): Promise<void> {
  await resetAndSeedDatabase();

  const port = 3007;
  const server = app.listen(port, () => {
    console.log(`[DAY 12 DEMO] SupportDesk API active on http://localhost:${port}`);
    newman.run(
      {
        collection: require(collectionPath),
        envVar: [{ key: 'baseUrl', value: `http://localhost:${port}` }],
        reporters: ['cli'],
        color: 'off',
      },
      async (err, summary) => {
        const requests = summary?.run?.stats?.requests?.total ?? 0;
        const assertions = summary?.run?.stats?.assertions?.total ?? 0;
        const failed = summary?.run?.stats?.assertions?.failed ?? 0;

        console.log(
          `[DAY 12 DEMO SUMMARY] Requests: ${requests}, Assertions: ${assertions}, Failed: ${failed}`
        );

        server.close(async () => {
          await prisma.$disconnect();
          process.exit(err || failed > 0 ? 1 : 0);
        });
      }
    );
  });
}

main().catch(async (error) => {
  console.error('[DAY 12 DEMO ERROR]', error);
  await prisma.$disconnect();
  process.exit(1);
});

