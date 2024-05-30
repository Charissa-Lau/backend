import { getData, setData } from './dataStore';
import { getUserId, getUser, userInChannel, lastElementOf, updateUserStats, updateAll } from './other';
import HTTPError from 'http-errors';
import * as type from './types';
/**
  * Create a new channel with authUserId, name, isPublic provided
  *
  * @param {integer} authUserId - the id of a authorised user
  * @param {string} name - the name of the newly created channelId
  * @param {boolean} isPublic - define if the channel is private or public
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. length of name is less than 1 or more than 20 characters
  * 2. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an object with channelId of the newly created channel
*/
type channelId = {
  channelId: number
};

export function channelsCreateV2(token:string, name:string, isPublic:boolean):channelId {
  const data:type.Data = getData();
  if ((name.length < 1) || (name.length > 20)) {
    throw HTTPError(400, 'Invalid channel name');
  }

  const authUserId : number = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const user = getUser(authUserId);

  const channelId : number = Object.keys(data.channels).length + 1;// generating channlId
  data.channels[channelId.toString()] = { // accessing channel with channelId provided
    channelId: channelId,
    name: name,
    messages: {},
    isPublic: isPublic,
    ownerMembers: [user],
    allMembers: [user]
  };
  // updating workspacstats
  data.workspaceStats.channelsExist.push({ numChannelsExist: lastElementOf(data.workspaceStats.channelsExist).numChannelsExist + 1, timeStamp: Math.floor(Date.now() / 1000) });
  setData(data);
  // updating userstats
  updateUserStats(getUserId(token), 'cj', 1);
  // updating rate
  updateAll();

  return { channelId: data.channels[channelId.toString()].channelId };
}

/**
  * Listing channels that the authorised user is part of
  *
  * @param {integer} authUserId - the id of a authorised user
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an object with all brief details of channels that the authorized user is part of
*/
type channelsBre = {
  channels: type.channelBriefDetails[];
};
export function channelsListV2 (token: string):channelsBre {
  const data:type.Data = getData();

  const authUserId = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const channelslist:type.channelBriefDetails[] = [];
  for (const channel of Object.values(data.channels)) {
    if (userInChannel(authUserId, channel.channelId)) {
      channelslist.push({ channelId: channel.channelId, name: channel.name });
    }
  }

  return { channels: channelslist };
}

/**
  * Listing all channels existed
  *
  * @param {integer} authUserId - the id of a authorised user
  *
  * @returns {object} - {HTTPError: 'HTTPError'}, returns HTTPError message when
  * 1. authUserId is invalid
  * @returns {object} - if no HTTPErrors it will return an object with all brief details of channels that already exist.
*/

export function channelsListAllV2 (token:string):channelsBre {
  const data:type.Data = getData();

  const authUserId : number = getUserId(token);

  if (!authUserId) {
    throw HTTPError(403, 'Invalid token!');
  }

  const channelslist : type.channelBriefDetails[] = [];

  for (const channel of Object.values(data.channels)) {
    channelslist.push({ channelId: channel.channelId, name: channel.name });
  }

  return { channels: channelslist };
}
