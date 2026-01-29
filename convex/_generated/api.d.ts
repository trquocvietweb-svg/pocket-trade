/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admins from "../admins.js";
import type * as cards from "../cards.js";
import type * as chats from "../chats.js";
import type * as cronJobs from "../cronJobs.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as packs from "../packs.js";
import type * as postCategories from "../postCategories.js";
import type * as posts from "../posts.js";
import type * as rarities from "../rarities.js";
import type * as seed from "../seed.js";
import type * as seedCards from "../seedCards.js";
import type * as seedData from "../seedData.js";
import type * as series from "../series.js";
import type * as sets from "../sets.js";
import type * as settings from "../settings.js";
import type * as tradePosts from "../tradePosts.js";
import type * as tradeRequests from "../tradeRequests.js";
import type * as traders from "../traders.js";
import type * as visitors from "../visitors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admins: typeof admins;
  cards: typeof cards;
  chats: typeof chats;
  cronJobs: typeof cronJobs;
  crons: typeof crons;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  messages: typeof messages;
  packs: typeof packs;
  postCategories: typeof postCategories;
  posts: typeof posts;
  rarities: typeof rarities;
  seed: typeof seed;
  seedCards: typeof seedCards;
  seedData: typeof seedData;
  series: typeof series;
  sets: typeof sets;
  settings: typeof settings;
  tradePosts: typeof tradePosts;
  tradeRequests: typeof tradeRequests;
  traders: typeof traders;
  visitors: typeof visitors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
