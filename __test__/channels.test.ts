import { createRequest } from '../other';
import { SERVER } from '../root';
import request from 'sync-request';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

type returnUser = {
    token: string;
    authUserId: number;
};
type returnChannel = {
    channelId:number;
};
describe('Testing channelscreate', () => {
  test('Length of name is less than 1', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });

    expect(request('POST', SERVER + '/channels/create/v3', { json: { token: user.token, name: '', isPublic: true } }).statusCode).toStrictEqual(400);
  });

  test('Length of name is more than 20', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });

    expect(request('POST', SERVER + '/channels/create/v3', { json: { token: user.token, name: '2rgdsfgergdfbdhhdfhxhexrhfbxfhfdgdfxj', isPublic: true } }).statusCode).toStrictEqual(400);
  });

  test('invalid user trying to create a channel', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newToken:string = user.token + '1';
    expect(request('POST', SERVER + '/channels/create/v3', { json: { token: newToken, name: 'sdf;alksdfj;a', isPublic: true } }).statusCode).toStrictEqual(403);
  });

  test('Creating the first channel', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });
    expect(createRequest('GET', SERVER + '/channels/listall/v3', { token: user.token })).toMatchObject({ channels: [{ channelId: channel.channelId, name: 'channel_1' }] });
  });

  test('Same user create the second channel with the same name', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });
    expect(createRequest('GET', SERVER + '/channels/listall/v3', { token: user.token })).toMatchObject({ channels: [{ channelId: channel1.channelId, name: 'channel_1' }, { channelId: channel2.channelId, name: 'channel_1' }] });
  });
});

describe('Testing channelslistv1 and channelslistall', () => {
  test('Listing channels with specified users', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });

    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel_2', isPublic: true });

    expect(createRequest('GET', SERVER + '/channels/list/v3', { token: user2.token })).toEqual({ channels: [{ channelId: channel2.channelId, name: 'channel_2' }] });
  });

  test('Listing all channels with invalid user', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });

    const newToken:string = user.token + '1';
    expect(request('GET', SERVER + '/channels/listall/v3', { headers: { token: newToken } }).statusCode).toEqual(403);
  });
  test('Listing match channels with valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });

    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel_2', isPublic: true });

    expect(createRequest('GET', SERVER + '/channels/list/v3', { token: user1.token })).toEqual({ channels: [{ channelId: channel1.channelId, name: 'channel_1' }] });
  });
});

describe('ChannelMessagesV3', () => {
  describe('for errors cause by', () => {
    test('invalid user token', () => {
      const user = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
      const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel', isPublic: true });

      expect(request('GET', SERVER + '/channel/messages/v3', { qs: { channelId: channel, start: 0 }, headers: { token: '/' } }).statusCode).toStrictEqual(403);
    });

    test('start value less than 0', () => {
      const user = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
      const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel', isPublic: true });

      expect(request('GET', SERVER + '/channel/messages/v3', { qs: { channelId: channel, start: -1 }, headers: { token: user.token } }).statusCode).toStrictEqual(400);
      createRequest('DELETE', SERVER + '/clear/v1', {});
    });
  });
});
