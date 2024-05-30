import { createRequest } from '../other';
import { SERVER } from '../root';

describe('Testing message/react/v1', () => {
  beforeEach(() => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });

  afterEach(() => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });

  test('Testing valid usage of message/react/v1 in channel', () => {
    const { token } = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesomew@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' });
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: 'Hello, World!' });
    createRequest('POST', SERVER + '/message/react/v1', { token: token }, { reactId: 1, messageId: messageId });
    createRequest('GET', SERVER + '/channel/messages/', { token: token }, { channelId: channelId, start: 0 });
  });
});
