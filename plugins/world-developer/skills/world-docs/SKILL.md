---
name: world-docs
description: Find and explain current World developer documentation for World ID, IDKit, MiniKit, World Chain, AgentKit, and Developer Portal APIs. Use for technical questions or documentation needed during implementation; not token prices or consumer account support.
---

# World documentation

Answer from the relevant product, version, and environment. Documentation access does not require a Portal team or API key.

1. For repository questions, identify the installed package versions and integration being discussed. Distinguish documentation for a new integration from compatibility guidance for an existing one.
2. Discover the tool ending in `search_world_documentation` and search for the specific task and version. Read the relevant page or section with `query_docs_filesystem_world_documentation`, using paths returned by discovery. Prefer `head` and targeted `rg -C` to reading the whole site.
3. If those tools are unavailable, fetch `https://docs.world.org/llms.txt`, then the relevant Markdown links it actually contains. Report failed retrieval rather than inventing endpoints or treating cached examples as current.
4. Use live tool schemas for accepted Portal arguments, installed package types for callable SDK APIs, and version-matched docs for behavior. If they disagree, identify the discrepancy; do not silently combine incompatible versions.
5. Cite the page supporting the answer. Separate confirmed facts from an implementation inference. A documentation question does not require Portal inspection, app creation, code edits, or feedback submission.

For implementation use the sibling [world-build skill](../world-build/SKILL.md). For an account-specific configuration question use [world-portal](../world-portal/SKILL.md) only when Portal access is actually needed.
