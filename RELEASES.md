# Releases

## [Unreleased]

## [v0.2.0] - 2026-04-29

Test release for automation

<!--
Release process:

1. Add a new section under "## [Unreleased]" using the format:

       ## [vX.Y.Z] - YYYY-MM-DD

       - Bullet points of user-visible changes
       - One per line, in past tense

2. Push to main. The release-prepare workflow will:
   - Pull latest dist from dyalog/ewc-client@main
   - Open a "Release vX.Y.Z" PR if client/dist/ changed
   - Otherwise tag and release directly

3. Review and merge the release PR. The release-publish workflow then
   creates tag vX.Y.Z and publishes a GitHub Release with these notes.

The version at the top of this file is the one that will be released.
Versions already tagged are skipped.
-->
