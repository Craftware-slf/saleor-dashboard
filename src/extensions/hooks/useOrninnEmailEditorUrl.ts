// Craftware: resolves the dashboard route for the Örninn customer-email editor
// (FEAT-091).
//
// The editor is a page of the BC Sync app. The dashboard renders any app page at
// /extensions/app/<appId>/<subPath>, stripping that prefix and joining the
// remainder onto the app's own appUrl — so the route exists as soon as the app is
// installed, with no app extension needed. That matters here: the editor
// deliberately has NO nav entry (an email editor does not belong in the Orders
// sidebar, and Saleor offers no Configuration mount), so this deep link is the
// only way in.
//
// The app id is a Saleor global id and differs per environment, so it has to be
// looked up at runtime rather than configured. Matched on `identifier`, which
// comes from the manifest and is stable across installs, not on the display name,
// which someone will eventually rename.

// InstalledApps (not InstalledAppsList): its `InstalledApp` fragment is the one
// that selects `identifier`. The heavier InstalledAppDetails fragment does not.
import { useInstalledAppsQuery } from "@dashboard/graphql";

import { ExtensionsUrls } from "../urls";

/** Manifest identifier of the app that owns the editor. */
const APP_IDENTIFIER = "orninn.bc-sync";

/** Path of the editor WITHIN the app, relative to its appUrl (…/dashboard). */
const EDITOR_SUB_PATH = "email-templates";

/**
 * Dashboard URL of the customer-email editor, or `null` while loading or when the
 * app is not installed.
 *
 * Callers must render nothing on `null`: an environment where the app has not been
 * installed should degrade to no link rather than a dead one.
 */
export const useOrninnEmailEditorUrl = (): string | null => {
  const { data } = useInstalledAppsQuery({
    fetchPolicy: "cache-first",
    variables: { first: 100 },
  });

  const app = data?.apps?.edges
    .map(edge => edge.node)
    .find(node => node.identifier === APP_IDENTIFIER);

  if (!app?.id) {
    return null;
  }

  return ExtensionsUrls.resolveAppDeepUrl(app.id, EDITOR_SUB_PATH);
};
