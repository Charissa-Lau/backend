import { createRequest } from '../other';
import { SERVER } from '../root';

type returnUser = {
  token: string;
  authUserId: number;
};

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

afterEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

test('Testing DM messages', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

  const uIds : number[] = [user2.authUserId, user3.authUserId];

  const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: uIds });

  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });

  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dmId, start: 0 }).messages.length).toStrictEqual(6);
});

test('when the token is invalid', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

  const uIds : number[] = [user2.authUserId, user3.authUserId];

  const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: uIds });

  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token + user2.token + user3.token + '1' }, { dmId: dmId, start: 0 }).statusCode).toStrictEqual(403);
});

test('when dmid does not refer to a valid dm', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

  const uIds : number[] = [user2.authUserId, user3.authUserId];

  const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: uIds });

  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dmId + 1, start: 0 }).statusCode).toStrictEqual(400);
});

test('when user is not part of the dm', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

  const uIds : number[] = [user2.authUserId];

  const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: uIds });

  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user3.token }, { dmId: dmId, start: 0 }).statusCode).toStrictEqual(400);
});

test('when start not within range', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

  const uIds : number[] = [user2.authUserId, user3.authUserId];

  const { dmId } = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: uIds });

  createRequest('POST', SERVER + '/message/senddm/v2', { token: user1.token }, { dmId: dmId, message: 'messages are really cool' });
  expect(createRequest('GET', SERVER + '/dm/messages/v2', { token: user1.token }, { dmId: dmId, start: 100 }).statusCode).toStrictEqual(400);
});
