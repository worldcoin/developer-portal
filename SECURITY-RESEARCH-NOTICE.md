# Security Research Test PR

This PR is part of an authorized HackerOne bug bounty engagement against the
`toolsforhumanity` program (researcher handle: manetos).

Purpose: confirm whether the `e2e-tests` job in `.github/workflows/ci-app-router.yml`
(which declares `environment: development`, an environment whose GitHub API-visible
protection rules are currently empty, unlike `production`/`staging`) runs automatically
for a first-time external contributor, or requires manual approval.

No code paths are modified, no secrets are read or exfiltrated. This PR will be closed
immediately after the CI status is observed.
