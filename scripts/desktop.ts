import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

/** Tauri has no --mode option, so forward it to its Vite build/dev command. */
export function desktopArgs(command: string, args: string[]): string[] {
  if (command !== 'build' && command !== 'dev') throw new Error('Expected build or dev');
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--mode')) {
    throw new Error('Use --mode <web|desktop|full>. In PowerShell: npm.cmd run desktop:build -- --mode full');
  }
  const mode = args[1] ?? 'desktop';
  if (!['web', 'desktop', 'full'].includes(mode)) throw new Error('Mode must be web, desktop, or full');

  const hook = command === 'build'
    ? {beforeBuildCommand: `npm run build -- --base / --outDir dist-desktop --mode ${mode}`}
    : {beforeDevCommand: `npm run dev -- --base / --port 1420 --strictPort --mode ${mode}`};
  return [command, '--config', JSON.stringify({build: hook})];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = desktopArgs(process.argv[2], process.argv.slice(3));
  const cli = createRequire(import.meta.url).resolve('@tauri-apps/cli/tauri.js');
  const result = spawnSync(process.execPath, [cli, ...args], {stdio: 'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
