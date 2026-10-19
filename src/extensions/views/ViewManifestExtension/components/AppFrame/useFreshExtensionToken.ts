import { useApolloClient } from "@apollo/client";
import {
  ExtensionAccessTokenDocument,
  type ExtensionAccessTokenQuery,
  type ExtensionAccessTokenQueryVariables,
} from "@dashboard/graphql";
import jwt_decode from "jwt-decode";
import { useCallback, useEffect, useRef, useState } from "react";

import { createAppsDebug } from "../../utils/apps-debug";

const debug = createAppsDebug("useFreshExtensionToken");

/**
 * Headroom demanded of a token before it is handed to an app. Saleor's JWT_TTL_ACCESS is
 * five minutes, and the app still has to make its request and have it verified.
 */
const STALE_WITHIN_MS = 60 * 1000;

/** True when the token is expired, about to be, or unreadable. */
export const isTokenStale = (token: string, now: number = Date.now()): boolean => {
  if (!token) {
    return true;
  }

  try {
    const { exp } = jwt_decode<{ exp?: number }>(token);

    return !exp || exp * 1000 - now < STALE_WITHIN_MS;
  } catch {
    return true;
  }
};

/**
 * Craftware: keeps a POPUP or WIDGET extension's access token alive.
 *
 * The token an extension receives comes from the ExtensionList query, which is read
 * cache-first: it is minted once per dashboard page load and is dead five minutes later.
 * Upstream renews only APP_PAGE tokens (AppFrame's `refetch`), so a popup opened after the
 * page had been up for five minutes was handed an expired token — and when the app asked
 * again (NotifyReady), the same expired token — leaving it nothing to authenticate with
 * until the whole dashboard was reloaded.
 *
 * This re-mints the extension's own token (network-only `appExtension(id)`, so it carries
 * the extension's permissions, not the whole app's) when the frame opens on a stale one,
 * when the tab comes back into view, and on demand; AppFrame's timer covers a frame that
 * simply stays open. A new token reaches the app through useUpdateAppToken's
 * `tokenRefresh` event. Without an `extensionId` it is a no-op and the token is passed
 * through unchanged.
 */
export const useFreshExtensionToken = (
  initialToken: string,
  extensionId?: string,
): { token: string; refresh: (() => Promise<void>) | undefined } => {
  const client = useApolloClient();
  // A re-minted token is kept against the token it replaced, so a new `initialToken` from
  // the caller (a different extension, or ExtensionList refetched) wins on its own.
  const [minted, setMinted] = useState<{ replaces: string; token: string } | null>(null);
  const token = minted?.replaces === initialToken ? minted.token : initialToken;
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((): Promise<void> => {
    if (!extensionId) {
      return Promise.resolve();
    }

    // One request at a time: a stale frame can ask from mount, focus and NotifyReady at once.
    if (inFlight.current) {
      return inFlight.current;
    }

    debug("Re-minting extension token");
    inFlight.current = client
      .query<ExtensionAccessTokenQuery, ExtensionAccessTokenQueryVariables>({
        query: ExtensionAccessTokenDocument,
        variables: { id: extensionId },
        fetchPolicy: "network-only",
      })
      .then(({ data }) => {
        const fresh = data?.appExtension?.accessToken;

        if (fresh) {
          setMinted({ replaces: initialToken, token: fresh });
        }
      })
      .catch((error: unknown) => {
        console.warn("Could not refresh the app extension token", error);
      })
      .finally(() => {
        inFlight.current = null;
      });

    return inFlight.current;
  }, [client, extensionId, initialToken]);

  // Read through a ref so the effects below fire on the token, not on `refresh` identity.
  const refreshRef = useRef(refresh);

  useEffect(
    function keepRefreshCurrent() {
      refreshRef.current = refresh;
    },
    [refresh],
  );

  // Opened on a token that is already dead (the page has been up > 5 min): replace it now.
  useEffect(
    function remintStaleTokenOnOpen() {
      if (extensionId && isTokenStale(initialToken)) {
        void refreshRef.current();
      }
    },
    [extensionId, initialToken],
  );

  // A backgrounded tab throttles timers, so the scheduled refresh can arrive late; catch up
  // as soon as the dashboard is looked at again.
  useEffect(
    function remintStaleTokenOnFocus() {
      if (!extensionId) {
        return;
      }

      const onVisible = (): void => {
        if (document.visibilityState === "visible" && isTokenStale(token)) {
          void refreshRef.current();
        }
      };

      document.addEventListener("visibilitychange", onVisible);

      return () => {
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
    [extensionId, token],
  );

  return { token, refresh: extensionId ? refresh : undefined };
};
