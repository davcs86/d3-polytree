import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConsoleNotificationService } from './notifications';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConsoleNotificationService', () => {
  it('routes each level to the matching console sink', () => {
    const svc = new ConsoleNotificationService();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    svc.error({ title: 'Nope', text: 'bad' });
    svc.warning({ title: 'Careful' });
    svc.success({ text: 'done' });

    expect(error).toHaveBeenCalledWith('ERROR: Nope: bad');
    expect(warn).toHaveBeenCalledWith('WARNING: Careful');
    expect(info).toHaveBeenCalledWith('SUCCESS: done');
  });

  it('treats a confirmation callback as cancelled by default', () => {
    const svc = new ConsoleNotificationService();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const cb = vi.fn();
    svc.info({ title: 'Confirm?' }, cb);
    expect(cb).toHaveBeenCalledWith(false);
  });
});
