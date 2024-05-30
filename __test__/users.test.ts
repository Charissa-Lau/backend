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
// Testing function userProfileV1
describe('Testing userProfileV3', () => {
  test('Successful return of user ID, email, first name, last name, handle', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });

    expect(createRequest('GET', SERVER + '/user/profile/v3', { token: user1.token }, { uId: user1.authUserId }).user).toStrictEqual({
      uId: user1.authUserId,
      email: 'harrypotter@gmail.com',
      nameFirst: 'Harry',
      nameLast: 'Potter',
      handleStr: 'harrypotter',
      profileImgUrl: expect.any(String),
    });
  });

  // Error testing (basic)
  test('When uId does not refer to a valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    expect(request('GET', SERVER + '/user/profile/v3', { qs: { uId: user1.authUserId + 1 }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('When authUserId is invalid, token not valid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const newToken = user1.token + '1';
    expect(request('GET', SERVER + '/user/profile/v3', { qs: { uId: user1.authUserId }, headers: { token: newToken } }).statusCode).toStrictEqual(403);
  });
});

describe('Testing listing all users', () => {
  test('Successful listing all users', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });

    expect(createRequest('GET', SERVER + '/users/all/v2', { token: user2.token }, {})).toStrictEqual({
      users: [
        {
          uId: user1.authUserId,
          email: 'harrypotter@gmail.com',
          nameFirst: 'Harry',
          nameLast: 'Potter',
          handleStr: 'harrypotter',
          profileImgUrl: expect.any(String),
        },
        {
          uId: user2.authUserId,
          email: 'YiwennLiaoo@unsw.edu.au',
          nameFirst: 'Yiwenn',
          nameLast: 'Liaoo',
          handleStr: 'yiwennliaoo',
          profileImgUrl: expect.any(String),
        }

      ]
    });
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});

test('Testing userpermission change', () => {
  const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
  const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token + user2.token + '1' }, { uId: user2.authUserId, permissionId: 1 }).statusCode).toStrictEqual(403);// invalid token
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user2.authUserId + user1.authUserId + 1, permissionId: 1 }).statusCode).toStrictEqual(400);// uId not valid

  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user1.authUserId, permissionId: 0 }).statusCode).toStrictEqual(400);// only owner

  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user2.authUserId, permissionId: 100 }).statusCode).toStrictEqual(400);// invalid permissionId
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user1.authUserId, permissionId: 1 }).statusCode).toStrictEqual(400);// alreayd has permission
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user2.token }, { uId: user1.authUserId, permissionId: 1 }).statusCode).toStrictEqual(403);// auth user not a global owner
  // successful
  expect(createRequest('POST', SERVER + '/admin/userpermission/change/v1', { token: user1.token }, { uId: user2.authUserId, permissionId: 1 })).toStrictEqual({});// change user2 permission
  expect(createRequest('DELETE', SERVER + '/admin/user/remove/v1', { token: user2.token }, { uId: user1.authUserId })).toMatchObject({});// user 2 remove user1 successfully
});
