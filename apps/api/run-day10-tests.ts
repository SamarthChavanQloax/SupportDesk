import newman from 'newman';
import path from 'path';
import { app } from './src/app';
import { prisma } from './src/repositories/prisma.client';

const collectionPath = path.resolve(__dirname, '../../postman/SupportDesk_Day10_Auth_Security.postman_collection.json');
const environmentPath = path.resolve(__dirname, '../../postman/SupportDesk_Local.postman_environment.json');
const PORT = 3008;

const server = app.listen(PORT, async () => {
  console.log(`\n===============================================================`);
  console.log(`[DAY 10 POSTMAN RUNNER] SupportDesk API active on port ${PORT}`);
  console.log(`[DAY 10 POSTMAN RUNNER] Executing Collection: ${path.basename(collectionPath)}`);
  console.log(`===============================================================\n`);

  // Ensure test email is clean before run
  await prisma.user.deleteMany({ where: { email: 'asha.customer.day10@example.test' } });

  const collection = require(collectionPath);
  const environment = require(environmentPath);

  // Set baseUrl dynamically to current runner port
  const baseUrlVar = environment.values.find((v: any) => v.key === 'baseUrl');
  if (baseUrlVar) {
    baseUrlVar.value = `http://localhost:${PORT}`;
  }

  newman.run(
    {
      collection,
      environment,
      reporters: ['cli'],
      bail: false,
      color: 'off',
    },
    async (err, summary) => {
      if (err) {
        console.error('[DAY 10 POSTMAN RUNNER] Newman execution error:', err);
      }

      const totalRequests = summary?.run?.stats?.requests?.total ?? 0;
      const totalAssertions = summary?.run?.stats?.assertions?.total ?? 0;
      const failedAssertions = summary?.run?.stats?.assertions?.failed ?? 0;

      console.log(`\n===============================================================`);
      console.log(`[DAY 10 POSTMAN RUNNER SUMMARY]`);
      console.log(`Total Requests: ${totalRequests}`);
      console.log(`Total Assertions: ${totalAssertions}`);
      console.log(`Failed Assertions: ${failedAssertions}`);
      console.log(`Pass Rate: ${totalAssertions > 0 ? (((totalAssertions - failedAssertions) / totalAssertions) * 100).toFixed(1) : 0}%`);
      console.log(`===============================================================\n`);

      // Cleanup test user
      await prisma.user.deleteMany({ where: { email: 'asha.customer.day10@example.test' } });
      await prisma.$disconnect();

      server.close(() => {
        console.log('[DAY 10 POSTMAN RUNNER] API server stopped cleanly.');
        process.exit(failedAssertions > 0 ? 1 : 0);
      });
    }
  );
});

