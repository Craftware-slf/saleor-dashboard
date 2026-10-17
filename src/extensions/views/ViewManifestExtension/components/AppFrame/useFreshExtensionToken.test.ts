import { act, renderHook, waitFor } from "@testing-library/react";

import { isTokenStale, useFreshExtensionToken } from "./useFreshExtensionToken";

const query = jest.fn();
const client = { query };

jest.mock("@apollo/client", () => ({
  ...(jest.requireActual("@apollo/client") as object),
  useApolloClient: () => client,
}));

/** An unsigned JWT whose `exp` is `inSeconds` from now — jwt-decode reads only the payload. */
const tokenExpiringIn = (inSeconds: number, tag = "t"): string => {
  const payload = { exp: Math.floor(Date.now() / 1000) + inSeconds, iat: 0, tag };
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

const minted = (accessToken: string) => ({
  data: { appExtension: { __typename: "AppExtension", id: "ext-1", accessToken } },
});

describe("isTokenStale", () => {
  it("is stale when expired, about to expire, or unreadable", () => {
    expect(isTokenStale(tokenExpiringIn(-10))).toBe(true);
    expect(isTokenStale(tokenExpiringIn(30))).toBe(true);
    expect(isTokenStale("not-a-jwt")).toBe(true);
    expect(isTokenStale("")).toBe(true);
  });

  it("is fresh with more than a minute left", () => {
    expect(isTokenStale(tokenExpiringIn(240))).toBe(false);
  });
});

describe("useFreshExtensionToken", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("re-mints at once when the frame opens on a dead token (the cache-first ExtensionList case)", async () => {
    const fresh = tokenExpiringIn(300, "fresh");

    query.mockResolvedValue(minted(fresh));

    const dead = tokenExpiringIn(-60);
    const { result } = renderHook(() => useFreshExtensionToken(dead, "ext-1"));

    await waitFor(() => expect(result.current.token).toBe(fresh));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: "ext-1" }, fetchPolicy: "network-only" }),
    );
  });

  it("keeps a fresh token without asking", () => {
    const live = tokenExpiringIn(240);
    const { result } = renderHook(() => useFreshExtensionToken(live, "ext-1"));

    expect(result.current.token).toBe(live);
    expect(query).not.toHaveBeenCalled();
  });

  it("is a pass-through without an extension id", () => {
    const dead = tokenExpiringIn(-60);
    const { result } = renderHook(() => useFreshExtensionToken(dead));

    expect(result.current.token).toBe(dead);
    expect(result.current.refresh).toBeUndefined();
    expect(query).not.toHaveBeenCalled();
  });

  it("sends one request when asked several times at once", async () => {
    let resolve: (v: unknown) => void = () => undefined;

    query.mockReturnValue(new Promise(r => (resolve = r)));

    const live = tokenExpiringIn(240);
    const { result } = renderHook(() => useFreshExtensionToken(live, "ext-1"));

    act(() => {
      void result.current.refresh?.();
      void result.current.refresh?.();
      void result.current.refresh?.();
    });
    expect(query).toHaveBeenCalledTimes(1);

    const fresh = tokenExpiringIn(300, "fresh");

    await act(async () => {
      resolve(minted(fresh));
    });
    expect(result.current.token).toBe(fresh);
  });

  it("keeps the token it has when the re-mint fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const dead = tokenExpiringIn(-60);

    query.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useFreshExtensionToken(dead, "ext-1"));

    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(result.current.token).toBe(dead);
    warn.mockRestore();
  });
});
