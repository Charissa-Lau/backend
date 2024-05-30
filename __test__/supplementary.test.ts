import { createRequest } from '../other';
import { SERVER } from '../root';
import request from 'sync-request';

test('message pinand unpin tests', () => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel', isPublic: true });
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: [user1.authUserId] });
  const message1 = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  const message2 = createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' });
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user1.token }, { reactId: 1, messageId: message1.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token }, { reactId: 2, messageId: message2.messageId }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token + user1.token + '1' }, { reactId: 2, messageId: message2.messageId }).statusCode).toStrictEqual(403);
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token + user1.token + '1' }, { reactId: 2, messageId: message2.messageId }).statusCode).toStrictEqual(403);

  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});

  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId + message1.messageId + 1 }).statusCode).toStrictEqual(400);

  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user1.token }, { reactId: 1, messageId: message1.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token }, { reactId: 1, messageId: message1.messageId }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user1.token }, { reactId: 1, messageId: message1.messageId }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user2.token + user1.token + '1' }, { reactId: 2, messageId: message2.messageId }).statusCode).toStrictEqual(403);
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token + user1.token + '1' }, { reactId: 2, messageId: message2.messageId }).statusCode).toStrictEqual(403);

  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message1.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token }, { messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message1.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user2.token }, { messageId: message2.messageId })).toStrictEqual({});

  expect(createRequest('PUT', SERVER + '/message/edit/v2', { token: user2.token }, { messageId: message2.messageId, message: '!!!!!' })).toStrictEqual({});

  expect(createRequest('DELETE', SERVER + '/message/remove/v2', { token: user1.token }, { messageId: message2.messageId }).statusCode).toStrictEqual(403);
  expect(createRequest('DELETE', SERVER + '/message/remove/v2', { token: user2.token }, { messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('DELETE', SERVER + '/message/remove/v2', { token: user2.token }, { messageId: message2.messageId }).statusCode).toStrictEqual(400);
});

test('more detailed message react and unreact tests', () => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel', isPublic: true });
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: [user1.authUserId] });
  const message1 = createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  const message2 = createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' });
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/react/v1', { token: user1.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user1.token }, { reactId: 1, messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unreact/v1', { token: user2.token }, { reactId: 1, messageId: message2.messageId + message1.messageId + 1 }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message2.messageId + message1.messageId + 1 }).statusCode).toStrictEqual(400);

  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user1.token }, { messageId: message1.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user2.token }, { messageId: message1.messageId }).statusCode).toStrictEqual(400);

  expect(createRequest('POST', SERVER + '/message/pin/v1', { token: user2.token }, { messageId: message2.messageId })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/dm/leave/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({});
  expect(createRequest('POST', SERVER + '/message/unpin/v1', { token: user1.token }, { messageId: message2.messageId }).statusCode).toStrictEqual(400);

  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message2.messageId, message: 'hey!', channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user2.token }, { ogMessageId: message2.messageId, message: 'hey!', channelId: -1, dmId: dm.dmId + 1 }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user1.token }, { ogMessageId: message1.messageId, message: 'hey!', channelId: channel.channelId + 1, dmId: -1 }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/message/share/v1', { token: user2.token }, { ogMessageId: message2.messageId, message: 'hey!', channelId: channel.channelId, dmId: -1 }).statusCode).toStrictEqual(403);
});

test('more detailed message react and unreact tests', () => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
  const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
  const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

  const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel', isPublic: true });
  const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: [user1.authUserId] });
  createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel.channelId, message: 'hello!' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: 'messages are not cool' });
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user2.authUserId, permissionId: 1 })).toStrictEqual({});

  expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token }, { uId: user2.authUserId })).toMatchObject({});
  expect(createRequest('POST', SERVER + '/user/profile/uploadphoto/v1', { token: user1.token + user2.token + '1' }, { imgUrl: 'http://swiat-kamienia.pl/images/stories/News/2017/wkg.JPG', xStart: 1, yStart: 1, xEnd: 2, yEnd: 2 }).statusCode).toStrictEqual(403);
  expect(createRequest('POST', SERVER + '/user/profile/uploadphoto/v1', { token: user1.token }, { imgUrl: 'http://swiat-kamienia.pl/images/stories/News/2017/wkg.JPG', xStart: 2, yStart: 1, xEnd: 1, yEnd: 2 }).statusCode).toStrictEqual(400);
  expect(createRequest('POST', SERVER + '/user/profile/uploadphoto/v1', { token: user1.token }, { imgUrl: 'http://swiat-kamienia.pl/images/stories/News/2017/wkg.JPG', xStart: 1, yStart: 1, xEnd: 2, yEnd: 2 })).toStrictEqual({});
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token + user1.token + '1' }, { dmId: dm.dmId, message: 'messages are not cool' }).statusCode).toStrictEqual(403);
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId + 100, message: 'messages are not cool' }).statusCode).toStrictEqual(400);
  createRequest('POST', SERVER + '/dm/leave/v2', { token: user1.token }, { dmId: dm.dmId });
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm.dmId, message: 'messages are not cool' }).statusCode).toStrictEqual(403);
  const newmessage = 'a'.repeat(1001);
  expect(createRequest('POST', SERVER + '/message/senddm/v2', { token: user2.token }, { dmId: dm.dmId, message: newmessage }).statusCode).toStrictEqual(403);
});

test('more detailed  tests', () => {
  request('GET', SERVER + '/tmp/default.jpg', {});
  // expect().toStrictEqual({});
});
