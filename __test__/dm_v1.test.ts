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

describe('Testing dmcreate', () => {
  test('successfully return of createdm', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);

    // createRequest('POST', SERVER + '/channels/create/v3', {}, { token:user.token, name:'', isPublic:true });
    expect(createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds })).toMatchObject({ dmId: expect.any(Number) });
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const _uIds:number[] = [];
    _uIds.push(user2.authUserId);
    expect(request('POST', SERVER + '/dm/create/v2', { json: { uIds: _uIds }, headers: { token: user1.token + user2.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('when any uId in uIds does not refer to a valid user', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const _uIds:number[] = [];
    _uIds.push(user2.authUserId + user1.authUserId + 1);
    expect(request('POST', SERVER + '/dm/create/v2', { json: { uIds: _uIds }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });

  test('when there are duplicate members found in DM', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const _uIds:number[] = [];
    _uIds.push(user2.authUserId);
    _uIds.push(user2.authUserId);
    expect(request('POST', SERVER + '/dm/create/v2', { json: { uIds: _uIds }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
  });
});

describe('Testing dmlist', () => {
  test('successfully list dm', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    let _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm1 = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    _uIds = [];
    const dm2 = createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user2.token }).dms).toContainEqual({ name: 'josephcaspar, yiwenliao, yiwennliaoo', dmId: dm1.dmId });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user2.token }).dms).toContainEqual({ name: 'yiwennliaoo', dmId: dm2.dmId });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user2.token }).dms.length).toStrictEqual(2);
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    let _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    _uIds = [];
    createRequest('POST', SERVER + '/dm/create/v2', { token: user2.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user2.token + user1.token + user3.token + '1' }).statusCode).toStrictEqual(403);
  });
});

describe('Testing dmremove', () => {
  test('successfully remove dm', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user1.token })).toMatchObject({ dms: [{ name: 'josephcaspar, yiwenliao, yiwennliaoo', dmId: dm.dmId }] });
    expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({});

    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user1.token })).toMatchObject({ dms: [] });
  });

  test('when the dmId is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user1.token })).toMatchObject({ dms: [{ name: 'josephcaspar, yiwenliao, yiwennliaoo', dmId: dm.dmId }] });
    expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user1.token }, { dmId: dm.dmId + 1 }).statusCode).toStrictEqual(400);
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/list/v2', { token: user1.token })).toMatchObject({ dms: [{ name: 'josephcaspar, yiwenliao, yiwennliaoo', dmId: dm.dmId }] });
    expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user1.token + user2.token + user3.token + '1' }, { dmId: dm.dmId }).statusCode).toStrictEqual(403);
  });

  test('when authuser is not the owner', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('DELETE', SERVER + '/dm/remove/v2', { token: user2.token }, { dmId: dm.dmId }).statusCode).toStrictEqual(400);
  });
});

describe('Testing dmdetails', () => {
  test('successfully showing brief details', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({
      name: 'josephcaspar, yiwenliao, yiwennliaoo',
      members: [
        {
          email: 'joseph@unsw.edu.au',
          handleStr: 'josephcaspar',
          nameFirst: 'Joseph',
          nameLast: 'Caspar',
          uId: user1.authUserId,
        },
        {
          email: 'YiwenLiao@unsw.edu.au',
          handleStr: 'yiwenliao',
          nameFirst: 'Yiwen',
          nameLast: 'Liao',
          uId: user2.authUserId,
        },
        {
          email: 'YiwennLiaoo@unsw.edu.au',
          handleStr: 'yiwennliaoo',
          nameFirst: 'Yiwenn',
          nameLast: 'Liaoo',
          uId: user3.authUserId,
        }
      ]
    });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user2.token }, { dmId: dm.dmId })).toMatchObject({
      name: 'josephcaspar, yiwenliao, yiwennliaoo',
      members: [
        {
          email: 'joseph@unsw.edu.au',
          handleStr: 'josephcaspar',
          nameFirst: 'Joseph',
          nameLast: 'Caspar',
          uId: user1.authUserId,
        },
        {
          email: 'YiwenLiao@unsw.edu.au',
          handleStr: 'yiwenliao',
          nameFirst: 'Yiwen',
          nameLast: 'Liao',
          uId: user2.authUserId,
        },
        {
          email: 'YiwennLiaoo@unsw.edu.au',
          handleStr: 'yiwennliaoo',
          nameFirst: 'Yiwenn',
          nameLast: 'Liaoo',
          uId: user3.authUserId,
        }
      ]
    });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user3.token }, { dmId: dm.dmId })).toMatchObject({
      name: 'josephcaspar, yiwenliao, yiwennliaoo',
      members: [
        {
          email: 'joseph@unsw.edu.au',
          handleStr: 'josephcaspar',
          nameFirst: 'Joseph',
          nameLast: 'Caspar',
          uId: user1.authUserId,
        },
        {
          email: 'YiwenLiao@unsw.edu.au',
          handleStr: 'yiwenliao',
          nameFirst: 'Yiwen',
          nameLast: 'Liao',
          uId: user2.authUserId,
        },
        {
          email: 'YiwennLiaoo@unsw.edu.au',
          handleStr: 'yiwennliaoo',
          nameFirst: 'Yiwenn',
          nameLast: 'Liaoo',
          uId: user3.authUserId,
        }
      ]
    });
  });

  test('when the dm id is not valid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user1.token }, { dmId: dm.dmId + 1 }).statusCode).toStrictEqual(400);
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user1.token + user2.token + user3.token + '1' }, { dmId: dm.dmId }).statusCode).toStrictEqual(403);
  });

  test('when authuser is not a member', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user3.token }, { dmId: dm.dmId }).statusCode).toStrictEqual(400);
  });
});

describe('Testing dmleave', () => {
  test('successfully leave dm', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });

    expect(createRequest('POST', SERVER + '/dm/leave/v2', { token: user1.token }, { dmId: dm.dmId })).toMatchObject({});
    expect(createRequest('GET', SERVER + '/dm/details/v2', { token: user3.token }, { dmId: dm.dmId })).toMatchObject({
      name: 'josephcaspar, yiwenliao, yiwennliaoo',
      members: [
        {
          email: 'YiwennLiaoo@unsw.edu.au',
          handleStr: 'yiwennliaoo',
          nameFirst: 'Yiwenn',
          nameLast: 'Liaoo',
          uId: user2.authUserId,
        },
        {
          email: 'joseph@unsw.edu.au',
          handleStr: 'josephcaspar',
          nameFirst: 'Joseph',
          nameLast: 'Caspar',
          uId: user3.authUserId,
        }

      ]
    });
  });

  test('when the token is invalid', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(request('POST', SERVER + '/dm/leave/v2', { json: { dmId: dm.dmId }, headers: { token: user1.token + user2.token + user3.token + '1' } }).statusCode).toStrictEqual(403);
  });

  test('when the authuser is not part of dm', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(request('POST', SERVER + '/dm/leave/v2', { json: { dmId: dm.dmId }, headers: { token: user3.token } }).statusCode).toStrictEqual(400);
  });

  test('when dmId does not refer to a valid DM', () => {
    const user1:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwennLiaoo@unsw.edu.au', password: '123456', nameFirst: 'Yiwenn', nameLast: 'Liaoo' });
    const user3:returnUser = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    const _uIds:number[] = [];

    _uIds.push(user2.authUserId);
    _uIds.push(user3.authUserId);
    const dm = createRequest('POST', SERVER + '/dm/create/v2', { token: user1.token }, { uIds: _uIds });
    expect(request('POST', SERVER + '/dm/leave/v2', { json: { dmId: dm.dmId + 1 }, headers: { token: user1.token } }).statusCode).toStrictEqual(400);
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
