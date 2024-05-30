import { createRequest } from '../other';
import { SERVER } from '../root';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

test('successful printing workspace stats', () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
  const _uIds:number[] = [];
  _uIds.push(user2.authUserId);
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
  const message = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  expect(message).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm.dmId, message: 'messages are really cool' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'good bye!' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('DELETE', SERVER + '/message/remove/v2', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});
  expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({});

  expect(createRequest('GET', SERVER + '/users/stats/v1', { token: user1.token + user2.token + '1' }).statusCode).toStrictEqual(403);

  expect(createRequest('GET', SERVER + '/users/stats/v1', { token: user1.token }).workspaceStats).toStrictEqual({
    channelsExist: [{ numChannelsExist: 0, timeStamp: expect.any(Number) }, { numChannelsExist: 1, timeStamp: expect.any(Number) }],
    dmsExist: [{ numDmsExist: 0, timeStamp: expect.any(Number) }, { numDmsExist: 1, timeStamp: expect.any(Number) }, { numDmsExist: 0, timeStamp: expect.any(Number) }],
    messagesExist: [{ numMessagesExist: 0, timeStamp: expect.any(Number) }, { numMessagesExist: 1, timeStamp: expect.any(Number) }, { numMessagesExist: 2, timeStamp: expect.any(Number) }, { numMessagesExist: 3, timeStamp: expect.any(Number) }, { numMessagesExist: 4, timeStamp: expect.any(Number) }, { numMessagesExist: 3, timeStamp: expect.any(Number) }, { numMessagesExist: 1, timeStamp: expect.any(Number) }],
    utilizationRate: 0.5,
  });
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

test('successful printing user stats', () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
  const _uIds:number[] = [];
  _uIds.push(user2.authUserId);
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
  const message = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  expect(message).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm.dmId, message: 'messages are really cool' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'good bye!' })).toStrictEqual({ messageId: expect.any(Number) });
  expect(createRequest('DELETE', SERVER + '/message/remove/v2', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});
  expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({});

  expect(createRequest('GET', SERVER + '/user/stats/v1', { token: user1.token }).userStats).toStrictEqual({ // fetches user1
    channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }, { numChannelsJoined: 1, timeStamp: expect.any(Number) }],
    dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }, { numDmsJoined: 1, timeStamp: expect.any(Number) }, { numDmsJoined: 0, timeStamp: expect.any(Number) }],
    messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }, { numMessagesSent: 1, timeStamp: expect.any(Number) }, { numMessagesSent: 2, timeStamp: expect.any(Number) }, { numMessagesSent: 3, timeStamp: expect.any(Number) }],
    involvementRate: 1,
  });
  expect(createRequest('GET', SERVER + '/user/stats/v1', { token: user2.token }).userStats).toStrictEqual({ // fetches user2
    channelsJoined: [{ numChannelsJoined: 0, timeStamp: expect.any(Number) }],
    dmsJoined: [{ numDmsJoined: 0, timeStamp: expect.any(Number) }, { numDmsJoined: 1, timeStamp: expect.any(Number) }, { numDmsJoined: 0, timeStamp: expect.any(Number) }],
    messagesSent: [{ numMessagesSent: 0, timeStamp: expect.any(Number) }, { numMessagesSent: 1, timeStamp: expect.any(Number) }],
    involvementRate: 0.5,
  });
  createRequest('DELETE', SERVER + '/clear/v1', {});
});
