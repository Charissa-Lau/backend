import { createRequest } from '../other';
import { SERVER } from '../root';
import request from 'sync-request';

createRequest('DELETE', SERVER + '/clear/v1', {});
describe('Testing authLoginV3', () => {
  // valid uses (4)
  test('Testing correct usage of authLoginV1', () => {
    [
      ['theawesomew@gmail.com', 'password'],
      ['sn1p3r@gmail.com', 'password1'],
      ['tomcr00se@gmail.com', 'notpassword'],
      ['geohot@hotmail.com', 'youthoughtitwouldbepasswordagain?']
    ].forEach(([email, password]) => {
      const authUserId = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: email, password: password, nameFirst: 'Anonymous', nameLast: 'Anonymous' }).authUserId;
      expect(createRequest('POST', SERVER + '/auth/login/v3', {}, { email: email, password: password }).authUserId).toStrictEqual(authUserId);
    });
  });
});

// invalid email (3)

test('Testing incorrect usage of authLoginV1 by invalid email', () => {
  [
    ['theawesomewgmailcom', 'password'],
    ['sn1p3rgmail.com', 'password1'],
    ['tomcr00se@gmailcom', 'notpassword'],
  ].forEach(([email, password]) => {
    expect(request('POST', SERVER + '/auth/login/v3', { json: { email: email, password: password } }).statusCode).toStrictEqual(400);
  });
});
// invalid password (3)

test('Testing incorrect usage of authLoginV1 by invalid password', () => {
  [
    ['theawesomew@gmail.com', 'passwordisnotmypassword'],
    ['sn1p3r@gmail.com', 'password1abcdefg'],
    ['tomcr00se@gmail.com', 'notpassword__'],
  ].forEach(([email, password]) => {
    expect(request('POST', SERVER + '/auth/login/v3', { json: { email: email, password: password } }).statusCode).toStrictEqual(400);
  });
});

describe('Testing authRegisterV3', () => {
  test('Testing valid user registration in authRegisterV1', () => {
    expect(createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' })).toBeInstanceOf(Object);
  });

  test('Testing multiple users with the same email in authRegisterV1', () => {
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' } }).statusCode).toStrictEqual(400);
  });

  test('Testing passwords with fewer than 6 characters in authRegisterV1', () => {
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: '', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'p', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'pa', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'pas', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'pass', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'passw', nameFirst: 'George', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
  });

  test('Testing names with greater than 50 characters in authRegisterV1', () => {
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'password', nameFirst: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
  });

  test('Testing names with fewer than 1 character in authRegisterV1', () => {
    expect(request('POST', SERVER + '/auth/register/v3', { json: { email: 'geohot@gmail.com', password: 'password', nameFirst: '', nameLast: 'Hotz' } }).statusCode).toStrictEqual(400);
  });

  test('Testing appropriate name creation given a standard name without non-alphanumeric characters with concatenation length less than 20 in authRegisterV1', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'geohot@gmail.com', password: 'password', nameFirst: 'George', nameLast: 'Hotz' });
    const users = createRequest('GET', SERVER + '/data/get', {}).users;
    expect(users['geohot@gmail.com'].handleStr).toStrictEqual('georgehotz');
  });

  test('Testing appropriate name creation given a standard name without non-alphanumeric characters with concatenation length greater than 20 in authRegisterV1', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'mammadyarov@gmail.com', password: 'password', nameFirst: 'Shahriyar Hamid oghlu', nameLast: 'Mammadyarov' });
    const users = createRequest('GET', SERVER + '/data/get', {}).users;
    expect(users['mammadyarov@gmail.com'].handleStr).toStrictEqual('shahriyarhamidoghlum');
  });

  test('Testing appropriate name creation given a standard name with non-alphanumeric characters with concatenation length less than 20 in authRegisterV1', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'example@gmail.com', password: 'password', nameFirst: 'Keorge@@', nameLast: 'Hotz' });
    const users = createRequest('GET', SERVER + '/data/get', {}).users;
    expect(users['example@gmail.com'].handleStr).toStrictEqual('keorgehotz');
  });

  test('Testing appropriate name creation given a standard name with non-alphanumeric characters with concatenation length greater than 20 in authRegisterV1', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'mammadyarov1@gmail.com', password: 'password', nameFirst: 'Lhahriyar Hamid oghlu@@@@', nameLast: 'Mammadyarov' });
    const users = createRequest('GET', SERVER + '/data/get', {}).users;
    expect(users['mammadyarov1@gmail.com'].handleStr).toStrictEqual('lhahriyarhamidoghlum');
  });

  test('Multiple users with the same name in authRegisterV1', () => {
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'email@gmail.com', password: 'password', nameFirst: 'WR', nameLast: 'Kennedy' });
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'email1@gmail.com', password: 'password', nameFirst: 'WR', nameLast: 'Kennedy' });
    createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'email2@gmail.com', password: 'password', nameFirst: 'WR', nameLast: 'Kennedy' });
    const users = createRequest('GET', SERVER + '/data/get', {}).users;
    expect(users['email2@gmail.com'].handleStr).toStrictEqual('wrkennedy1');
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
