import { createRequest } from '../other';
import { SERVER } from '../root';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

afterEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

describe('Testing /search/v1', () => {
  test('Testing user who has joined no channels', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: 'meme' })).toStrictEqual({ messages: [] });
  });

  test('Testing queryStr with no matches', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that word' });
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: 'meme' })).toStrictEqual({ messages: [] });
  });

  test('Testing queryStr which has more than 1,000 characters in it', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that word' });
    const queryStr = 'a'.repeat(1001);
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).statusCode).toStrictEqual(400);
  });

  test('Testing with invalid token', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that word' });
    const queryStr = 'a'.repeat(1001);
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).statusCode).toStrictEqual(400);
  });

  test('Testing singular valid return', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that word' });
    const queryStr = 'This';
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).messages.length).toStrictEqual(1);
  });

  test('Testing several valid returns', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'This message does not contain that phrase' });
    const queryStr = 'This';
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).messages.length).toStrictEqual(3);
  });

  test('Testing single valid return across multiple channels', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const channel1 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const channel2 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel1.channelId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel2.channelId, message: 'This message does not contain that phrase' });
    const queryStr = 'phrase';
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).messages.length).toStrictEqual(1);
  });

  test('Testing multiple valid return across multiple channels', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const channel1 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const channel2 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel1.channelId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel2.channelId, message: 'This message does not contain that phrase' });
    const queryStr = 'This';
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).messages.length).toStrictEqual(2);
  });

  test('Testing valid return in channel which user is not apart', () => {
    const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'yiwen.liao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1 = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel', isPublic: true });
    const channel2 = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: user1.token }, { channelId: channel1.channelId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: user2.token }, { channelId: channel2.channelId, message: 'This message does not contain that phrase' });
    const queryStr = 'phrase';
    expect(createRequest('GET', SERVER + '/search/v1', { token: user1.token }, { queryStr: queryStr }).messages.length).toStrictEqual(0);
  });

  test('Testing case insensitivity', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const channel1 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const channel2 = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel1.channelId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channel2.channelId, message: 'This message does not contain that phrase' });
    const queryStr = 'this';
    expect(createRequest('GET', SERVER + '/search/v1', { token: token }, { queryStr: queryStr }).messages.length).toStrictEqual(2);
  });

  test('Testing single valid return across multiple dms', () => {
    const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'yiwen.liao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'yiwen.liao1@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const dm1 = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [user2.authUserId] });
    const dm2 = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [user3.authUserId] });
    createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm1.dmId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm2.dmId, message: 'This message does not contain that phrase' });
    const queryStr = 'phrase';
    expect(createRequest('GET', SERVER + '/search/v1', { token: user1.token }, { queryStr: queryStr }).messages.length).toStrictEqual(1);
  });

  test('Testing multiple valid return across multiple dms', () => {
    const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'yiwen.liao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'yiwen.liao1@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const dm1 = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [user2.authUserId] });
    const dm2 = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: [user3.authUserId] });
    createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm1.dmId, message: 'This message does not contain THAT word' });
    createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dm2.dmId, message: 'This message does not contain that phrase' });
    const queryStr = 'This';
    expect(createRequest('GET', SERVER + '/search/v1', { token: user1.token }, { queryStr: queryStr }).messages.length).toStrictEqual(2);
  });
});
