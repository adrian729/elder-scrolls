# Development records

These prompts and verification records document the renderer's development. Some historical checks include experiments or baseline comparisons that are no longer selectable in the demo; the guide distinguishes them from current behavior. They are evidence from particular Chromium runs, not a cross-browser or real-device performance certification.

Local workstation paths have been replaced with descriptive relative labels. `generated-originals/`, `local-inputs/`, `temporary-files/`, and `historical-baseline/` identify development inputs or comparison artifacts and are not repository directories. The shipped artwork is in [`../assets/`](../assets/). Reference photographs and earlier prototype archives are not included.

The reusable-library revision adds `library-integration-verification.json` (packed vanilla/React consumers, types/lifecycle/hydration) and `library-demo-verification.json` (unchanged artwork, responsive illustrated demo). Older extraction instructions and file paths in historical records describe earlier commits, not the current integration API.

[0.1.7 release verification](release-0.1.7-verification.json) records the
medieval-ornaments 0.11.0 update, successful CI/publication/deployment runs,
byte verification of the published npm package and CDN entry points, live demo
checks, and integrity checks for the deployed and released browser downloads.
