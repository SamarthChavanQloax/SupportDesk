import newman from 'newman';
import path from 'path';
import { app } from './src/app';
import { env } from './src/config/env';

const collectionPath = path.resolve(__dirname, '../../postman/SupportDesk_Day9_API_Testing.postman_collection.json');
const environmentPath = path.resolve(__dirname, '../../postman/SupportDesk_Local.postman_environment.json');

const server = app.listen(env.PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`[POSTMAN TEST RUNNER] SupportDesk API active on port ${env.PORT}`);
  console.log(`[POSTMAN TEST RUNNER] Executing Collection: ${path.basename(collectionPath)}`);
  console.log(`===============================================================\n`);

  newman.run(
    {
      collection: require(collectionPath),
      environment: require(environmentPath),
      reporters: ['cli'],
      bail: false,
      color: 'off',
    },
    (err, summary) => {
      if (err) {
        console.error('[POSTMAN TEST RUNNER] Newman execution error:', err);
      }

      const totalRequests = summary?.run?.stats?.requests?.total ?? 0;
      const totalAssertions = summary?.run?.stats?.assertions?.total ?? 0;
      const failedAssertions = summary?.run?.stats?.assertions?.failed ?? 0;

      console.log(`\n===============================================================`);
      console.log(`[POSTMAN RUNNER SUMMARY]`);
      console.log(`Total Requests: ${totalRequests}`);
      console.log(`Total Assertions: ${totalAssertions}`);
      console.log(`Failed Assertions: ${failedAssertions}`);
      console.log(`===============================================================\n`);

      server.close(() => {
        console.log('[POSTMAN TEST RUNNER] API server stopped cleanly.');
        process.exit(failedAssertions > 0 ? 1 : 0);
      });
    }
  );
});
