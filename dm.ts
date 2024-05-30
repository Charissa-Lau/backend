import { validateToken, getUserId } from './other';
import { getData } from './dataStore';
import * as type from './types';
import HTTPError from 'http-errors';

/**
* Given dmID of DM that authorised user is a member of, return up to 50 messages from the start index
*
* @param (string) token – identifier of authorised user who is member of DM
* @param (integer) dmId – dmId of DM messages are returned from
* @param (integer) start - the starting index from where the proceeding 50 messages must be taken
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
* 1. dmId does not refer to a valid DM
* 2. start is greater than the total number of messages in the channel
* 3. dmId is valid and the authorised user is not a member of the DM
* 4. token is invalid
* @returns {object} – if no HTTPErrors it will return an object {messages, start, end}. End is a new index value of “start+50” or -1 for to indicate return of least recent messages.
*/
export function dmMessagesV1 (token: string, dmId: number, start: number) : type.Messages {
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token');
  }

  const dms = getData().dms;
  const dm = dms[dmId.toString()];

  if (!dm) {
    throw HTTPError(400, 'DM does not exist');
  }

  const authUserId = getUserId(token);

  if (!dm.allMembers.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(400, 'User is not a part of DM');
  }

  if (start < 0 || start > Object.keys(dm.messages).length) {
    throw HTTPError(400, 'Start not within range 0 < start < messages length');
  }

  const end = start + 50 > Object.keys(dm.messages).length ? -1 : start + 50;
  const _slice = end === -1 ? Object.keys(dm.messages).length : start + 50;

  let messageList = Object.values(dm.messages).slice(start, _slice);
  messageList = JSON.parse(JSON.stringify(messageList));
  messageList.sort((a, b) => b.timeSent - a.timeSent);

  for (const [_index, message] of messageList.entries()) {
    for (const [index, react] of message.reacts.entries()) {
      if (react.uIds.includes(authUserId)) {
        messageList[_index].reacts[index].isThisUserReacted = true;
      }
    }
  }

  return {
    messages: messageList,
    start: start,
    end: end
  };
}
