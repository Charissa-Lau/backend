import { createRequest } from '../other';
import { SERVER } from '../root';

jest.setTimeout(30000);

type returnUser = {
  token: string;
  authUserId: number;
};

type returnChannel = {
  channelId:number;
};

type returndm = {
  dmId:number;
};
// testing messagesendlaterv1
describe('testing messagesendlaterv1', () => {
  let user1:returnUser;
  let user2:returnUser;
  let channel:returnChannel;
  let _timeSent:number;
  test('successfully sending message later and more error cases', async () => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
    user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(createRequest('POST', SERVER + '/message/sendlater/v1', { token: user1.token + user2.token + '1' }, { channelId: channel.channelId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(403);// invalid token
    const newMessage:string = 'a'.repeat(1001);
    expect(createRequest('POST', SERVER + '/message/sendlater/v1', { token: user1.token }, { channelId: channel.channelId, message: newMessage, timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(400);// invalid length
    expect(createRequest('POST', SERVER + '/message/sendlater/v1', { token: user1.token }, { channelId: channel.channelId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) - 2 }).statusCode).toStrictEqual(400);// time in the past
    expect(createRequest('POST', SERVER + '/message/sendlater/v1', { token: user2.token }, { channelId: channel.channelId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(403);// not a member
    _timeSent = Math.floor(Date.now() / 1000) + 2;
    expect(createRequest('POST', SERVER + '/message/sendlater/v1', { token: user1.token }, { channelId: channel.channelId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 })).toMatchObject({ messageId: expect.any(Number) });// sending this message after 2 seconds
    expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user1.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [], start: 0, end: -1 });
    await new Promise(r => setTimeout(r, 3000));
  });
  test('showing the message', () => {
    expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user1.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'thank you will!', timeSent: _timeSent, reacts: [], isPinned: false }], start: 0, end: -1 });
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});

describe('testing messagesendlaterv1', () => {
  let user1:returnUser;
  let user2:returnUser;
  let dm:returndm;
  let _timeSent:number;
  test('successfully sending message later and more error cases', async () => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
    user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [] });
    expect(createRequest('POST', SERVER + '/message/sendlaterdm/v1', { token: user1.token + user2.token + '1' }, { dmId: dm.dmId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(403);// invalid token
    const newMessage = 'a'.repeat(1001);
    expect(createRequest('POST', SERVER + '/message/sendlaterdm/v1', { token: user1.token }, { dmId: dm.dmId, message: newMessage, timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(400);// invalid length
    expect(createRequest('POST', SERVER + '/message/sendlaterdm/v1', { token: user1.token }, { dmId: dm.dmId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) - 2 }).statusCode).toStrictEqual(400);// time in the past
    expect(createRequest('POST', SERVER + '/message/sendlaterdm/v1', { token: user2.token }, { dmId: dm.dmId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 }).statusCode).toStrictEqual(403);// not a member
    _timeSent = Math.floor(Date.now() / 1000) + 2;
    expect(createRequest('POST', SERVER + '/message/sendlaterdm/v1', { token: user1.token }, { dmId: dm.dmId, message: 'thank you will!', timeSent: Math.floor(Date.now() / 1000) + 2 })).toMatchObject({ messageId: expect.any(Number) });// sending this message after 2 seconds
    expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dm.dmId, start: 0 })).toStrictEqual({ messages: [], start: 0, end: -1 });
    await new Promise(r => setTimeout(r, 3000));
  });
  test('showing the message', () => {
    expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dm.dmId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'thank you will!', timeSent: _timeSent, reacts: [], isPinned: false }], start: 0, end: -1 });
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
