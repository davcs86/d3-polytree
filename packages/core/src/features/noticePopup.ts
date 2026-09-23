import type { Canvas } from '@d3-polytree/canvas';
import type { NotificationService } from './notifications';

const NOTICE_TEXT =
  'More info about this project in ' +
  '<a href="https://github.com/davcs86/d3-polytree" target="_blank" rel="noopener">' +
  'https://github.com/davcs86/d3-polytree</a>';

/**
 * A small info button that shows a project notice. Ported from `core-v2beta`'s
 * `features/noticePopup/NoticePopup.js`, modernised off `min-dom` onto native
 * DOM.
 */
export class NoticePopup {
  static readonly $inject = ['canvas', 'notifications'];

  constructor(canvas: Canvas, notifications: NotificationService) {
    const button = document.createElement('div');
    button.className = 'noticePopup';
    canvas.getContainer().appendChild(button);
    button.addEventListener('click', () => {
      notifications.notify({ title: 'D3-Polytree', trustedHtml: NOTICE_TEXT }, 'info');
    });
  }
}
