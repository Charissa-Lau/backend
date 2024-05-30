import { getData, setData } from './dataStore';
import { validateToken, validateUser, getUser, getUserId, condense, lastElementOf, updateUserStats, updateAll } from './other';
import * as type from './types';
import HTTPError from 'http-errors';
import { addNotification, createNotificationString } from './notification';

type DmId = {
 dmId:number;
};

/**
  * Given uIDs, creates a DM. The uIds contains the user(s) that this DM is directed to,
  * and does not include the creator. The creator is the owner of the DM.
  * name is automatically generated based on the users that are in this DM.
  * The name is alphabetically-sorted, comma-and-space-separated list of user handles,
  * e.g. 'ahandle1, bhandle2, chandle3'.
  * An empty uIds list indicates the creator is the only member of the DM.
  *
  * @param {string} token - an active token
  * @param {object} uIds - the uIds of the user(s) the DM is directed to
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. any uId in uIds does not refer to a valid user
  *   2. there are duplicate 'uId's in uIds
  *   3. token is invalid
  * @returns {object} - returns an object containing the dmID
*/
export function dmCreateV1(token : string, uIds : number[]) : DmId {
  const _data:type.Data = getData();
  // check if uIds valid
  for (const uId of uIds) {
    if (!validateUser(uId)) {
      throw HTTPError(400, 'Invalid uIds1');
    }
  }
  // check if token valid
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  // check if there are duplicates in uIds
  const handleArray:string[] = [];
  const handleSet = new Set();
  // implementation
  // add owner
  const ownerMembers:type.rawUser[] = [];
  const allMembers:type.rawUser[] = [];

  const ownerUser = getUser(getUserId(token));

  ownerMembers.push(ownerUser);
  allMembers.push(ownerUser);
  handleArray.push(ownerUser.handleStr);
  handleSet.add(ownerUser.handleStr);
  // add members
  for (const uId of uIds) {
    const user = getUser(uId);

    allMembers.push(user);
    handleArray.push(user.handleStr);
    handleSet.add(user.handleStr);
  }
  // checking duplicates
  if (handleSet.size !== handleArray.length) {
    throw HTTPError(400, 'Duplicate members found in DM!');
  }

  // generate name
  handleArray.sort();
  let nameString = '';
  for (const i of handleArray) {
    nameString = nameString + i + ', ';
  }
  nameString = nameString.slice(0, -2);
  // generate dmId

  let dmId : number = Math.round(Math.random() * 100000000);

  while (dmId.toString() in _data.dms) {
    dmId = Math.round(Math.random() * 100000000);
  }
  // storing dm
  _data.dms[dmId.toString()] = {
    name: nameString,
    dmId: dmId,
    messages: {},
    ownerMembers: ownerMembers,
    allMembers: allMembers
  };

  for (const uId of uIds) {
    const notification : type.notification = {
      notificationMessage: createNotificationString(dmId, 'add', ownerUser.uId, true),
      channelId: -1,
      dmId: dmId
    };

    addNotification(uId, notification);
  }

  _data.workspaceStats.dmsExist.push({ numDmsExist: lastElementOf(_data.workspaceStats.dmsExist).numDmsExist + 1, timeStamp: Math.floor(Date.now() / 1000) });
  setData(_data);
  // updating userstats
  updateUserStats(getUserId(token), 'dj', 1);
  for (const i of uIds) {
    updateUserStats(i, 'dj', 1);
  }
  // updating rate
  updateAll();
  return { dmId: dmId };
}

type Dms = {
  dmId:number;
  name:string;
};

/**
  * Returns the list of DMs that the user is a member of.
  *
  * @param {string} token - an active token
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message if token is invalid
  * @returns {object} - returns an object containing the list of DMs
*/
export function dmListV1(token:string) : { dms: Dms[] } {
  const _data:type.Data = getData();

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const dmArray : Dms[] = [];

  for (const dm of Object.values(_data.dms)) {
    if (dm.allMembers.map(user => user.uId).includes(authUserId)) {
      dmArray.push({ dmId: dm.dmId, name: dm.name });
    }
  }

  return { dms: dmArray };
}

/**
* Original creator of DM remove an existing DM, and all members in the DM.
*
* @param (string) token – identifier of user who is also creator of DM
* @param (integer) dmId – dmId of DM to be removed
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
* 1. dmId does not refer to a valid DM
*2. dmId is valid and the authorised user is not the original DM creator
*3. dmId is valid and the authorised user is no longer in the DM
*4. token is invalid
* @returns {object} – if no HTTPErrors it will return an empty object
*/

export function dmRemoveV1(token:string, dmId:number):type.emptyObject {
  const _data:type.Data = getData();
  // check Invalid dmId
  if (_data.dms[dmId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid dmId!');
  }

  const authUserId = getUserId(token);
  // check token invalid
  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const owners = _data.dms[dmId.toString()].ownerMembers;
  const members = _data.dms[dmId.toString()].allMembers;

  // dmId is valid and the authorised user is no longer in the DM
  if (!members.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(400, 'authuser is not member!');
  }

  // check dmId is valid and the authorised user is not the original DM creator
  if (!owners.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(400, 'authuser is not owner!');
  }
  // updating workspacestats
  _data.workspaceStats.dmsExist.push({ numDmsExist: lastElementOf(_data.workspaceStats.dmsExist).numDmsExist - 1, timeStamp: Math.floor(Date.now() / 1000) });
  if (Object.keys(_data.dms[dmId.toString()].messages).length !== 0) { // update nummessage when there are messages in dm
    _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist - Object.keys(_data.dms[dmId.toString()].messages).length, timeStamp: Math.floor(Date.now() / 1000) });
  }
  // calc member for userstats
  const uIds:number[] = [];
  for (const i of _data.dms[dmId.toString()].allMembers) {
    uIds.push(i.uId);
  }
  // implementation
  delete _data.dms[dmId.toString()];

  setData(_data);
  // updating userstats
  for (const i of uIds) {
    updateUserStats(i, 'dj', -1);
  }
  // updating rate
  updateAll();
  return {};
}

/**
* Given dmID of DM that authorised user is a member of, return name and members of DM.
*
* @param (string) token – identifier of authorised user who is member of DM
* @param (integer) dmId – identifier of DM
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
*1. dmId does not refer to a valid DM
*2. dmId is valid and the authorised user is not a member of the DM
*3. token is invalid
* @returns {object} – if no HTTPErrors it will return an object {name, members}
*/

export function dmDetailsV1(token:string, dmId:number) {
  const _data:type.Data = getData();

  // check Invalid dmId
  if (_data.dms[dmId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid dmId!');
  }

  const authUserId = getUserId(token);

  // check token invalid
  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const members = _data.dms[dmId.toString()].allMembers;

  if (!members.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(400, 'authuser is not member!');
  }

  return { name: _data.dms[dmId.toString()].name, members: members.map(user => condense(user)) };
}

/**
* Given dmID of DM in which user is a member to be removed. Creator of DM can leave without removing DM or updating its name.

* @param (string) token – user identifier of member to be removed
* @param (integer) dmId – identifier of DM that user is a member of
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
*1. dmId does not refer to a valid DM
*2. dmId is valid and the authorised user is not a member of the DM
*3. token is invalid
* @returns {object} – if no HTTPErrors it will return an empty object
*/

export function dmLeaveV1(token:string, dmId:number):type.emptyObject {
  const _data:type.Data = getData();

  // check Invalid dmId
  if (_data.dms[dmId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid dmId!');
  }

  const authUserId = getUserId(token);

  // check token invalid
  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const members = _data.dms[dmId.toString()].allMembers;
  const owners = _data.dms[dmId.toString()].ownerMembers;

  // dmId is valid and the authorised user is no longer in the DM
  if (!members.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(400, 'authuser is not member!');
  }
  // implementation
  for (const [index, user] of owners.entries()) {
    if (user.uId === authUserId) {
      _data.dms[dmId.toString()].ownerMembers.splice(index, 1);
      break;
    }
  }

  for (const [index, user] of members.entries()) {
    if (user.uId === authUserId) {
      _data.dms[dmId.toString()].allMembers.splice(index, 1);
      break;
    }
  }

  setData(_data);
  // updating userstats
  updateUserStats(getUserId(token), 'dj', -1);
  // updating rate
  updateAll();

  return {};
}
