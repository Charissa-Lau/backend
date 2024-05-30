import { getData, setData } from './dataStore';
import { getUserId, userInChannel, getUser, validateToken, updateUserStats, updateAll, lastElementOf } from './other';
import * as type from './types';
import HTTPError from 'http-errors';

type TimeFinish = {
    timeFinish:number;
};

type ActiveTimeFinish = {
    isActive:boolean;
    timeFinish:number;
};

/**
  * For a given channel, starts a standup period lasting length seconds.
  * During this standup period, if someone calls standup/send with a message, it will be buffered during
  * the length-second window. Then, at the end of the standup, all buffered messages are packaged into one message,
  * and this packaged message is sent to the channel from the user who started the standup. If no standup messages
  * are sent during the standup, no message should be sent at the end.
  *
  * @param {integer} channelId - the ID of the channel
  * @param {integer} length - the length of the standup in seconds
  *
  * @throws 400 error when
  *   1. channelId does not refer to a valid channel
  *   2. length is a negative integer
  *   3. an active standup is currently running in the channel
  * @throws 403 error when
  *   1. channelId is valid and the authorised user is not a member of the channel
  * @returns {object} - if there are no errors, returns object { timeFinish }
*/

export function standupStartV1(token:string, channelId:number, length:number):TimeFinish {
  let _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  if (length < 0) {
    throw HTTPError(400, 'Invalid length!');
  }
  if (_data.standups[channelId.toString()] !== undefined) {
    throw HTTPError(400, 'standup already started!');
  }
  if (!userInChannel(getUserId(token), channelId)) {
    throw HTTPError(403, 'channelId is valid and the authorised user is not a member of the channel!');
  }
  // implementation
  _data.standups[channelId.toString()] = {
    packagedMessage: '',
    timeFinish: Math.floor(Date.now() / 1000) + length
  };
  const _timeFinish = _data.standups[channelId.toString()].timeFinish;

  setData(_data);// update data

  function finishStandup(channelId:number) {
    _data = getData();// get the updated data, i guess

    if (_data.standups[channelId.toString()].packagedMessage.length === 0) { // If no standup messages are sent during the standup, no message should be sent at the end.
      delete _data.standups[channelId.toString()];// when standup finish, delete the standup object
      setData(_data);// updating data
      return;
    }
    let messageId = Math.round(Math.random() * 10000000);

    while (messageId.toString() in _data.channels[channelId.toString()].messages) {
      messageId = Math.round(Math.random() * 10000000);
    }

    const _message : type.Message = {
      messageId: messageId,
      uId: getUserId(token),
      message: _data.standups[channelId.toString()].packagedMessage.slice(0, -1), // check standupSendV1 function, need to detete the last '\n'
      timeSent: _timeFinish,
      reacts: [],
      isPinned: false
    };
    _data.channels[channelId.toString()].messages[messageId.toString()] = _message;// sending message
    // updating workspacestats
    _data.workspaceStats.messagesExist.push({ numMessagesExist: lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist + 1, timeStamp: Math.floor(Date.now() / 1000) });

    delete _data.standups[channelId.toString()];// when standup finish, delete the standup object
    setData(_data);// updating data

    // updating userstats
    updateUserStats(getUserId(token), 'ms', 1);
    // updating rate
    updateAll();
  }
  setTimeout(function() { finishStandup(channelId); }, length * 1000);

  return { timeFinish: _timeFinish };
}

/**
* Given a channel, return a standup’s activity, and if available, its finish time, with a ‘null’ finish time for non-active standups.
*
* @param (integer) channelId – identifier of a channel
*
* @throws 400 http error when
    1. channelId does not refer to a valid channel
* @throws 403 http error when
    1. channelId is valid and the authorised user is not a member of the channel
* @returns {object} – if no errors it will return object {isActive, timeFinish }
*/

export function standupActiveV1(token:string, channelId:number):ActiveTimeFinish {
  const _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  if (!userInChannel(getUserId(token), channelId)) {
    throw HTTPError(403, 'channelId is valid and the authorised user is not a member of the channel!');
  }
  if (_data.standups[channelId.toString()] === undefined) { // If no standup is active, then timeFinish should be null.
    return { isActive: false, timeFinish: null };
  } else {
    return { isActive: true, timeFinish: _data.standups[channelId.toString()].timeFinish };// normal return
  }
}

/**
* Given a channel of active standup, send message to get buffered in standup queue.
*
* @param (integer) channelId – identifier of a channel
* @param (string) message – message sent to get buffered in standup queue
*
* @throws 400 http error when
    1. channelId does not refer to a valid channel
    2. length of message is over 1000 characters
    3. an active standup is not currently running in the channel
* @throws 403 http error when
    1. channelId is valid and the authorised user is not a member of the channel
* @returns {object} – if no errors it will return an empty object
*/

export function standupSendV1(token:string, channelId:number, message:string):type.emptyObject {
  const _data = getData();
  if (!validateToken(token)) {
    throw HTTPError(403, 'Invalid token!');
  }
  if (_data.channels[channelId.toString()] === undefined) {
    throw HTTPError(400, 'Invalid channelId!');
  }
  if (message.length > 1000) {
    throw HTTPError(400, 'Invalid message length!');
  }
  if (_data.standups[channelId.toString()] === undefined) {
    throw HTTPError(400, 'an active standup is not currently running in the channel!');
  }
  if (!userInChannel(getUserId(token), channelId)) {
    throw HTTPError(403, 'channelId is valid and the authorised user is not a member of the channel!');
  }
  const newMessage = getUser(getUserId(token)).handleStr + ': ' + message + '\n';// formating message, the last '\n'need to be deleted later
  _data.standups[channelId.toString()].packagedMessage += newMessage;
  setData(_data);
  return {};
}
