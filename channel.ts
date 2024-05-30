import { getData, setData } from './dataStore';
import { getUserId, validateUser, condense, validateChannel, userInChannel, isPublic, getUser, updateUserStats, updateAll } from './other';
import * as type from './types';
import HTTPError from 'http-errors';
import { addNotification, createNotificationString } from './notification';

/**
  * Returns the next 50 (or fewer) messages starting from the start index
  *
  * @param {String} authUserId - unique user ID for user making channelMessagesV1() function call
  * @param {String} channelId - unqiue channel ID being targetted by channelMessagesV1() function call
  * @param {Integer} start - the starting index from where the proceeding 50 messages must be taken
  *
  * @returns {Object} - returns HTTPError object if authUserId is invalid, if channelId is invalid, or if the start value is not in [1, length of messages array]
  * @returns {Object} - returns object containing a messages array, the starting index of the messages array, and the ending index of the messages array.
  * */

export function channelMessagesV2 (token:string, channelId:number, start:number):type.Messages {
  const _data : type.Data = getData();
  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if ((`${channelId}` in _data.channels) === false ||
      start < 0 || start > Object.keys(_data.channels[`${channelId}`].messages).length) {
    throw HTTPError(400, 'Invalid channel messages request!');
  }

  if (!userInChannel(getUserId(token), channelId)) {
    throw HTTPError(403, 'channelId is valid and the authorised user is not a member of the channel!');
  }

  const _length:number = Object.keys(_data.channels[`${channelId}`].messages).length;
  const end:number = start + 50 > _length ? -1 : start + 50;
  const sliceEnd = end === -1 ? _length : end;

  let messageList = Object.values(_data.channels[`${channelId}`].messages).slice(start, sliceEnd);
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

/**
  * Given a channel with ID channelId that the authorised user is a member of, provides basic details about the channel.
  *
  * @param {integer} authUserId - uId of the user who is trying to call the function
  * @param {integer} channelId - channelId of channel person is part of and to provide details about
  *
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. channelId does not refer to a valid channel
  * 2. channelId is valid and the authorised user is not a member of the channel
  * 3. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an object with details about the channel
*/

export function channelDetailsV2(token: string, channelId: number) : type.ChannelDetails {
  const data : type.Data = getData();

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (!validateChannel(channelId)) {
    throw HTTPError(400, 'channel doesnt exist!');
  }

  if (!userInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'auth user not part of the channel!');
  }

  const newOwnerMembers = []; // the fact that this works is the dumbest thing in ES6
  const newAllMembers = [];

  const channel = data.channels[channelId.toString()];

  for (const user of channel.ownerMembers) {
    newOwnerMembers.push(condense(user));
  }

  for (const user of channel.allMembers) {
    newAllMembers.push(condense(user));
  }
  return { name: channel.name, isPublic: channel.isPublic, ownerMembers: newOwnerMembers, allMembers: newAllMembers };
}

/**
  * Given a channelId of a channel that the authorised user can join, adds them to that channel.
  *
  * @param {integer} authUserId - uId of person trying to join
  * @param {integer} channelId - channelId of channel that the authorized user wants to join
  *
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. channelId does not refer to a valid channel
  * 2. the authorised user is already a member of the channel
  * 3. channelId refers to a channel that is private, when the authorised user is not already a channel member and is not a global owner
  * 4. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an empty object
*/

export function channelJoinV2(token: string, channelId: number) : type.emptyObject {
  const data:type.Data = getData();

  const authUserId:number = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (!validateChannel(channelId)) { // check if channel is valid
    throw HTTPError(400, 'channel is invalid!');
  }

  if (userInChannel(authUserId, channelId)) {
    throw HTTPError(400, 'channel is valid check if user is already a member');
  }

  if (!isPublic(channelId)) { // channel is private and user is not a global owner
    if (getUser(authUserId).permission === 2) {
      throw HTTPError(403, 'channel is private and user is not a global owner');
    }
  }

  data.channels[channelId.toString()].allMembers.push(getUser(authUserId));

  setData(data);
  // updating userstats
  updateUserStats(getUserId(token), 'cj', 1);
  // updating rate
  updateAll();
  return {};
}
/**
  * Given a channelId of a channel that the user can join, invites them to that channel.
  *
  * @param {integer} authUserId - uId of person that invites others
  * @param {integer} channelId - channelId of channel that the user was invited to join
  * @param {integer} uId - uId of person who is invited
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. channelId does not refer to a valid channel
  * 2. uId does not refer to a valid user
  * 3. uId refers to a user who is already a member of the channel
  * 4. channelId is valid and the authorised user is not a member of the channel
  * 5. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an empty object
*/
export function channelInviteV2(token:string, channelId:number, uId:number) : type.emptyObject {
  const data:type.Data = getData();

  const authUserId:number = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  // is channel Id valid
  if (!validateChannel(channelId)) {
    throw HTTPError(400, 'channel Id invalid');
  }

  if (!validateUser(uId)) {
    throw HTTPError(400, 'uID invalid');
  }

  if (userInChannel(uId, channelId)) {
    throw HTTPError(400, 'uid is a member of channel');
  }

  if (!userInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'channel exists, auth user isnt member of channel');
  }

  data.channels[channelId].allMembers.push(getUser(uId));

  const notification : type.notification = {
    notificationMessage: createNotificationString(channelId, 'add', authUserId, false),
    channelId: channelId,
    dmId: -1
  };

  addNotification(uId, notification);

  setData(data);
  // updating userstats
  updateUserStats(uId, 'cj', 1);
  // updating rate
  updateAll();
  return {};
}
