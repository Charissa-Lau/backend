import { getData, setData } from './dataStore';
import { getUser, getUserId, validateUser } from './other';
import * as type from './types';
import HTTPError from 'http-errors';

export function createNotificationString (id: number, notificationType : type.notificationType, sourceUser: number, isDm : boolean, messageId?: number) : string {
  const data : type.Data = getData();
  const source = getUser(sourceUser);
  const messageSource = isDm === true ? data.dms[id.toString()] : data.channels[id.toString()];

  let message;
  if (messageId) {
    message = messageSource.messages[messageId.toString()].message;
  }

  switch (notificationType) {
    case 'add':
      return `${source.handleStr} added you to ${messageSource.name}`;
    case 'react':
      return `${source.handleStr} reacted to your message in ${messageSource.name}`;
    case 'tag':
      return `${source.handleStr} tagged you in ${messageSource.name}: ${message.slice(0, message.length < 20 ? message.length : 20)}`;
    default:
      throw HTTPError(400, 'Invalid notification type!');
  }
}

/**
  * Returns the user's most recent 20 notifications, ordered from most recent to least recent.
  *
  * @returns {object} - returns the object { notifications }
*/

export function getNotifications (token: string) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const n = getData().notifications[userId.toString()];

  if (!n) {
    return { notifications: [] };
  }

  const notifications = n.slice(0, n.length < 20 ? n.length : 20);

  return { notifications: notifications };
}

export function addNotification (userId: number, notification: type.notification) {
  if (!validateUser(userId)) {
    throw HTTPError(403, 'Invalid token!');
  }

  const _data : type.Data = getData();

  if (_data.notifications[userId.toString()]) {
    _data.notifications[userId.toString()].unshift(notification);
  } else {
    _data.notifications[userId.toString()] = [notification];
  }

  setData(_data);
}
