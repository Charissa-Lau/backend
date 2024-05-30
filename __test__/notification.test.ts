import { SERVER } from '../root';
import { createRequest } from '../other';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

afterEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

describe('Testing existence of notifications', () => {
  test('Testing notifications with invalid token', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message which is tagging @willkennedy @yiwenliao';
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('GET', SERVER + '/notifications/get/v1', { token: token + '1' }).statusCode).toEqual(403);
  });

  test('Testing that notification is added from channel message tag', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message which is tagging @willkennedy @yiwenliao';
    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('GET', SERVER + '/notifications/get/v1', { token: token }).notifications).toEqual([{
      notificationMessage: 'willkennedy tagged you in channel: This is a normal val',
      channelId: channelId,
      dmId: -1
    }]);
  });

  test('Testing that notification is added from DM message tag', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const uId = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@gmail.com', password: 'password', nameFirst: 'Yiwen', nameLast: 'Liao' }).authUserId;
    const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: token }, { uIds: [uId] });
    const message = 'This is a normal valid message which is tagging @willkennedy @yiwenliao';
    createRequest('POST', SERVER + '/message/senddm/v2', { token: token }, { dmId: dmId, message: message });
    expect(createRequest('GET', SERVER + '/notifications/get/v1', { token: token }).notifications).toEqual([{
      notificationMessage: 'willkennedy tagged you in willkennedy, yiwenliao: This is a normal val',
      channelId: -1,
      dmId: dmId
    }]);
  });
});
