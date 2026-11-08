import { closeDB } from '../src/lib/db';

afterAll(async () => {
  await closeDB();
});
