import type { Canvas } from '@d3-polytree/canvas';
import type {
  NotificationService,
  NotificationParams,
  NotificationType,
  NotificationCallback
} from '@d3-polytree/core';

/**
 * A dependency-free DOM notifications UI: transient toasts for
 * info/success/warning/error, and a modal confirm dialog when a callback is
 * supplied (so a destructive action like "New diagram" can be confirmed).
 *
 * The engine's default `notifications` is the headless
 * `ConsoleNotificationService`, which only logs and reports every confirmation
 * as *cancelled* — which is why, without this, the palette's "New" button did
 * nothing and "Save" gave no feedback. Composing this module overrides the
 * `notifications` token for the interactive components (the beta bound the same
 * role to `sweetalert`; this is the modern, dependency-free replacement).
 */
export class DomNotifications implements NotificationService {
  static readonly $inject = ['canvas'];

  private readonly _root: HTMLElement;

  constructor(canvas: Canvas) {
    this._root = document.createElement('div');
    this._root.className = 'pfdjs-notifications';
    canvas.getContainer().appendChild(this._root);
  }

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
    if (callback) {
      this._confirm(params, type, callback);
    } else {
      this._toast(params, type);
    }
  }

  private _fillText(el: HTMLElement, params: NotificationParams): void {
    // Safe by default: `text` is always rendered as textContent. Markup is
    // rendered only when a caller supplies it via the dedicated `trustedHtml`
    // field — a separate field (not a boolean on `text`) so untrusted or
    // model-derived content can never reach innerHTML by flipping a flag.
    if (typeof params.trustedHtml === 'string') {
      el.innerHTML = params.trustedHtml;
    } else {
      el.textContent = String(params.text ?? '');
    }
  }

  private _toast(params: NotificationParams, type: NotificationType): void {
    const toast = document.createElement('div');
    toast.className = `pfdjs-toast pfdjs-toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    if (params.title) {
      const title = document.createElement('div');
      title.className = 'pfdjs-toast-title';
      title.textContent = String(params.title);
      toast.appendChild(title);
    }
    const text = document.createElement('div');
    text.className = 'pfdjs-toast-text';
    this._fillText(text, params);
    toast.appendChild(text);

    this._root.appendChild(toast);

    const dismiss = (): void => {
      toast.classList.add('pfdjs-toast-out');
      window.setTimeout(() => toast.remove(), 250);
    };
    toast.addEventListener('click', dismiss);
    window.setTimeout(dismiss, 3200);
  }

  private _confirm(
    params: NotificationParams,
    type: NotificationType,
    callback: NotificationCallback
  ): void {
    const overlay = document.createElement('div');
    overlay.className = 'pfdjs-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = `pfdjs-dialog pfdjs-dialog-${type}`;
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');

    if (params.title) {
      const title = document.createElement('div');
      title.className = 'pfdjs-dialog-title';
      title.textContent = String(params.title);
      dialog.appendChild(title);
    }
    const text = document.createElement('div');
    text.className = 'pfdjs-dialog-text';
    this._fillText(text, params);
    dialog.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'pfdjs-dialog-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'pfdjs-dialog-btn pfdjs-dialog-cancel';
    cancel.textContent = 'Cancel';
    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'pfdjs-dialog-btn pfdjs-dialog-ok';
    ok.textContent = 'OK';
    actions.append(cancel, ok);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    this._root.appendChild(overlay);

    let settled = false;
    const finish = (confirmed: boolean): void => {
      if (settled) {
        return;
      }
      settled = true;
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      callback(confirmed);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        finish(false);
      } else if (e.key === 'Enter') {
        finish(true);
      }
    };
    ok.addEventListener('click', () => finish(true));
    cancel.addEventListener('click', () => finish(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        finish(false);
      }
    });
    document.addEventListener('keydown', onKey);
    ok.focus();
  }
}

/**
 * didi module contributing the DOM notifications service. Composed **last** by
 * the interactive components so it overrides the core `ConsoleNotificationService`
 * bound to the same `notifications` token.
 */
export const domNotificationsModule = {
  notifications: ['type', DomNotifications]
};
