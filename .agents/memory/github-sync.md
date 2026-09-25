---
name: GitHub sync
description: Reliable publishing when the local GitHub tracking ref or HTTPS credentials do not match the connected repository.
---

Compare the current workspace tree directly with the intended GitHub branch before syncing. A local `origin/main` tracking ref may be stale even when the repository is reachable through the GitHub integration. If HTTPS Git push authentication fails, use the connected GitHub API to create a commit based on the live branch head, apply changed blobs, and update the ref without force. Preserve remote-only files unless their removal is explicitly part of the requested sync. Verify the new head and compare all current workspace blob hashes against the remote tree.

**Why:** The workspace's reported ahead count and stale local tracking ref did not match the live GitHub branch; direct HTTPS push credentials were unavailable, but the installed GitHub connection could publish and verify the project state.

**How to apply:** For future pushes from this workspace, check the live repository tree with the GitHub integration rather than trusting only `git status` or `origin/main`. Avoid force-updating the branch.