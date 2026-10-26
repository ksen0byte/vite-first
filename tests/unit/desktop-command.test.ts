import {describe, expect, it} from 'vitest';
import {desktopArgs} from '../../scripts/desktop.ts';

describe('desktop mode forwarding', () => {
  it.each(['build', 'dev'])('defaults %s to desktop mode', (command) => {
    const [action, configFlag, config] = desktopArgs(command, []);
    expect(action).toBe(command);
    expect(configFlag).toBe('--config');
    const hook = command === 'build' ? 'beforeBuildCommand' : 'beforeDevCommand';
    expect(JSON.parse(config).build[hook]).toContain('--mode desktop');
  });

  it.each(['build', 'dev'])('forwards --mode full to Vite for %s', (command) => {
    const args = desktopArgs(command, ['--mode', 'full']);
    expect(args.slice(0, 2)).toEqual([command, '--config']);
    const hook = command === 'build' ? 'beforeBuildCommand' : 'beforeDevCommand';
    expect(JSON.parse(args[2]).build[hook]).toContain('--mode full');
  });

  it.each([
    ['--mode'], ['--mode', 'missing'], ['--mode=full'], ['full'],
    ['--mode', 'full', '--verbose'], ['--', '--mode', 'full'],
  ])('rejects unsupported arguments %j before launching Tauri', (...args) => {
    expect(() => desktopArgs('build', args)).toThrow();
  });
});
