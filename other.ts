import { getData, setData } from './dataStore';
import { Md5 } from 'ts-md5';
import request from 'sync-request';
import * as type from './types';

export function clearV1() : type.emptyObject {
  const data : type.Data = getData();
  data.users = {};
  data.channels = {};
  data.tokens = {};
  data.dms = {};
  data.standups = {};
  data.resetCodes = {};
  data.notifications = {};
  data.removedUsers = {};
  while (data.workspaceStats.channelsExist.length !== 0) {
    data.workspaceStats.channelsExist.pop();
  }
  while (data.workspaceStats.dmsExist.length !== 0) {
    data.workspaceStats.dmsExist.pop();
  }
  while (data.workspaceStats.messagesExist.length !== 0) {
    data.workspaceStats.messagesExist.pop();
  }
  data.workspaceStats.utilizationRate = 0;
  setData(data);
  return {};
}

export function condense (user: type.rawUser) : type.User {
  return { uId: user.uId, email: user.email, nameFirst: user.nameFirst, nameLast: user.nameLast, handleStr: user.handleStr, profileImgUrl: user.profileImgUrl };
}

export function generateToken (uId: number) : string {
  return Md5.hashStr(`${uId + Date.now()}`);
}

// this function is ALMOST useless
export function validateToken (token: string) {
  const _tokens = Object.keys(getData().tokens);
  for (const _token of _tokens) {
    if (token === Md5.hashStr(_token + '233')) {
      return true;
    }
  }
  return false;
}

export function getUserId (token: string) {
  const _tokens = Object.keys(getData().tokens);
  for (const _token of _tokens) {
    if (token === Md5.hashStr(_token + '233')) {
      return getData().tokens[_token];
    }
  }
  return null;
}

export function lastElementOf(array:any[]) {
  return array.slice(-1)[0];
}

export function updateUserStats(uId:number, type:string, value:number) {
  const _data = getData();
  for (const i in _data.users) {
    if (_data.users[i].uId === uId) {
      switch (type) {
        case 'cj':
          _data.users[i].userStats.channelsJoined.push({ numChannelsJoined: lastElementOf(_data.users[i].userStats.channelsJoined).numChannelsJoined + value, timeStamp: Math.floor(Date.now() / 1000) });
          break;
        case 'dj':
          _data.users[i].userStats.dmsJoined.push({ numDmsJoined: lastElementOf(_data.users[i].userStats.dmsJoined).numDmsJoined + value, timeStamp: Math.floor(Date.now() / 1000) });
          break;
        case 'ms':
          _data.users[i].userStats.messagesSent.push({ numMessagesSent: lastElementOf(_data.users[i].userStats.messagesSent).numMessagesSent + value, timeStamp: Math.floor(Date.now() / 1000) });
          break;
      }
    }
  }
  setData(_data);
}
export function validateUser(uId: number) {
  const users = Object.values(getData().users);

  for (const user of users) {
    if (user.uId === uId) {
      return true;
    }
  }

  return false;
}

export function updatingInvolvement() {
  const _data = getData();

  for (const i in _data.users) {
    const denominator = lastElementOf(_data.workspaceStats.channelsExist).numChannelsExist + lastElementOf(_data.workspaceStats.dmsExist).numDmsExist + lastElementOf(_data.workspaceStats.messagesExist).numMessagesExist;
    const user = _data.users[i];
    const numerator = lastElementOf(user.userStats.channelsJoined).numChannelsJoined + lastElementOf(user.userStats.dmsJoined).numDmsJoined + lastElementOf(user.userStats.messagesSent).numMessagesSent;
    const inv = numerator / denominator;
    if (denominator === 0) {
      _data.users[i].userStats.involvementRate = 0;
    } else if (inv > 1) {
      _data.users[i].userStats.involvementRate = 1;
    } else {
      _data.users[i].userStats.involvementRate = inv;
    }
  }
  setData(_data);
}

export function updateAll() {
  updatingInvolvement();
  updatingUtilization();
}

export function updatingUtilization() {
  const _data = getData();
  let count = 0;
  for (const i in _data.users) {
    if ((lastElementOf(_data.users[i].userStats.channelsJoined).numChannelsJoined >= 1) || (lastElementOf(_data.users[i].userStats.dmsJoined).numDmsJoined >= 1)) {
      count++;
    }
  }
  const numUsers = Object.keys(_data.users).length;
  if (numUsers === 0) {
    _data.workspaceStats.utilizationRate = 0;
  }

  _data.workspaceStats.utilizationRate = count / numUsers;
  setData(_data);
}
export function getUser (uId: number) {
  const users = Object.values(getData().users);

  for (const user of users) {
    if (user.uId === uId) {
      return user;
    }
  }

  return null;
}

export function validateChannel (channelId: number) {
  const channels = getData().channels;
  return channels[channelId.toString()] ? channels[channelId.toString()] : null;
}

export function isPublic (channelId: number) {
  if (!validateChannel(channelId)) {
    return false;
  }

  const channels = getData().channels;
  return channels[channelId.toString()].isPublic;
}

export function userInChannel (uId: number, channelId: number) {
  if (!validateChannel(channelId)) {
    return false;
  }

  const channelMembers = getData().channels[channelId.toString()].allMembers;

  for (const user of channelMembers) {
    if (user.uId === uId) {
      return true;
    }
  }

  return false;
}

export function userInDm (uId: number, dmId:number) {
  const _data = getData();
  if (_data.dms[dmId.toString()] === undefined) {
    return false;
  }
  const dmMembers = getData().dms[dmId.toString()].allMembers;

  for (const user of dmMembers) {
    if (user.uId === uId) {
      return true;
    }
  }

  return false;
}

export function getUserHandle (handleStr: string) {
  const _data : type.Data = getData();

  for (const user of Object.values(_data.users)) {
    if (user.handleStr === handleStr) {
      return user;
    }
  }
}

export function createRequest (method: type.Method, path: string, header?: Record<string, unknown>, payload?: Record<string, unknown>) {
  let _payload : Record<string, unknown>;
  if (method === 'GET' || method === 'DELETE') {
    _payload = { headers: header, qs: payload };
  } else {
    _payload = { headers: header, json: payload };
  }
  const res = request(method, path, _payload);
  if (res.statusCode !== 200) {
    return { statusCode: res.statusCode };
  } else {
    return JSON.parse(res.getBody('utf-8'));
  }
}
