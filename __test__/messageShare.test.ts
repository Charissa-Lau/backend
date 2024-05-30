import { createRequest } from '../other';
import { SERVER } from '../root';

jest.setTimeout(30000);

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

afterEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

test('message share testing channel', async () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
  const message1 = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hey!' });

  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: [] });
  const message2 = createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' });
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token + user2.token + '1' }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(403);// invalid token
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId + 1, dmId: -1 }).statusCode).toStrictEqual(400);// both channelId and dmId are invalid
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId, dmId: dm.dmId }).statusCode).toStrictEqual(400);// neither channelId nor dmId are -1

  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message2.messageId, message: 'hey!', channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(400);// ogMessageId does not refer to a valid message within a channel/DM that the authorised user has joined
  const newMessage = 'a'.repeat(1001);
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: newMessage, channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(400);// length > 1000
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'good job!', channelId: -1, dmId: dm.dmId }).statusCode).toStrictEqual(403);
  await new Promise(r => setTimeout(r, 1001));
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hello!', channelId: channel.channelId, dmId: -1 })).toStrictEqual({ sharedMessageId: expect.any(Number) });
  expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user1.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'hey!\nReply:hello!', timeSent: expect.any(Number), reacts: [], isPinned: false }, { messageId: expect.any(Number), uId: user1.authUserId, message: 'hey!', timeSent: expect.any(Number), reacts: [], isPinned: false }], start: 0, end: -1 });
});
test('message share testing dm', async () => {
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
  const message1 = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hey!' });
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: [] });
  const message2 = createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' });

  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token + user2.token + '1' }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(403);// invalid token
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId + 1, dmId: -1 }).statusCode).toStrictEqual(400);// both channelId and dmId are invalid
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId, dmId: dm.dmId }).statusCode).toStrictEqual(400);// neither channelId nor dmId are -1
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user2.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: -1, dmId: dm.dmId }).statusCode).toStrictEqual(400);// ogMessageId does not refer to a valid message within a channel/DM that the authorised user has joined
  const newMessage = 'a'.repeat(1001);
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: newMessage, channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(400);// length > 1000
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'good job!', channelId: -1, dmId: dm.dmId }).statusCode).toStrictEqual(403);
  await new Promise(r => setTimeout(r, 1001));
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user2.token }, { ogMessageId: message2.messageId, message: 'hello!', channelId: -1, dmId: dm.dmId })).toStrictEqual({ sharedMessageId: expect.any(Number) });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user2.token }, { dmId: dm.dmId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user2.authUserId, message: 'messages are not cool\nReply:hello!', timeSent: expect.any(Number), reacts: [], isPinned: false }, { messageId: expect.any(Number), uId: user2.authUserId, message: 'messages are not cool', timeSent: expect.any(Number), reacts: [], isPinned: false }], start: 0, end: -1 });
});
