---
"saleor-dashboard": patch
---

Copy `patches/` into the Docker build context before `pnpm install` (FEAT-147 follow-up).

`pnpm-workspace.yaml` now declares `patchedDependencies`, so `pnpm install --frozen-lockfile` needs the patch files on disk. The Dockerfile's dependency stage copied only `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `.npmrc`, so the image build failed with:

```
ENOENT: no such file or directory, open '/app/patches/@saleor__macaw-ui@1.4.2.patch'
ERROR: process "/bin/sh -c pnpm install --frozen-lockfile" did not complete successfully: exit code: 254
```

Worth noting for future patches: **no PR check catches this.** `tsc-and-linters`, `jest-tests`, `storybook-tests` and the rest all run against the checkout, where `patches/` obviously exists — the Dockerfile's hand-maintained COPY list is only exercised by the post-merge image build. The same fix is applied to `.devcontainer/Dockerfile`, which installs with `--frozen-lockfile` too.
