import { createRequest } from '../other';
import { SERVER } from '../root';

beforeEach(() => {
  createRequest('DELETE', SERVER + '/clear/v1', {});
});

jest.setTimeout(30000);

test('testing successful reseting password', async () => { // note that this has to be a white box test
  createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'z5342335@ad.unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  expect(createRequest('POST', SERVER + '/auth/passwordreset/request/v1', {}, { email: 'z5342335@ad.unsw.edu.au' })).toMatchObject({});
  let _data = createRequest('GET', SERVER + '/data/get', {});
  const reset = Object.keys(_data.resetCodes).find(key => _data.resetCodes[key].email === 'z5342335@ad.unsw.edu.au');
  expect(createRequest('POST', SERVER + '/auth/passwordreset/reset/v1', {}, { resetCode: reset, newPassword: '654321' })).toMatchObject({});
  _data = createRequest('GET', SERVER + '/data/get', {});
  expect(createRequest('POST', SERVER + '/auth/login/v3', {}, { email: 'z5342335@ad.unsw.edu.au', password: '654321' }).authUserId).toStrictEqual(_data.users['z5342335@ad.unsw.edu.au'].uId);
  await new Promise(r => setTimeout(r, 3000));
});

test('testing error reseting password', () => { // note that this has to be a white box test
  createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'z5342335@ad.unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
  expect(createRequest('POST', SERVER + '/auth/passwordreset/request/v1', {}, { email: 'z5342335@ad.unsw.edu.au' })).toMatchObject({});
  const _data = createRequest('GET', SERVER + '/data/get', {});
  const reset = Object.keys(_data.resetCodes).find(key => _data.resetCodes[key].email === 'z5342335@ad.unsw.edu.au');
  expect(createRequest('POST', SERVER + '/auth/passwordreset/reset/v1', {}, { resetCode: reset + '1', newPassword: '654321' }).statusCode).toStrictEqual(400);// resetCode is not a valid reset code
  expect(createRequest('POST', SERVER + '/auth/passwordreset/reset/v1', {}, { resetCode: reset, newPassword: '12' }).statusCode).toStrictEqual(400);// newPassword is less than 6 characters long
  createRequest('DELETE', SERVER + '/clear/v1', {});
});
