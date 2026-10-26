# Features

| Feature                                 | Flag                | Web | Desktop | Full |
|-----------------------------------------|---------------------|-----|---------|------|
| Ukrainian/English selector              | `languageSwitching` | On  | On      | On   |
| Feedback mobility and strength modes    | `feedbackModes`     | On  | Off     | On   |
| Biological-age calculator               | `biologicalAge`     | Off | Off     | On   |
| Motor/sensory components and CPI        | `advancedAnalysis`  | On  | On      | On   |
| JSON import/export and profile printing | `dataTools`         | On  | On      | On   |

Always available: SVMR/CRT tests, all stimulus types, test settings, basic statistics
and charts, profiles/history, saving and themes. Desktop activation is required.

## Configure and build

Edit `featureProfiles.desktop` in [`src/config/feature-profiles.ts`](../src/config/feature-profiles.ts).
Set a flag to `true` to enable it or `false` to hide it. For example,
`languageSwitching: false` hides the selector and uses Ukrainian.

In PowerShell, use `npm.cmd` so the `--` separator reaches npm unchanged.

```powershell
npm.cmd run desktop:build                 # Desktop installer; desktop mode
npm.cmd run desktop:build -- --mode full   # Desktop installer; all features
npm.cmd run desktop:dev -- --mode full     # Desktop development; all features
npm.cmd run build -- --mode full           # Web build; all features
```

Modes: `web`, `desktop`, `full`. Ordinary web commands default to `web`;
desktop commands default to `desktop`. Rebuild after changing flags.
