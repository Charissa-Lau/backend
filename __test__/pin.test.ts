import { createRequest } from '../other';
import { SERVER } from '../root';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

afterEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

test('testing message pin/unpin in channel', () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel', isPublic: true });

  const message = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token + user2.token + '1' }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// token not valid
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// messageId is not a valid message within a channel or DM that the authorised user is part of
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});// pin the message once
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// pin the message twice, which will fail
  expect(createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel.channelId, uId: user2.authUserId })).toMatchObject({});// invite user2 to the channel
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// messageId refers to a valid message in a joined channel/DM and the authorised user does not have owner permissions in the channel/DM

  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token + user2.token + '1' }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// token not valid
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId + 1 }).statusCode).toStrictEqual(400);// messageId is not a valid message within a channel or DM that the authorised user is part of
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// unpin the message twice, which will fail
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});// pin the message again
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user2.token }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// user2 not the owner, so it will fail

  // successful functionality
  expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user1.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'hello!', timeSent: expect.any(Number), reacts: [], isPinned: true }], start: 0, end: -1 });// ispinned is true
});
test('testing message pin/unpin dm', () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
  const user3 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter1@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [user2.authUserId] });
  const message = createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm.dmId, message: 'hello!' });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dm.dmId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'hello!', timeSent: expect.any(Number), reacts: [], isPinned: false }], start: 0, end: -1 });// ispinned is false

  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token + user2.token + '1' }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// token not valid
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user3.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// messageId is not a valid message within a channel or DM that the authorised user is part of
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});// pin the message once
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// pin the message twice, which will fail
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});// pin the message twice, which will fail
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// messageId refers to a valid message in a joined channel/DM and the authorised user does not have owner permissions in the channel/DM

  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token + user2.token + '1' }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// token not valid
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId + 1 }).statusCode).toStrictEqual(400);// messageId is not a valid message within a channel or DM that the authorised user is part of
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message.messageId }).statusCode).toStrictEqual(400);// unpin the message twice, which will fail
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message.messageId })).toStrictEqual({});// pin the message again
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user2.token }, { messageId: message.messageId }).statusCode).toStrictEqual(403);// user2 not the owner, so it will fail

  // successful functionality
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dm.dmId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'hello!', timeSent: expect.any(Number), reacts: [], isPinned: true }], start: 0, end: -1 });// ispinned is true
});
