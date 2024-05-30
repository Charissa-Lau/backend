import { getUserId, userInChannel } from './other';
import { getData } from './dataStore';
import HTTPError from 'http-errors';

/**
  * Given a query substring, returns a collection of messages in all of the channels/DMs that
  * the user has joined that contain the query (case-insensitive). There is no expected order
  * for these messages.
  *
  * @param {string} queryStr - the query substring
  *
  * @throws 400 error when length of queryStr is less than 1 or over 1000 characters
  * @returns {object} - if no errors, return object { messages }
*/

export function searchV1 (token: string, queryString: string) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (queryString.length > 1000) {
    throw HTTPError(400, 'Query string is too long!');
  }

  queryString = queryString.toLowerCase();

  const _messages = [];

  for (const [channelId, channel] of Object.entries(getData().channels)) {
    if (!userInChannel(userId, parseInt(channelId))) {
      continue;
    }

    const messages = Object.values(channel.messages).map(message => {
      return {
        messageId: message.messageId,
        message: message.message.toLowerCase()
      };
    });

    for (const message of messages) {
      if (message.message.includes(queryString)) {
        _messages.push(channel.messages[message.messageId.toString()]);
      }
    }
  }

  for (const dm of Object.values(getData().dms)) {
    if (!dm.allMembers.map(user => user.uId).includes(userId)) {
      continue;
    }

    const messages = Object.values(dm.messages).map(message => {
      return {
        messageId: message.messageId,
        message: message.message.toLowerCase()
      };
    });

    for (const message of messages) {
      if (message.message.includes(queryString)) {
        _messages.push(dm.messages[message.messageId.toString()]);
      }
    }
  }

  return { messages: _messages };
}
