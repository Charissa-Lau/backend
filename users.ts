import { getData } from './dataStore';
import { condense, validateToken, validateUser, getUser, getUserId } from './other';
import * as type from './types';
import HTTPError from 'http-errors';

/**
  * For a valid user, returns information about their user ID, email, first name,
  * last name, and handle
  *
  * @param {integer} authUserId - the user ID of the user who is making the function call
  * @param {integer} uId - the ID of a user
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  *     1. uId does not refer to a valid user
  *     2. authUserId is invalid
  * @returns {object} - if there are no HTTPErrors it will return an object containing uId,
  * email, first name, last name, and handle
*/
export function userProfileV3 (token : string, uId : number) {
  const _data = getData();
  // Search to see if the token is valid
  if (!validateToken(token)) {
    throw HTTPError(403, 'token invalid!');
  }

  // Returns an HTTPError if the uId does not exist
  if ((!validateUser(uId)) && (_data.removedUsers[uId.toString()] === undefined)) {
    throw HTTPError(400, 'uId not valid!');
  }
  if (_data.removedUsers[uId.toString()] !== undefined) { // check if the user is already removed
    return { user: condense(_data.removedUsers[uId.toString()]) };
  }
  return { user: condense(getUser(uId)) };// if not removed
}
type userS = {
  users: type.User[];
};

/**
* Returns list of all users and their associated details.
*
* @param (string) token – identifier authorised user sending message
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
*1.token is invalid
* @returns {object} – if no HTTPErrors it will return an object {users}
*/

export function usersAllV1 (token: string) : userS {
  const _data : type.Data = getData();

  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }

  const usersArray:type.User[] = [];
  for (const user of Object.values(_data.users)) {
    usersArray.push(condense(user));
  }

  return { users: usersArray };
}

/**
* Fetch required statistics about workspace’s usage of UNSW Beans.
*
* @returns {object} – if no errors it will return object { workspaceStats }
*/
export function usersStatsV1(token:string) {
  const _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  return { workspaceStats: _data.workspaceStats };
}

/**
* Fetch required statistics about user’s usage of UNSW Beans.
*
* @returns {object} – if no errors it will return object { userStats }
*/

export function userStatsV1(token:string) {
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  return { userStats: getUser(getUserId(token)).userStats };
}
