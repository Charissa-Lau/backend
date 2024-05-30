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

describe('Testing set properties', () => {
  test('Successful seting all properties', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
    expect(createRequest('PUT', SERVER + '/user/profile/setname/v2', { token: user1.token }, { nameFirst: 'Yiwen', nameLast: 'Liao' })).toMatchObject({});
    expect(createRequest('PUT', SERVER + '/user/profile/setemail/v2', { token: user1.token }, { email: 'YiwenLiao@unsw.edu.au' })).toMatchObject({});
    expect(createRequest('PUT', SERVER + '/user/profile/sethandle/v2', { token: user1.token }, { handleStr: 'yiwenliao' })).toMatchObject({});
    expect(createRequest('GET', SERVER + '/users/all/v2', { token: user1.token })).toStrictEqual({
      users: [

        {
          uId: user1.authUserId,
          email: 'YiwenLiao@unsw.edu.au',
          nameFirst: 'Yiwen',
          nameLast: 'Liao',
          handleStr: 'yiwenliao',
          profileImgUrl: expect.any(String),
        }

      ]
    });
  });

  describe('testing for user/profile/setname/v1', () => {
    // error tests
    test('for user/profile/setname/v1 when nameFirst is not between 1 and 50 characters inclusive', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/setname/v2', { json: { nameFirst: '', nameLast: 'Liao' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    });

    test('for user/profile/setname/v1 when nameLast is not between 1 and 50 characters inclusive', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/setname/v2', { json: { nameFirst: 'Hungary', nameLast: '' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    });

    test('when the token is invalid', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/setname/v2', { json: { nameFirst: 'Hungary', nameLast: '' }, headers: { token: user1.token + '1' } }).statusCode).toStrictEqual(403);
    });
  });

  describe('testing for user/profile/setemail/v1', () => {
    test('when the token is invalid', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/setemail/v2', { json: { email: 'YiwenLiao@unsw.edu.au' }, headers: { token: user1.token + '1' } }).statusCode).toStrictEqual(403);
    });

    test('when the email is already being used by another user', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'honyboywantsec@gmail.com', password: 'secy120', nameFirst: 'Brown', nameLast: 'Cookie' });
      expect(request('PUT', SERVER + '/user/profile/setemail/v2', { json: { email: 'honyboywantsec@gmail.com' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    });

    test('when the email is invalid', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/setemail/v2', { json: { email: '23' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    });
  });

  describe('testing user/profile/sethandle/v1', () => {
  // error testing
    test('when the handleStr is not between 3 and 20 characters inclusive', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/sethandle/v2', { json: { handleStr: 'Ha' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    });

    test('when the token is invalid', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/sethandle/v2', { json: { handleStr: 'Haha' }, headers: { token: user1.token + '1' } }).statusCode).toStrictEqual(403);
    });

    test('when the handleStr does not contain alphanumeric characters', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      expect(request('PUT', SERVER + '/user/profile/sethandle/v2', { json: { handleStr: 'Hahaha$52%@7349/23' }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
      createRequest('DELETE', SERVER + '/clear/v1', {});
    });

    test('when the handlestring is already taken', () => {
      const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'harrypotter@gmail.com', password: '123456', nameFirst: 'Harry', nameLast: 'Potter' });
      const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'basedgamer@gmail.com', password: '123456', nameFirst: 'Hungry', nameLast: 'Hippo' });
      expect(createRequest('PUT', SERVER + '/user/profile/sethandle/v2', { token: user1.token }, { handleStr: 'yiwenliao' })).toMatchObject({});
      expect(createRequest('PUT', SERVER + '/user/profile/sethandle/v2', { token: user2.token }, { handleStr: 'yiwenliao' }).statusCode).toStrictEqual(400);
    });
  });
});
