import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { strategiesRouter } from "./routers/strategies";
import { aiRouter } from "./routers/ai";
import { watchlistRouter } from "./routers/watchlist";
import { notificationsRouter } from "./routers/notifications";
import { backtestRouter } from "./routers/backtest";
import { marketRouter } from "./routers/market";
import { backtestHistoryRouter } from "./routers/backtest-history";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  strategies: strategiesRouter,
  ai: aiRouter,
  watchlist: watchlistRouter,
  notifications: notificationsRouter,
  backtest: backtestRouter,
  backtestHistory: backtestHistoryRouter,
  market: marketRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
