import * as _better_fetch_fetch0 from "@better-fetch/fetch";

//#region src/client.d.ts
interface InfraClientOptions {
  /**
   * The URL of the identification service
   * @default "https://id.better-auth.com"
   */
  identifyUrl?: string;
  /**
   * Whether to automatically solve PoW challenges (default: true)
   */
  autoSolveChallenge?: boolean;
  /**
   * Callback when a PoW challenge is received
   */
  onChallengeReceived?: (reason: string) => void;
  /**
   * Callback when a PoW challenge is solved
   */
  onChallengeSolved?: (solveTimeMs: number) => void;
  /**
   * Callback when a PoW challenge fails to solve
   */
  onChallengeFailed?: (error: Error) => void;
}
declare const infraClient: (options?: InfraClientOptions) => {
  id: "infra";
  fetchPlugins: ({
    id: string;
    name: string;
    hooks: {
      onRequest<T extends Record<string, any>>(context: _better_fetch_fetch0.RequestContext<T>): Promise<_better_fetch_fetch0.RequestContext<T>>;
      onResponse?: undefined;
    };
  } | {
    id: string;
    name: string;
    hooks: {
      onResponse(context: _better_fetch_fetch0.ResponseContext): Promise<_better_fetch_fetch0.ResponseContext>;
      onRequest<T extends Record<string, any>>(context: _better_fetch_fetch0.RequestContext<T>): Promise<_better_fetch_fetch0.RequestContext<T>>;
    };
  })[];
};
//#endregion
export { InfraClientOptions, infraClient };