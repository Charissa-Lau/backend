import { getData, setData } from './dataStore';
import * as type from './types';
import { validateUser, validateToken, validateChannel, getUserId, userInChannel, updateUserStats, updateAll } from './other';
import HTTPError from 'http-errors';

/**
  * Given a channel with ID channelId that the authorised user is a member of,
  * remove them as a member of the channel. Their messages should remain in the channel.
  * If the only channel owner leaves, the channel will remain.
  *
  * @param {string} token - an active token
  * @param {integer} channelId - channelId of channel that the user is leaving
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. channelId does not refer to a valid channel
  *   2. the authorised user is already a member of the channel
  *   3. token is invalid
  * @returns {object} - if there are no HTTPErrors, returns an empty object
*/
export function channelLeaveV1(token:string, channelId:number) {
  const _data: type.Data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (!validateChannel(channelId)) {
    throw HTTPError(400, 'Invalid channelId!');
  }

  const userId = getUserId(token);
  if (!userInChannel(userId, channelId)) {
    throw HTTPError(403, 'user not a member!');
  }
  const channel = _data.channels[channelId.toString()];

  for (const [index, user] of channel.ownerMembers.entries()) {
    if (user.uId === userId) {
      _data.channels[channelId.toString()].ownerMembers.splice(index, 1);
      break;
    }
  }
  for (const [index, user] of channel.allMembers.entries()) {
    if (user.uId === userId) {
      _data.channels[channelId.toString()].allMembers.splice(index, 1);
      break;
    }
  }
  setData(_data);
  // updating userstats
  updateUserStats(getUserId(token), 'cj', -1);
  // updating rate
  updateAll();

  return {};
}

/**
  * Make user with user id uId an owner of the channel.
  *
  * @param {string} token - an active token
  * @param {integer} channelId - channelId of channel that user is being added as owner
  * @param {integer} uId - uId of person who is being added as owner
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. channelId does not refer to a valid channel
  *   2. uId does not refer to a valid user
  *   3. uId refers to a user who is not a member of the channel
  *   4. uId refers to a user who is already an owner of the channel
  *   5. channelId is valid and the authorised user does not have owner permissions in the channel
  *   6. token is invalid
  * @returns {object} - if there are no HTTPErrors, returns an empty object
*/
export function channelAddOwnerV1(token:string, channelId:number, uId:number) {
  const _data: type.Data = getData();
  // check if token valid
  if (!validateToken(token)) {
    throw HTTPError(403, 'token not valid');
  }
  // check if channelId valid
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  // check if uId valid
  if (validateUser(uId) === false) {
    throw HTTPError(400, 'Invalid uId!');
  }
  let found = false;
  // check if uId is a member of channel
  let addUser;
  for (const i of _data.channels[channelId.toString()].allMembers) {
    if (i.uId === uId) {
      addUser = i;
      found = true;
      break;
    }
  }
  if (found === false) {
    throw HTTPError(400, 'uId not a member');
  }

  // check if uId refers to a user who is already an owner of the channel
  for (const i of _data.channels[channelId.toString()].ownerMembers) {
    if (i.uId === uId) {
      throw HTTPError(400, 'uId is already owner');
    }
  }

  // channelId is valid and the authorised user does not have owner permissions in the channel
  found = false;
  for (const i of _data.channels[channelId.toString()].ownerMembers) {
    if (i.uId === getUserId(token)) {
      found = true;
      break;
    }
  }
  if (found === false) {
    for (const i in _data.users) {
      if (_data.users[i].uId === getUserId(token)) {
        if (_data.users[i].permission !== 1) {
          throw HTTPError(403, 'auth user does not have owner permissions in the channel');
        }
      }
    }
  }
  // simple implementation
  _data.channels[channelId.toString()].ownerMembers.push(addUser);

  setData(_data);
  return {};
}

/**
  * Remove user with user id uId as an owner of the channel.
  *
  * @param {string} token - an active token
  * @param {integer} channelId - channelId of channel that user is being removed as owner
  * @param {integer} uId - uId of person who is being removed as owner
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. channelId does not refer to a valid channel
  *   2. uId does not refer to a valid user
  *   3. uId refers to a user who is not an owner of the channel
  *   4. uId refers to a user who is currently the only owner of the channel
  *   5. channelId is valid and the authorised user does not have owner permissions in the channel
  *   6. token is invalid
  * @returns {object} - if there are no HTTPErrors, returns an empty object
*/
export function channelRemoveOwnerV1(token:string, channelId:number, uId:number) {
  const _data: type.Data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  // check if channelId valid
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  // check if uId valid
  if (validateUser(uId) === false) {
    throw HTTPError(400, 'Invalid uId!');
  }

  const authUserId = getUserId(token);

  if (!userInChannel(authUserId, channelId)) {
    throw HTTPError(400, 'uId not a member');
  }
  // check if only one owner
  if (_data.channels[channelId.toString()].ownerMembers.length === 1) {
    throw HTTPError(400, 'only one owner!');
  }
  // check if token valid
  // channelId is valid and the authorised user does not have owner permissions in the channel

  const owners = _data.channels[channelId.toString()].ownerMembers;

  if (!owners.map(user => user.uId).includes(authUserId) && _data.users[authUserId].permission !== 1) {
    throw HTTPError(403, 'auth user does not have owner permissions in the channel');
  }
  // implementation
  for (const [index, user] of owners.entries()) {
    if (user.uId === uId) {
      _data.channels[channelId.toString()].ownerMembers.splice(index, 1);
      break;
    }
  }

  setData(_data);

  return {};
}
