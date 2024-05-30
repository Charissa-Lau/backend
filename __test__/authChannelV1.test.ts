import { createRequest } from '../other';
import { SERVER } from '../root';
import request from 'sync-request';

type returnUser = {
    token: string;
    authUserId: number;
};
type returnChannel = {
    channelId:number;
};

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});
describe('Testing authLogoutV2', () => {
  test('successfully logged out', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    createRequest('POST', SERVER + '/auth/logout/v2', { token: user.token });
    expect(request('POST', SERVER + '/channels/create/v3', { json: { name: 'channel_1', isPublic: true }, headers: { token: user.token } }).statusCode).toStrictEqual(403);
  });

  test('When the token is invalid with only one user', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    expect(request('POST', SERVER + '/auth/logout/v2', { headers: { token: user.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('When there are multiple users but token is still invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    expect(request('POST', SERVER + '/auth/logout/v2', { headers: { token: user1.token + user2.token + '1' } }).statusCode).toStrictEqual(403);
  });
});

describe('Testing channelLeaveV2', () => {
  test('successfully leave', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newChannel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });

    createRequest('POST', SERVER + '/channel/leave/v2', { token: user.token }, { channelId: newChannel.channelId });

    expect(createRequest('GET', SERVER + '/channels/list/v3', { token: user.token })).toMatchObject({ channels: [] });
  });

  test('when channelId does not refer to a valid channel', () => {
    const user:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newChannel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/leave/v2', { json: { channelId: newChannel.channelId + 1 }, headers: { token: user.token } }).statusCode).toStrictEqual(400);
  });

  test('when channelId is valid but user is not part of that channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/leave/v2', { json: { channelId: channel2.channelId }, headers: { token: user1.token } }).statusCode).toStrictEqual(403);
  });

  test('when token is invalid token', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/leave/v2', { json: { channelId: channel1.channelId }, headers: { token: user1.token + '1' } }).statusCode).toStrictEqual(403);
  });
});

describe('Testing channelAddOwnerV2', () => {
  test('successfully add owner', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newChannel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });

    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });

    createRequest('POST', SERVER + '/channel/addowner/v2', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });

    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user1.token }, { channelId: newChannel.channelId })).toMatchObject({ name: 'channel_1', isPublic: true, ownerMembers: [{ uId: user1.authUserId, email: 'YiwenLiao@unsw.edu.au', nameFirst: 'Yiwen', nameLast: 'Liao', handleStr: expect.any(String) }, { uId: user2.authUserId, email: 'YiwennLiaoo@unsw.edu.au', nameFirst: 'Yiwenn', nameLast: 'Liaoo', handleStr: expect.any(String) }], allMembers: [{ uId: user1.authUserId, email: 'YiwenLiao@unsw.edu.au', nameFirst: 'Yiwen', nameLast: 'Liao', handleStr: expect.any(String) }, { uId: user2.authUserId, email: 'YiwennLiaoo@unsw.edu.au', nameFirst: 'Yiwenn', nameLast: 'Liaoo', handleStr: expect.any(String) }] });
  });

  test('when challeid does not refer to valid channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel2.channelId + channel1.channelId + 1, uId: user2.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });
  test('when uId does not refer to valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel1.channelId, uId: user2.authUserId + user1.authUserId + 1 }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when token is not valid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user1.token + user2.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('when uId is not member', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when uId is already owner of channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel1.channelId, uId: user1.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when channelId is valid but user does not have owner permissions of channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'bigbrainnuts@gmail.com', password: '123456', nameFirst: 'Black', nameLast: 'Sheep' });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(request('POST', SERVER + '/channel/addowner/v2', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user2.token } }).statusCode).toStrictEqual(403);
  });
});

describe('Testing channelRemoveOwnerV2', () => {
  test('successfully remove owner', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newChannel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });

    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });
    createRequest('POST', SERVER + '/channel/addowner/v2', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });
    createRequest('POST', SERVER + '/channel/removeowner/v2', { token: user2.token }, { channelId: newChannel.channelId, uId: user1.authUserId });

    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user1.token }, { channelId: newChannel.channelId })).toMatchObject({ name: 'channel_1', isPublic: true, ownerMembers: [{ uId: user2.authUserId, email: 'YiwennLiaoo@unsw.edu.au', nameFirst: 'Yiwenn', nameLast: 'Liaoo', handleStr: expect.any(String) }], allMembers: [{ uId: user1.authUserId, email: 'YiwenLiao@unsw.edu.au', nameFirst: 'Yiwen', nameLast: 'Liao', handleStr: expect.any(String) }, { uId: user2.authUserId, email: 'YiwennLiaoo@unsw.edu.au', nameFirst: 'Yiwenn', nameLast: 'Liaoo', handleStr: expect.any(String) }] });
  });

  test('when challeid does not refer to valid channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    expect(request('POST', SERVER + '/channel/removeowner/v2', { json: { channelId: channel1.channelId + 1, uId: user1.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when uId does not refer to valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    createRequest('POST', SERVER + '/channel/addowner/v2', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(request('POST', SERVER + '/channel/removeowner/v2', { json: { channelId: channel1.channelId, uId: user1.authUserId + user2.authUserId + 1 }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const newChannel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });

    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });
    createRequest('POST', SERVER + '/channel/addowner/v2', { token: user1.token }, { channelId: newChannel.channelId, uId: user2.authUserId });
    expect(createRequest('POST', SERVER + '/channel/removeowner/v2', { token: user2.token + user1.token + '1' }, { channelId: newChannel.channelId, uId: user1.authUserId }).statusCode).toStrictEqual(403);
  });

  test('when the uId is not member of channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel_1', isPublic: true });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    expect(request('POST', SERVER + '/channel/removeowner/v2', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
