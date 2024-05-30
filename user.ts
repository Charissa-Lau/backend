import { validate } from 'email-validator';

import { getData, setData } from './dataStore';

import { getUserId, validateToken, getUser, validateUser, updatingUtilization } from './other';

import { SERVER } from './root';

import * as type from './types';

import HTTPError from 'http-errors';
import request from 'sync-request';
import Jimp from 'jimp';

/**
* Update authorised user’s first and last name.
*
* @param (string) token – identifier of authorised user
* @param (string) nameFirst – First name of authorised user
* @param (string) nameLast – Last name of authorised user
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
*1. length of nameFirst is not between 1 and 50 characters inclusive
*2. length of nameLast is not between 1 and 50 characters inclusive
*3. token is invalid
* @returns {object} – if no HTTPErrors it will return an empty object
*/

export function setUserNameV1 (token: string, nameFirst: string, nameLast: string) : type.emptyObject {
  const _data : type.Data = getData();

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (Math.min(nameFirst.length, nameLast.length) < 1 || Math.max(nameFirst.length, nameLast.length) > 50) {
    throw HTTPError(400, 'Name lengths are not within [1,50]');
  }

  Object.values(_data.users).forEach(user => {
    if (user.uId === authUserId) {
      user.nameFirst = nameFirst;
      user.nameLast = nameLast;
    }
  });

  setData(_data);
  return {};
}

/**
* Update authorised user’s email address.
*
* @param (string) token – identifier of authorised user
* @param (string) email – email address of authorised user
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
*1. email entered is not a valid email
*2. email address is already being used by another user
*3. token is invalid
* @returns {object} – if no HTTPErrors it will return an empty object
*/

export function setUserEmailV1 (token: string, email: string) : type.emptyObject {
  const _data : type.Data = getData();
  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (!validate(email)) {
    throw HTTPError(400, 'Invalid email address');
  }

  if (Object.values(_data.users).map(user => user.email).includes(email)) {
    throw HTTPError(400, 'Email address already in use!');
  }

  for (const [e, user] of Object.entries(_data.users)) {
    if (user.uId === authUserId) {
      const _user = user;

      _user.email = email;
      _data.users[email] = _user;
      delete _data.users[e];

      break;
    }
  }

  setData(_data);

  return {};
}

/**
* Update authorised user’s handle.
*
* @param (string) token – identifier of authorised user
* @param (string) handleStr – display name of authorised user
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
    1. length of handleStr is not between 3 and 20 characters inclusive
    2. handleStr contains characters that are not alphanumeric
    3. the handle is already used by another user
    4. token is invalid
* @returns {object} – if no HTTPErrors it will return an empty object
*/
export function setUserHandleV1 (token: string, handleStr: string) : type.emptyObject {
  const users : type.userObject = getData().users;
  const _data : type.Data = getData();
  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (Math.abs(handleStr.length - 23 / 2) > 17 / 2 || handleStr.match(/[^A-Za-z0-9]/g)) {
    throw HTTPError(400, 'Name lengths are not within [1,50]');
  }

  Object.values(users).forEach(user => {
    if (user.handleStr === handleStr) {
      throw HTTPError(400, 'Handle string already taken!');
    }
  });

  Object.values(_data.users).forEach(user => {
    if (user.uId === authUserId) {
      user.handleStr = handleStr;
    }
  });

  setData(_data);

  return {};
}

/**
* Given a user’s uId, remove them from Beans, including all channels/DMs and ‘users’ array, while replacing message contents sent as ‘Remvoed user’. Beans owner can remove other beans owner, and profiles are retrievable through “user/profile” function with first names removed and last names as ‘user’.
*
* @param (integer) uId – identification of user
*
* @throws 400 http error when
    1. uId does not refer to a valid user
    2. uId refers to a user who is the only global owner
* @throws 403 http error when
    1. the authorised user is not a global owner
* @returns {object} – if no errors it will return an empty object
*/

export function adminUserRemoveV1(token:string, uId:number):type.emptyObject {
  const _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');// invalid token
  }
  if (getUser(getUserId(token)).permission !== 1) { // not a global owner
    throw HTTPError(403, 'auth user not global owner!');
  }
  if (validateUser(uId) === false) {
    throw HTTPError(400, 'uId does not refer to a valid user!');
  }
  // counting the number of global owner
  let count = 0;
  for (const i in _data.users) {
    if (_data.users[i].permission === 1) {
      count++;
    }
  }
  if ((count === 1) && (getUser(uId).permission === 1)) {
    throw HTTPError(400, 'uId refers to a user who is the only global owner!');
  }
  // implementation
  const deletedUser = getUser(uId);
  _data.removedUsers[uId.toString()] = {
    uId: uId,
    email: '',
    password: deletedUser.password, // does not really matter
    nameFirst: 'Removed',
    nameLast: 'user',
    handleStr: '',
    permission: 0, // make sure nothing this user can do
    userStats: deletedUser.userStats,
    profileImgUrl: '',
  };// transfer them to removeUsers
  delete _data.users[deletedUser.email];// delete the user
  for (const i in _data.tokens) { // they should be logged out of all current sessions.
    if (_data.tokens[i] === uId) {
      delete _data.tokens[i];
    }
  }
  // deleting user in every channel/dm and modifying messages
  for (const i in _data.channels) {
    let index = _data.channels[i].ownerMembers.indexOf(deletedUser);
    if (index !== -1) {
      _data.channels[i].ownerMembers.splice(index, 1);
    }
    index = _data.channels[i].allMembers.indexOf(deletedUser);
    if (index !== -1) {
      _data.channels[i].allMembers.splice(index, 1);
    }
    for (const j in _data.channels[i].messages) {
      if (_data.channels[i].messages[j].uId === uId) {
        _data.channels[i].messages[j].message = 'Removed user';
      }
    }
  }
  for (const i in _data.dms) {
    let index = _data.dms[i].ownerMembers.indexOf(deletedUser);
    if (index !== -1) {
      _data.dms[i].ownerMembers.splice(index, 1);
    }
    index = _data.dms[i].allMembers.indexOf(deletedUser);
    if (index !== -1) {
      _data.dms[i].allMembers.splice(index, 1);
    }
    for (const j in _data.dms[i].messages) {
      if (_data.dms[i].messages[j].uId === uId) {
        _data.dms[i].messages[j].message = 'Removed user';
      }
    }
  }
  setData(_data);
  // updating rate
  updatingUtilization();
  return {};
}

function getImage (imgUrl: string) {
  const req = request('GET', imgUrl, {});

  if (req.statusCode !== 200) {
    throw HTTPError(400, 'Unable to get image');
  }

  return <Buffer>req.getBody();
}

/**
* Given URL of image on internet, crop image  within bounds.
*
* @param (string) imgUrl – link to access an image on the internet
* @param (integer) xStart – starting horizonal bound
* @param (integer) yStart – starting vertical bound
* @param (integer) xEnd – ending horizontal bound
* @param (integer) yEnd – ending vertical bound
*
* @throws 400 http error when
    1. imgUrl returns an HTTP status other than 200, or any other errors occur when attempting to retrieve the image
    2. any of xStart, yStart, xEnd, yEnd are not within the dimensions of the image at the URL
    3. xEnd is less than or equal to xStart or yEnd is less than or equal to yStart
    4.image uploaded is not a JPG*
* @returns {object} – if no errors it will return an empty object
*/

export function setUserProfilePhotoV1 (token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number) {
  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (xStart > xEnd || yStart > yEnd) {
    throw HTTPError(400, 'Invalid coordinates');
  }

  const width = xEnd - xStart;
  const height = yEnd - yStart;

  const _data : type.Data = getData();
  const email = getUser(authUserId).email;

  Jimp.read(getImage(imgUrl)).then(image => {
    if (xEnd > image.getWidth() || yEnd > image.getHeight()) {
      throw HTTPError(400, 'Invalid coordinates due to exceeding size!');
    }

    image.crop(xStart, yStart, width, height);
    image.write(`src/tmp/${authUserId}.png`);
  }).catch(err => {
    throw HTTPError(400, err);
  });

  _data.users[email].profileImgUrl = `${SERVER}/tmp/${authUserId}.png`;

  setData(_data);

  return {};
}

/**
* Given a user’s uId, set their permissions to new permissions as described.
*
* @param (integer) uId – identification of user
* @param (integer) permissionId – identification of user
*
* @throws 400 http error when
    1. uId does not refer to a valid user
    2. uId refers to a user who is the only global owner and they are being demoted to a user
    3. permissionId is invalid
    4. the user already has the permissions level of permissionId
* @throws 403 http error when
    1. the authorised user is not a global owner
* @returns {object} – if no errors it will return an empty object
*/

export function adminUserpermissionChangeV1(token:string, uId:number, permissionId:number) {
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');// invalid token
  }

  if (getUser(getUserId(token)).permission !== 1) {
    throw HTTPError(403, 'the authorised user is not a global owner!');
  }

  if (!validateUser(uId)) {
    throw HTTPError(400, 'uId does not refer to a valid user!');
  }

  if ((getUser(uId).permission === 1) || (permissionId === 0)) {
    throw HTTPError(400, 'uId refers to a user who is the only global owner and they are being demoted to a user!');
  }

  if ((permissionId !== 1) && (permissionId !== 2)) {
    throw HTTPError(400, 'permissionId is invalid!');
  }

  if (getUser(uId).permission === permissionId) {
    throw HTTPError(400, 'already has the permission!');
  }

  const _data = getData();

  for (const i in _data.users) {
    if (_data.users[i].uId === uId) {
      _data.users[i].permission = permissionId;
    }
  }

  return {};
}
