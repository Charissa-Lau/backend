import { getData, setData } from './dataStore';
import { validate } from 'email-validator';
import * as type from './types';
import { generateToken, validateToken, validateUser, updateAll } from './other';
import { Md5 } from 'ts-md5';
import HTTPError from 'http-errors';
import { defaultImg } from './profile.json';

/**
  * Returns uId if email and password combination produces successful login
  *
  * @param {String} email - email of user
  * @param {String} password - password of user
  *
  * @returns {Object} - returns HTTPError object ({ HTTPError: "HTTPError" }) if email & password match
  * @returns {Object} - return object containing uId of user with email and password combination
*/

function authLoginV2(email: string, password: string) {
  const _data: type.Data = getData();
  const users: type.userObject = _data.users;

  for (const user of <type.rawUser[]>Object.values(users)) {
    if (user.email === email && user.password === Md5.hashStr(password + '233')) { // hash password
      const _token = generateToken(user.uId);
      _data.tokens[_token] = user.uId;
      setData(_data);

      return { token: Md5.hashStr(_token + '233'), authUserId: user.uId }; // return encrypted form of token but store the true token
    }
  }

  throw HTTPError(400, 'Login unsuccessful');
}

/**
  * Registers a new user to the and adds details to the dataStore
  *
  * @param {String} email - email of the new user
  * @param {String} password - password of the new user
  * @param {String} nameFirst - first name of the new user
  * @param {String} nameLast - last name of the new user
  *
  * @returns {Object} - returns HTTPError object if email is repeated or invalid, password is less 6 characters long, first name is outside of [1,50], or last name is outside of [1,50]
  * @returns {Object} - return new user's uId
  *
*/

function authRegisterV2(email: string, password: string, nameFirst: string, nameLast: string) {
  const _data: type.Data = getData();
  const users: type.userObject = _data.users;

  if (validate(email) === false || email in users ||
    password.length < 6 || Math.min(nameFirst.length, nameLast.length) < 1 ||
    Math.max(nameFirst.length, nameLast.length) > 50) {
    throw HTTPError(400, 'Invalid user registration');
  } else {
    let uId : number = Math.round(Math.random() * 100000000); // generating uId

    while (validateUser(uId)) {
      uId = Math.round(Math.random() * 100000000);
    }
    const regex = /[^a-z0-9]/ig;
    let generateHandleStr: string = nameFirst.concat(nameLast).toLowerCase().replace(regex, '');

    if (generateHandleStr.length > 20) {
      generateHandleStr = generateHandleStr.slice(0, 20);
    }

    let validated = false;
    let add = 0;
    let newString: string = generateHandleStr;

    while (validated === false) {
      validated = true;

      for (const user of <type.User[]>Object.values(users)) {
        if (user.handleStr === newString) {
          validated = false;
          newString = `${generateHandleStr}${add}`;
          add++;
          break;
        }
      }
    }
    let permission = 2;// global members by default
    if ((Object.entries(users).length === 0) && (Object.entries(_data.removedUsers).length === 0)) { // the very first user who signs up is a global owner
      _data.workspaceStats.channelsExist.push({ numChannelsExist: 0, timeStamp: Math.floor(Date.now() / 1000) });// initializing workspacestats
      _data.workspaceStats.dmsExist.push({ numDmsExist: 0, timeStamp: Math.floor(Date.now() / 1000) });
      _data.workspaceStats.messagesExist.push({ numMessagesExist: 0, timeStamp: Math.floor(Date.now() / 1000) });
      _data.workspaceStats.utilizationRate = 0;
      permission = 1;
    }

    const newUser = {
      uId: uId,
      email: email,
      password: Md5.hashStr(password + '233'),
      nameFirst: nameFirst,
      nameLast: nameLast,
      handleStr: newString,
      permission: permission,
      userStats: {
        channelsJoined: [{ numChannelsJoined: 0, timeStamp: Math.floor(Date.now() / 1000) }],
        dmsJoined: [{ numDmsJoined: 0, timeStamp: Math.floor(Date.now() / 1000) }],
        messagesSent: [{ numMessagesSent: 0, timeStamp: Math.floor(Date.now() / 1000) }],
        involvementRate: 0,
      },
      profileImgUrl: defaultImg,
    };

    const token = generateToken(newUser.uId);

    _data.tokens[token] = newUser.uId;
    _data.users[email] = newUser;

    setData(_data);
    // updating rate
    updateAll();
    return { token: Md5.hashStr(token + '233'), authUserId: uId }; // return encrypted form of token but store the true token
  }
}

/**
  * Given an active token, invalidates the token to log the user out.
  *
  * @param {string} token - an active token
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message if token is invalid
  * @returns {object} - if there are no HTTPErrors, returns an empty object
*/
export function authLogoutV1(token: string) {
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  const _data: type.Data = getData();

  let _token = null;
  for (const t of Object.keys(getData().tokens)) {
    if (token === Md5.hashStr(t + '233')) {
      _token = t;
      break;
    }
  }

  delete _data.tokens[_token];
  setData(_data);
  return {};
}

/**
* Given an email address, if it belongs to registered user, send a password recovery email containing reset code, logging the user out of all sessions. Code will indicate it is the same user resetting password through the “auth/passwordreset/reset” function. No error shown for invalid emails.
*
* @param (string) email – email address of registered account
*
* @returns {object} – if no errors it will return an empty object
*/

export function authPasswordresetRequestV1(email: string): type.emptyObject {
  const _data = getData();
  const nodemailer = require('nodemailer');

  if (email.toString() in _data.users) { // if email valid and in dataStore
    for (const i in _data.tokens) { // When a user requests a password reset, they should be logged out of all current sessions.
      if (_data.tokens[i] === _data.users[email].uId) {
        delete _data.tokens[i];
      }
    }

    let resetCode: number = Math.round(Math.random() * 10000000); // generating resetcode but a number

    while (resetCode.toString() in _data.resetCodes) {
      resetCode = Math.round(Math.random() * 10000000);
    }
    _data.resetCodes[resetCode.toString()] = { // setting up the reset code
      email: email
    };
    setData(_data);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jas0nlia0233@gmail.com', // my email
        pass: 'tnfgmcxrhjzaqdsy'
      }
    });
    const newText = 'Your password reset code is ' + resetCode.toString() + '\nDo not share this code with others';
    const mailOptions = {
      from: 'jas0nlia0233@gmail.com',
      to: email,
      subject: 'Beans password reset',
      text: newText
    };
    transporter.sendMail(mailOptions);
  }
  return {};
}

/**
* Given a reset code, set new password and invalidate used code.
*
* @param (string) resetCode – one-time-use code to reset password
* @param (string) newPassword – new replacement password
*
* @throws 400 http error when
    1. resetCode is not a valid reset code
    2. newPassword is less than 6 characters long
* @returns {object} – if no errors it will return an empty object
*/

export function authPasswordresetResetV1(resetCode: string, newPassword: string) {
  const _data = getData();
  if (_data.resetCodes[resetCode] === undefined) {
    throw HTTPError(400, 'Invalid resetCode!');
  }
  if (newPassword.length < 6) {
    throw HTTPError(400, 'Invalid password!');
  }
  const userEmail: string = _data.resetCodes[resetCode].email;
  _data.users[userEmail].password = Md5.hashStr(newPassword + '233');
  delete _data.resetCodes[resetCode];
  setData(_data);
  return {};
}
export { authLoginV2, authRegisterV2 };
