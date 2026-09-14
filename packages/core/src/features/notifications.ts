export interface NotificationParams {
  title?: string;
  text?: string;
  [key: string]: unknown;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Called with the user's confirmation result (true = confirmed). */
export type NotificationCallback = (confirmed: boolean) => void;

/**
 * User notifications / confirmations. Injected under the `notifications` token;
 * interactive UIs (the editor) provide their own implementation. The original
 * bound this directly to `sweetalert`; core now defines only the interface and a
 * dependency-light default, keeping the engine UI-agnostic.
 */
export interface NotificationService {
  info(params: NotificationParams, callback?: NotificationCallback): void;
  success(params: NotificationParams, callback?: NotificationCallback): void;
  warning(params: NotificationParams, callback?: NotificationCallback): void;
  error(params: NotificationParams, callback?: NotificationCallback): void;
  notify(params: NotificationParams, type: NotificationType, callback?: NotificationCallback): void;
}

/**
 * Default, dependency-free notifications: logs to the console and treats any
 * confirmation as cancelled (a headless engine must not auto-confirm a
 * destructive action). Replace it by injecting your own `notifications`.
 */
export class ConsoleNotificationService implements NotificationService {
  info(params: NotificationParams, callback?: NotificationCallback): void {
    this.notify(params, 'info', callback);
  }
  success(params: NotificationParams, callback?: NotificationCallback): void {
    this.notify(params, 'success', callback);
  }
  warning(params: NotificationParams, callback?: NotificationCallback): void {
    this.notify(params, 'warning', callback);
  }
  error(params: NotificationParams, callback?: NotificationCallback): void {
    this.notify(params, 'error', callback);
  }
  notify(
    params: NotificationParams,
    type: NotificationType,
    callback?: NotificationCallback
  ): void {
    const message = [type.toUpperCase(), params.title, params.text].filter(Boolean).join(': ');
    const sink =
      type === 'error' ? console.error : type === 'warning' ? console.warn : console.info;
    sink.call(console, message);
    callback?.(false);
  }
}

/** didi module contributing the default notifications service. */
export const notificationsModule = {
  __init__: ['notifications'],
  notifications: ['type', ConsoleNotificationService]
};
