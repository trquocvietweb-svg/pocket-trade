import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Cleanup old messages every day at 3:00 AM UTC
crons.daily(
  "cleanup old messages",
  { hourUTC: 3, minuteUTC: 0 },
  internal.cronJobs.cleanupOldMessages
);

// Cleanup expired trade posts every hour
crons.hourly(
  "cleanup expired trade posts",
  { minuteUTC: 0 },
  internal.cronJobs.cleanupExpiredTradePosts
);

export default crons;
