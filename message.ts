import { getData, setData } from './dataStore';
import { getUserHandle, getUserId, userInChannel, userInDm, validateToken, lastElementOf, updateUserStats, updateAll } from './other';
import * as type from './types';
import HTTPError from 'http-errors';
import { addNotification, createNotificationString } from './notification';

/**
  * Send a message from the authorised user to the channel specified by channelId.
  * Each message has its own unique ID, i.e. no messages share an ID with another message,
  * even if that other message is in a different channel.
  *
  * @param {object} token - an active token
  * @param {integer} channelId - channelId of channel that user is sending message in
  * @param {string} message - the message being sent
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. channelId does not refer to a valid channel
  *   2. length of message is less than 1 or over 1000 characters
  *   3. channelId is valid and the authorised user is not a member of the channel
  *   4. token is invalid
  * @returns {object} - returns an object containing the messageID
*/

export function addTag (message: string, id: number, authUserId: number, messageId: number, isDm: boolean) {
  const _data : type.Data = getData();

  const regex = /@([^ ]*)/ig;

  const references = message.match(regex);
  if (references) {
    const handles = Object.values(_data.users).map(user => user.handleStr);

    for (const reference of references) {
      const handleStr = reference.slice(1);

      if (handles.includes(handleStr)) {
        let notification : type.notification;

        if (isDm) {
          notification = {
            notificationMessage: createNotificationString(id, 'tag', authUserId, isDm, messageId),
            channelId: -1,
            dmId: id
          };
        } else {
          notification = {
            notificationMessage: createNotificationString(id, 'tag', authUserId, isDm, messageId),
            channelId: id,
            dmId: -1
          };
        }

        addNotification(getUserHandle(handleStr).uId, notification);
      }
    }
  }
}

export function sendMessageV1 (token: string, channelId: number, message: string) : type.messageId {
  const _data = getData();

  if (!_data.channels[channelId.toString()]) {
    throw HTTPError(400, 'Invalid channelId');
  }

  const channelData = _data.channels[channelId];

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (!userInChannel(authUserId, channelId)) {
    throw HTTPError(403, 'User not a memeber of channel');
  }

  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'Message not within characters limits of 1 <= length <= 10000');
  }

  let messageId = Math.round(Math.random() * 10000000);

  while (messageId.toString() in channelData.messages) {
    messageId = Math.round(Math.random() * 10000000);
  }

  const _message : type.Message = {
    messageId: messageId,
    uId: authUserId,
    message: message,
    timeSent: Math.floor(Date.now() / 1000),
    reacts: [],
    isPinned: false
  };

  _data.channels[channelId.toString()].messages[messageId.toString()] = _message;
  _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });

  setData(_data);

  addTag(message, channelId, authUserId, messageId, false);
  // updating userstats
  updateUserStats(getUserId(token), 'ms', 1);
  // updating rate
  updateAll();

  return { messageId: messageId };
}

/**
* Authorised user sends a message to DM, returning a strictly unique messageId.
*
* @param (string) token – identifier of authorised user sending message
* @param (integer) dmId – dmId of DM receiving messages
* @param (string) message – message sent from authorised user of one DM to another
*
* @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
* 1. dmId does not refer to a valid DM
* 2. length of message is less than 1 or over 1000 characters
* 3. dmId is valid and the authorised user is not a member of the DM
* 4. token is invalid
* @returns {object} – if no HTTPErrors it will return an object {messageId }
*/
export function sendDMV1 (token: string, dmId: number, message: string) : type.messageId {
  const _data = getData();

  if (!_data.dms[dmId.toString()]) {
    throw HTTPError(400, 'Invalid dmId');
  }

  const dmsData = _data.dms[dmId.toString()];

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (!dmsData.allMembers.map(user => user.uId).includes(authUserId)) {
    throw HTTPError(403, 'User not a memeber of dm');
  }

  if (message.length < 1 || message.length > 1000) {
    throw HTTPError(400, 'Message not within characters limits of 1 < length < 10000');
  }

  let messageId = Math.round(Math.random() * 10000000);

  while (messageId.toString() in _data.dms[dmId].messages) {
    messageId = Math.round(Math.random() * 10000000);
  }

  const _message : type.Message = {
    messageId: messageId,
    uId: authUserId,
    message: message,
    timeSent: Math.floor(Date.now() / 1000),
    reacts: [],
    isPinned: false
  };

  _data.dms[dmId.toString()].messages[messageId.toString()] = _message;
  // updating workspacestats
  _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });

  setData(_data);

  addTag(message, dmId, authUserId, messageId, true);
  // updating userstats
  updateUserStats(getUserId(token), 'ms', 1);
  // updating rate
  updateAll();

  return { messageId: messageId };
}

/**
  * Given a message, update its text with new text. If the new message is an empty string,
  * the message is deleted.
  *
  * @param {object} token - an active token
  * @param {integer} messageID - messageId of message being edited
  * @param {string} message - the updated message
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. length of message is over 1000 characters
  *   2. messageId does not refer to a valid message within a channel/DM that
  *      the authorised user has joined
  *   3. the message was not sent by the authorised user making this request and the
  *      user does not have owner permissions in the channel/DM
  *   4. token is invalid
  * @returns {object} - if there are no HTTPErrors, returns an empty object
*/
export function editMessageV1 (token: string, messageId: number, message: string) : type.emptyObject {
  const _data = getData();

  if (message.length > 1000) {
    throw HTTPError(400, 'Message not within characters limits of length < 10000');
  }

  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  for (const [channelId, channel] of Object.entries(_data.channels)) {
    const _message = channel.messages[messageId.toString()];
    if (_message) {
      if (_message.uId !== userId) {
        throw HTTPError(403, 'Invalid user to edit this message');
      } else {
        if (message.length > 0) {
          _data.channels[channelId].messages[messageId.toString()].message = message;
        } else {
          delete _data.channels[channelId].messages[messageId.toString()];
        }

        setData(_data);

        addTag(message, parseInt(channelId), userId, messageId, false);

        return {};
      }
    }
  }

  for (const [dmId, dms] of Object.entries(_data.dms)) {
    const _message = dms.messages[messageId.toString()];
    if (_message) {
      if (_message.uId !== userId) {
        throw HTTPError(403, 'Invalid user to edit this message');
      } else {
        if (message.length > 0) {
          _data.dms[dmId].messages[messageId.toString()].message = message;
        } else {
          delete _data.dms[dmId].messages[messageId.toString()];
        }

        setData(_data);

        addTag(message, parseInt(dmId), userId, messageId, true);

        return {};
      }
    }
  }

  throw HTTPError(400, 'Message does not exist');
}

/**
  * Given a messageId for a message, this message is removed from the channel/DM
  *
  * @param {object} token - an active token
  * @param {integer} messageID - messageId of message being removed
  *
  * @returns {object} - {HTTPError: "HTTPError"}, returns HTTPError message when
  *   1. messageId does not refer to a valid message within a channel/DM that
  *      the authorised user has joined
  *   2. the message was not sent by the authorised user making this request and the
  *      user does not have owner permissions in the channel/DM
  *   3. token is invalid
  * @returns {object} - if no there are no HTTPErrors, returns an empty object
*/
export function removeMessageV1 (token: string, messageId: number) : type.emptyObject {
  const _data = getData();
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  for (const [channelId, channel] of Object.entries(_data.channels)) {
    const _message = channel.messages[messageId.toString()];
    if (_message) {
      if (_message.uId !== userId) {
        throw HTTPError(403, 'Invalid user to edit this message');
      } else {
        delete _data.channels[channelId].messages[messageId.toString()];
        // updating worspacestats
        _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist - 1, timeStamp: Math.floor(Date.now() / 1000) });
        setData(_data);
        // updating rate
        updateAll();
        return {};
      }
    }
  }

  for (const [dmId, dm] of Object.entries(_data.dms)) {
    const _message = dm.messages[messageId.toString()];
    if (_message) {
      if (_message.uId !== userId) {
        throw HTTPError(403, 'Invalid user to edit this message');
      } else {
        delete _data.dms[dmId].messages[messageId.toString()];
        // updating workspacestats
        _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist - 1, timeStamp: Math.floor(Date.now() / 1000) });
        setData(_data);
        // updating rate
        updateAll();
        return {};
      }
    }
  }

  throw HTTPError(400, 'Message does not exist');
}

/**
  * Sends a message from the authorised user to the channel specified by channelId automatically at a
  * specified time in the future. The returned messageId is only considered valid for other actions
  * (editing/deleting/reacting/etc) once it has been sent (i.e. after timeSent).
  *
  * @param {integer} channelId - the ID of the channel
  * @param {string} message - the message being sent later
  * @param {integer} timeSent - the unix timestamp (in seconds) of when the message will be sent
  *
  * @throws 400 error when
  *   1. channelId does not refer to a valid channel
  *   2. length of message is less than 1 or over 1000 characters
  *   3. timeSent is a time in the past
  * @throws 403 error when
  *   1. channelId is valid and the authorised user is not a member of the channel they are trying to post to
  * @returns {object} - if there are no errors, returns object { messageId }
*/

export function messageSendlaterV1(token:string, channelId:number, message:string, timeSent:number):type.messageId {
  let _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  if ((message.length < 1) || (message.length > 1000)) {
    throw HTTPError(400, 'Invalid message length!');
  }
  if (timeSent < Math.floor(Date.now() / 1000)) {
    throw HTTPError(400, 'dont live in the past!');
  }
  if (!userInChannel(getUserId(token), channelId)) {
    throw HTTPError(403, 'channelId is valid and the authorised user is not a member of the channel!');
  }

  let messageId = Math.round(Math.random() * 10000000); // generating messageId in advance

  while (messageId.toString() in _data.channels[channelId.toString()].messages) {
    messageId = Math.round(Math.random() * 10000000);
  }

  function finishMessage() {
    _data = getData();
    const _message : type.Message = {
      messageId: messageId,
      uId: getUserId(token),
      message: message,
      timeSent: Math.floor(Date.now() / 1000),
      reacts: [],
      isPinned: false,
    };
    _data.channels[channelId.toString()].messages[messageId.toString()] = _message; // sending message
    // updating workspacestats
    _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });

    setData(_data);
    addTag(message, channelId, getUserId(token), messageId, false);
    // updating userstats
    updateUserStats(getUserId(token), 'ms', 1);
    // updating rate
    updateAll();
  }
  setTimeout(finishMessage, ((timeSent - Math.floor(Date.now() / 1000)) * 1000));

  return { messageId: messageId };
}

/**
  * Sends a message from the authorised user to the DM specified by dmId automatically at a
  * specified time in the future. The returned messageId is only considered valid for other actions
  * (editing/deleting/reacting/etc) once it has been sent (i.e. after timeSent).
  * If the DM is removed before the message has sent, the message will not be sent.
  *
  * @param {integer} dmId - the ID of the DM
  * @param {string} message - the message being sent later
  * @param {integer} timeSent - the unix timestamp (in seconds) of when the message will be sent
  *
  * @throws 400 error when
  *   1. dmId does not refer to a valid DM
  *   2. length of message is less than 1 or over 1000 characters
  *   3. timeSent is a time in the past
  * @throws 403 error when
  *   1. dmId is valid and the authorised user is not a member of the DM they are trying to post to
  * @returns {object} - if there are no errors, returns object { messageId }
*/

export function messageSendlaterdmV1(token:string, dmId:number, message:string, timeSent:number):type.messageId {
  let _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (_data.dms[dmId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid dmId!');
  }
  if ((message.length < 1) || (message.length > 1000)) {
    throw HTTPError(400, 'Invalid message length!');
  }
  if (timeSent < Math.floor(Date.now() / 1000)) {
    throw HTTPError(400, 'dont live in the past!');
  }
  if (!userInDm(getUserId(token), dmId)) {
    throw HTTPError(403, 'dmId is valid and the authorised user is not a member of the dm!');
  }
  let messageId = Math.round(Math.random() * 10000000); // generating messageId in advance

  while (messageId.toString() in _data.dms[dmId.toString()].messages) {
    messageId = Math.round(Math.random() * 10000000);
  }

  function finishMessage() {
    _data = getData();
    if (_data.dms[dmId.toString()] === undefined) {
      return;
    }
    const _message : type.Message = {
      messageId: messageId,
      uId: getUserId(token),
      message: message,
      timeSent: Math.floor(Date.now() / 1000),
      reacts: [],
      isPinned: false
    };
    _data.dms[dmId.toString()].messages[messageId.toString()] = _message; // sending message
    // updating workspacestats
    _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });

    setData(_data);
    addTag(message, dmId, getUserId(token), messageId, true);
    // updating userstats
    updateUserStats(getUserId(token), 'ms', 1);
    // updating rate
    updateAll();
  }
  setTimeout(finishMessage, ((timeSent - Math.floor(Date.now() / 1000)) * 1000));

  return { messageId: messageId };
}

function channelMessageReact (userId: number, channelId: number, messageId: number, reactId: number) {
  const _data : type.Data = getData();

  const reacts = _data.channels[channelId.toString()].messages[messageId.toString()].reacts;
  const react = reacts.map(r => r.reactId).indexOf(reactId);

  if (react > 0 && reacts[react].uIds.includes(userId)) {
    throw HTTPError(400, 'User already reacted to this message!');
  }

  if (react < 0) {
    const react : type.React = {
      reactId: reactId,
      uIds: [userId],
      isThisUserReacted: false
    };

    _data.channels[channelId.toString()].messages[messageId.toString()].reacts.push(react);
  } else {
    _data.channels[channelId.toString()].messages[messageId.toString()].reacts[react].uIds.push(userId);
  }

  setData(_data);

  const message = _data.channels[channelId.toString()].messages[messageId.toString()];

  const notification : type.notification = {
    channelId: channelId,
    dmId: -1,
    notificationMessage: createNotificationString(channelId, 'react', userId, false),
  };

  if (userInChannel(message.uId, channelId)) {
    addNotification(message.uId, notification);
  }

  return {};
}

function dmMessageReact (userId: number, dmId: number, messageId: number, reactId: number) {
  const _data : type.Data = getData();

  const reacts = _data.dms[dmId.toString()].messages[messageId.toString()].reacts;
  const react = reacts.map(r => r.reactId).indexOf(reactId);

  if (react > 0 && reacts[react].uIds.includes(userId)) {
    throw HTTPError(400, 'User already reacted to this message!');
  }

  if (react < 0) {
    const react : type.React = {
      reactId: reactId,
      uIds: [userId],
      isThisUserReacted: false
    };

    _data.dms[dmId.toString()].messages[messageId.toString()].reacts.push(react);
  } else {
    _data.dms[dmId.toString()].messages[messageId.toString()].reacts[react].uIds.push(userId);
  }

  setData(_data);

  const message = _data.dms[dmId.toString()].messages[messageId.toString()];

  const notification : type.notification = {
    channelId: -1,
    dmId: dmId,
    notificationMessage: createNotificationString(dmId, 'react', userId, true),
  };

  if (_data.dms[dmId.toString()].allMembers.map(user => user.uId).includes(message.uId)) {
    addNotification(message.uId, notification);
  }

  return {};
}

/**
  * Given a message within a channel or DM the authorised user is part of, adds a "react" to that particular message.
  *
  * @param {integer} messageId - the ID of the message being reacted to
  * @param {integer} reactId - the ID of the react
  *
  * @throws 400 error when
  *   1. messageId is not a valid message within a channel or DM that the authorised user is part of
  *   2. reactId is not a valid react ID - currently, the only valid react ID the frontend has is 1
  *   3. the message already contains a react with ID reactId from the authorised user
  * @returns {object} - if there are no errors, returns an empty object
*/
export function messageReactV1 (token: string, messageId: number, reactId: number) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'Invalid reactId');
  }

  for (const [channelId, channel] of Object.entries(getData().channels)) {
    for (const message of Object.values(channel.messages)) {
      if (message.messageId === messageId) {
        return channelMessageReact(userId, parseInt(channelId), messageId, reactId);
      }
    }
  }

  for (const [dmId, dm] of Object.entries(getData().dms)) {
    for (const message of Object.values(dm.messages)) {
      if (message.messageId === messageId) {
        return dmMessageReact(userId, parseInt(dmId), messageId, reactId);
      }
    }
  }

  throw HTTPError(400, 'Invalid messagId!');
}

function channelMessageUnreact (userId: number, channelId: string, messageId: number, reactId: number) {
  const _data : type.Data = getData();

  const reacts = _data.channels[channelId].messages[messageId.toString()].reacts;
  const react = reacts.map(r => r.reactId).indexOf(reactId);

  if (react < 0 || !reacts[react].uIds.includes(userId)) {
    throw HTTPError(400, 'User never reacted to this message with this reactId!');
  }

  const uIndex = reacts[react].uIds.indexOf(userId);

  if (reacts[react].uIds.length === 1) {
    _data.channels[channelId].messages[messageId.toString()].reacts.splice(react, 1);
  } else {
    _data.channels[channelId].messages[messageId.toString()].reacts[react].uIds.splice(uIndex, 1);
  }

  setData(_data);

  return {};
}

function dmMessageUnreact (userId: number, dmId: string, messageId: number, reactId: number) {
  const _data : type.Data = getData();

  const reacts = _data.dms[dmId].messages[messageId.toString()].reacts;
  const react = reacts.map(r => r.reactId).indexOf(reactId);

  if (react < 0 || !reacts[react].uIds.includes(userId)) {
    throw HTTPError(400, 'User never reacted to this message with this reactId!');
  }

  const uIndex = reacts[react].uIds.indexOf(userId);

  if (reacts[react].uIds.length === 1) {
    _data.dms[dmId].messages[messageId.toString()].reacts.splice(react, 1);
  } else {
    _data.dms[dmId].messages[messageId.toString()].reacts[react].uIds.splice(uIndex, 1);
  }

  setData(_data);

  return {};
}

/**
  * Given a message within a channel or DM the authorised user is part of, removes a "react" to that particular message.
  *
  * @param {integer} messageId - the ID of the message being unreacted to
  * @param {integer} reactId - the ID of the react
  *
  * @throws 400 error when
  *   1. messageId is not a valid message within a channel or DM that the authorised user is part of
  *   2. reactId is not a valid react ID - currently, the only valid react ID the frontend has is 1
  *   3. the message does not contain a react with ID reactId from the authorised user
  * @returns {object} - if there are no errors, returns an empty object
*/

export function messageUnreactV1 (token: string, messageId: number, reactId: number) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  if (reactId !== 1) {
    throw HTTPError(400, 'Invalid reactId');
  }

  for (const [channelId, channel] of Object.entries(getData().channels)) {
    for (const message of Object.values(channel.messages)) {
      if (message.messageId === messageId) {
        return channelMessageUnreact(userId, channelId, messageId, reactId);
      }
    }
  }

  for (const [dmId, dm] of Object.entries(getData().dms)) {
    for (const message of Object.values(dm.messages)) {
      if (message.messageId === messageId) {
        return dmMessageUnreact(userId, dmId, messageId, reactId);
      }
    }
  }

  throw HTTPError(400, 'Invalid messageId!');
}

function channelMessagePin (channelId: string, messageId: number) {
  const _data : type.Data = getData();

  _data.channels[channelId].messages[messageId.toString()].isPinned = true;

  setData(_data);

  return {};
}

function dmMessagePin (dmId: string, messageId: number) {
  const _data : type.Data = getData();

  _data.dms[dmId].messages[messageId.toString()].isPinned = true;

  setData(_data);

  return {};
}

/**
  * Given a message within a channel or DM, marks it as "pinned".
  *
  * @param {integer} messageId - the ID of the message being pinned
  *
  * @throws 400 error when
  *   1. messageId is not a valid message within a channel or DM that the authorised user is part of
  *   2. the message is already pinned
  * @throws 403 error when
  *   1. messageId refers to a valid message in a joined channel/DM and the authorised user does not have
  *     owner permissions in the channel/DM
  * @returns {object} - if there are no errors, returns an empty object
*/
export function messagePinV1 (token: string, messageId: number) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const _data : type.Data = getData();

  for (const [channelId, channel] of Object.entries(_data.channels)) {
    for (const message of Object.values(channel.messages)) {
      if (message.messageId === messageId) {
        if (message.isPinned) {
          throw HTTPError(400, 'Message is already pinned!');
        }

        if (!userInChannel(userId, parseInt(channelId))) {
          throw HTTPError(400, 'User not in channel');
        }

        const members = channel.ownerMembers;

        if (members.filter(m => (m.uId === userId)).length === 0) {
          throw HTTPError(403, 'User not authorized!');
        }

        return channelMessagePin(channelId, messageId);
      }
    }
  }

  for (const [dmId, dm] of Object.entries(_data.dms)) {
    for (const message of Object.values(dm.messages)) {
      if (message.messageId === messageId) {
        if (message.isPinned) {
          throw HTTPError(400, 'Message is already pinned!');
        }

        if (!dm.allMembers.map(user => user.uId).includes(userId)) {
          throw HTTPError(400, 'User not in dm');
        }

        const members = dm.ownerMembers;

        if (members.filter(m => (m.uId === userId)).length === 0) {
          throw HTTPError(403, 'User not authorized!');
        }

        return dmMessagePin(dmId, messageId);
      }
    }
  }

  throw HTTPError(400, 'Invalid messageId!');
}

function channelMessageUnpin (channelId: string, messageId: number) {
  const _data : type.Data = getData();

  _data.channels[channelId].messages[messageId.toString()].isPinned = false;

  setData(_data);

  return {};
}

function dmMessageUnpin (dmId: string, messageId: number) {
  const _data : type.Data = getData();

  _data.dms[dmId].messages[messageId.toString()].isPinned = false;

  setData(_data);

  return {};
}

/**
  * Given a message within a channel or DM, removes its mark as "pinned".
  *
  * @param {integer} messageId - the ID of the message being unpinned
  *
  * @throws 400 error when
  *   1. messageId is not a valid message within a channel or DM that the authorised user is part of
  *   2. the message is not already pinned
  * @throws 403 error when
  *   1. messageId refers to a valid message in a joined channel/DM and the authorised user does not have
  *      owner permissions in the channel/DM
  * @returns {object} - if there are no errors, returns an empty object
*/

export function messageUnpinV1 (token: string, messageId: number) {
  const userId = getUserId(token);

  if (!userId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const _data : type.Data = getData();

  for (const [channelId, channel] of Object.entries(_data.channels)) {
    for (const message of Object.values(channel.messages)) {
      if (message.messageId === messageId) {
        if (!message.isPinned) {
          throw HTTPError(400, 'Message is not pinned!');
        }

        if (!userInChannel(userId, parseInt(channelId))) {
          throw HTTPError(400, 'User not in channel!');
        }

        const members = _data.channels[channelId].ownerMembers;

        if (members.filter(m => (m.uId === userId)).length === 0) {
          throw HTTPError(403, 'User not authorized!');
        }

        return channelMessageUnpin(channelId, messageId);
      }
    }
  }

  for (const [dmId, dm] of Object.entries(_data.dms)) {
    for (const message of Object.values(dm.messages)) {
      if (message.messageId === messageId) {
        if (!message.isPinned) {
          throw HTTPError(400, 'Message is already pinned!');
        }

        if (!dm.allMembers.map(user => user.uId).includes(userId)) {
          throw HTTPError(400, 'User not in dm');
        }

        const members = _data.dms[dmId].ownerMembers;

        if (members.filter(m => (m.uId === userId)).length === 0) {
          throw HTTPError(403, 'User not authorized!');
        }

        return dmMessageUnpin(dmId, messageId);
      }
    }
  }

  throw HTTPError(400, 'Invalid messageId!');
}

/**
  * A new message containing the contents of both the original message and the optional message is sent to the channel/DM
  * identified by the channelId/dmId. Both the original and optional message exist as a substring within the new message.
  * Once sent, the new message has no link to the original message, so if the original message is edited/deleted,
  * no change will occur for the new message.
  *
  * @param {integer} ogMessageId - the ID of the original message
  * @param {string} message - optional message in addition to the shared message
  * @param {integer} channelId - the channel that the message is being shared to, this will be -1 if the message is being sent to a DM
  * @param {integer} dmId - the DM that the message is being shared to, this will be -1 if the message is being sent to a channel
  *
  * @throws 400 error when
  *   1. length of queryStr is less than 1 or over 1000 characters
  *   2. neither channelId nor dmId are -1
  *   3. ogMessageId does not refer to a valid message within a channel/DM that the authorised user has joined
  *   4. length of optional message is more than 1000 characters
  * @throds 403 error when
  *   1. the pair of channelId and dmId are valid (i.e. one is -1, the other is valid) and the authorised user has not
  *      joined the channel or DM they are trying to share the message to
  * @returns {object} - if there are no errors, returns object { sharedMessageId }
*/

export function messageShareV1(token:string, ogMessageId:number, message:string, channelId:number, dmId:number) {
  const _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if ((_data.channels[channelId.toString()] === undefined) && (_data.dms[dmId.toString()] === undefined)) {
    throw HTTPError(400, 'both channelId and dmId are invalid!');
  }
  if ((channelId !== -1) && (dmId !== -1)) {
    throw HTTPError(400, 'neither channelId nor dmId are -1!');
  }

  if (message.length > 1000) {
    throw HTTPError(400, 'length of optional message is more than 1000 characters!');
  }
  let originalMessage:string;
  for (const i in _data.channels) {
    for (const j in _data.channels[i].messages) {
      if (_data.channels[i].messages[j].messageId === ogMessageId) {
        originalMessage = _data.channels[i].messages[j].message;
        if (!userInChannel(getUserId(token), _data.channels[i].channelId)) {
          throw HTTPError(400, 'ogMessageId does not refer to a valid message within a channel that the authorised user has joined!');
        }
      }
    }
  }
  for (const i in _data.dms) {
    for (const j in _data.dms[i].messages) {
      if (_data.dms[i].messages[j].messageId === ogMessageId) {
        originalMessage = _data.dms[i].messages[j].message;
        if (!userInDm(getUserId(token), _data.dms[i].dmId)) {
          throw HTTPError(400, 'ogMessageId does not refer to a valid message within a DM that the authorised user has joined!');
        }
      }
    }
  }

  if (originalMessage === undefined) {
    throw HTTPError(400, 'ogMessageId does not refer to a valid message within a channel/DM that the authorised user has joined!');
  }
  if (channelId === -1) {
    if (_data.dms[dmId.toString()] === undefined) {
      throw HTTPError(400, 'dmId not valid ,channelId = -1!');
    }
    if (!userInDm(getUserId(token), dmId)) {
      throw HTTPError(403, 'the authorised user has not joined the DM they are trying to share the message to!');
    }
  } else if (dmId === -1) {
    if (_data.channels[channelId.toString()] === undefined) {
      throw HTTPError(400, 'channelId not valid ,dmId = -1!');
    }
    if (!userInChannel(getUserId(token), channelId)) {
      throw HTTPError(403, 'the authorised user has not joined the channel they are trying to share the message to!');
    }
  }
  // generating new message
  const newMessage = originalMessage + '\n' + 'Reply:' + message;
  // generating messageId
  const messageId = Math.round(Math.random() * 10000000);

  // sending message
  const _message : type.Message = {
    messageId: messageId,
    uId: getUserId(token),
    message: newMessage,
    timeSent: Math.floor(Date.now() / 1000),
    reacts: [],
    isPinned: false
  };
  if (channelId !== -1) {
    _data.channels[channelId.toString()].messages[messageId.toString()] = _message;
    addTag(message, channelId, getUserId(token), messageId, false);// only the optimal message will trigger tagging
  } else {
    _data.dms[dmId.toString()].messages[messageId.toString()] = _message;
    addTag(message, dmId, getUserId(token), messageId, true);// only the optimal message will trigger tagging
  }
  // updating workspacestats
  _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });
  setData(_data);

  // updating userstats
  updateUserStats(getUserId(token), 'ms', 1);
  // updating rate
  updateAll();
  return { sharedMessageId: messageId };
}
