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

// Testing for channelDetailsV1

describe('Testing channel/details/v3', () => {
  test('successful listing of channel details for user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel2', isPublic: false });
    createRequest('GET', SERVER + '/channel/details/v3', { token: user2.token, channelId: channel2.channelId });
    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user2.token }, { channelId: channel2.channelId })).toStrictEqual({
      name: 'channel2',
      isPublic: false,
      ownerMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        }
      ]
    });
  });

  // error testing

  test('when channelId does not refer to a valid channel', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    expect(request('GET', SERVER + '/channel/details/v3', { qs: { channelId: 1 }, headers: { token: user2.token } }).statusCode).toStrictEqual(400);
  });

  test('when successfully registered user is not a part of the channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: false });
    expect(request('GET', SERVER + '/channel/details/v3', { qs: { channelId: channel1.channelId }, headers: { token: user2.token } }).statusCode).toStrictEqual(403);
  });

  test('when token is not valid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('GET', SERVER + '/channel/details/v3', { qs: { channelId: channel1.channelId }, headers: { token: user2.token + '1' } }).statusCode).toStrictEqual(403);
  });
});

// Testing for channeJoinV1

describe('Testing for channel/Join/V3', () => {
  // error testing
  test('when channelId does not refer to a valid channel', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    createRequest('POST', SERVER + '/channel/join/v3', { token: user2.token }, { channelId: 1 });
    expect(request('POST', SERVER + '/channel/join/v3', { json: { channelId: 1 }, headers: { token: user2.token } }).statusCode).toStrictEqual(400);
  });

  test('when token is not valid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('POST', SERVER + '/channel/join/v3', { json: { channelId: channel1.channelId }, headers: { token: user2.token + user1.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('when authorised user is already a part of the channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel2', isPublic: true });
    expect(request('POST', SERVER + '/channel/join/v3', { json: { channelId: channel2.channelId }, headers: { token: user2.token } }).statusCode).toStrictEqual(400);
  });

  test('when the channel of the input channelId is private, and authorised user is not a member', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel2', isPublic: false });
    expect(createRequest('POST', SERVER + '/channel/join/v3', { token: user1.token }, { channelId: channel2.channelId })).toStrictEqual({});
    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user1.token }, { channelId: channel2.channelId })).toStrictEqual({
      name: 'channel2',
      isPublic: false,
      ownerMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        },

        {
          uId: user1.authUserId,
          email: 'billysmith@gmail.com',
          nameFirst: 'Billy',
          nameLast: 'Smith',
          handleStr: 'billysmith',
          profileImgUrl: expect.any(String),
        }
      ]
    });
  });

  test('when the channel of the input channelId is private, and the authorised user is not a global owner', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: false });
    expect(request('POST', SERVER + '/channel/join/v3', { json: { token: user2.token, channelId: channel1.channelId } }).statusCode).toStrictEqual(403);
  });

  // successful addition of member into a channel

  test('when authUser is successfully added to a channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'billysmith@gmail.com', password: 'billysmith2003!', nameFirst: 'Billy', nameLast: 'Smith' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'oversizedwombat@gmail.com', password: 'wombatstew!69', nameFirst: 'Lee', nameLast: 'Sin' });
    createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    const channel2:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user2.token }, { name: 'channel2', isPublic: true });
    expect(createRequest('POST', SERVER + '/channel/join/v3', { token: user1.token }, { channelId: channel2.channelId })).toStrictEqual({});
    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user1.token }, { channelId: channel2.channelId })).toStrictEqual({
      name: 'channel2',
      isPublic: true,
      ownerMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: user2.authUserId,
          email: 'oversizedwombat@gmail.com',
          nameFirst: 'Lee',
          nameLast: 'Sin',
          handleStr: 'leesin',
          profileImgUrl: expect.any(String),
        },
        {
          uId: user1.authUserId,
          email: 'billysmith@gmail.com',
          nameFirst: 'Billy',
          nameLast: 'Smith',
          handleStr: 'billysmith',
          profileImgUrl: expect.any(String),
        }
      ]
    });
  });
});

describe('Testing channel/Invite/V3', () => {
  // error testing

  test('channelId does not refer to a valid channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('POST', SERVER + '/channel/invite/v3', { json: { channelId: channel1.channelId + 1, uId: user2.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('uId does not refer to a valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('POST', SERVER + '/channel/invite/v3', { json: { channelId: channel1.channelId, uId: user2.authUserId + 1 }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('uId refers to a user who is already a member of the channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(request('POST', SERVER + '/channel/invite/v3', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('channelId is valid and the authorised user is not a member of the channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('POST', SERVER + '/channel/invite/v3', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user2.token } }).statusCode).toStrictEqual(403);
  });

  test('token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    expect(request('POST', SERVER + '/channel/invite/v3', { json: { channelId: channel1.channelId, uId: user2.authUserId }, headers: { token: user2.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('check if uId is succesfully added into the channel', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel1:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });
    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel1.channelId, uId: user2.authUserId });
    expect(createRequest('GET', SERVER + '/channels/list/v3', { token: user2.token })).toMatchObject({ channels: [{ channelId: channel1.channelId, name: 'channel1' }] });
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
