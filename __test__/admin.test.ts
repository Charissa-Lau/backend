import { createRequest } from '../other';
import { SERVER } from '../root';

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
describe('testing admin/user/remove/v1', () => {
  test('token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token + user2.token + '1' }, { uId: user2.authUserId }).statusCode).toStrictEqual(403);
  });
  test('uId does not refer to a valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token }, { uId: user2.authUserId + user1.authUserId + 1 }).statusCode).toStrictEqual(400);
  });
  test('uId refers to a user who is the only global owner', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token }, { uId: user1.authUserId }).statusCode).toStrictEqual(400);
  });
  test('the authorised user is not a global owner', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    // let _data = createRequest('GET', SERVER + '/data/get', {});
    // console.log(_data);
    // console.log(_data.tokens);
    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user2.token }, { uId: user2.authUserId }).statusCode).toStrictEqual(403);
  });
  test('correct userprofile and usersall output', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token }, { uId: user2.authUserId })).toMatchObject({});

    expect(createRequest('GET', SERVER + '/user/profile/v3', { token: user1.token }, { uId: user2.authUserId }).user).toStrictEqual({
      uId: user2.authUserId,
      email: expect.any(String),
      nameFirst: 'Removed',
      nameLast: 'user',
      handleStr: expect.any(String),
      profileImgUrl: expect.any(String),
    });
    expect(createRequest('GET', SERVER + '/users/all/v2', { token: user1.token }, {})).toStrictEqual({
      users: [
        {
          uId: user1.authUserId,
          email: 'harrypotter@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter',
          profileImgUrl: expect.any(String),
        }
      ]
    });
  });
  test('correct message edit and channel member edit', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const channel:returnChannel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });

    createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel.channelId, uId: user2.authUserId });

    const messageId = createRequest('POST', SERVER + '/message/send/v2', { token: user2.token }, { channelId: channel.channelId, message: 'We can make it!' }).messageId;// sending the message
    expect(messageId).toStrictEqual(expect.any(Number));

    expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user1.token }, { uId: user2.authUserId })).toMatchObject({});
    expect(createRequest('GET', SERVER + '/channel/details/v3', { token: user1.token }, { channelId: channel.channelId })).toStrictEqual({
      name: 'channel1',
      isPublic: true,
      ownerMembers: [
        {
          uId: user1.authUserId,
          email: 'harrypotter@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter',
          profileImgUrl: expect.any(String),
        }
      ],
      allMembers: [
        {
          uId: user1.authUserId,
          email: 'harrypotter@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter',
          profileImgUrl: expect.any(String),
        }
      ]
    });
    expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user1.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [{ messageId: messageId, uId: user2.authUserId, message: 'Removed user', timeSent: expect.any(Number), reacts: [], isPinned: false }], start: 0, end: -1 });
  });
});
