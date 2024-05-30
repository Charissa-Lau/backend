import { createRequest } from '../other';
import { SERVER } from '../root';

jest.setTimeout(30000);

type returnUser = {
    token: string;
    authUserId: number;
};

type returnChannel = {
    channelId:number;
};
// beforeEach(() => {
// createRequest('DELETE', SERVER + '/clear/v1', {});
// });

// afterEach(() => {
// createRequest('DELETE', SERVER + '/clear/v1', {});
// });
//    /data/get
type returnTime = {
    timeFinish:number;
};

describe('Testing standup functionality', () => {
  let user1:returnUser;
  let user2:returnUser;
  let channel:returnChannel;
  let timeF:returnTime;

  test('successfully starting and finishing standup', async () => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
    user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });

    expect(createRequest('POST', SERVER + '/channel/invite/v3', { token: user1.token }, { channelId: channel.channelId, uId: user2.authUserId })).toMatchObject({});

    timeF = createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token }, { channelId: channel.channelId, length: 2 });

    expect(timeF).toMatchObject({ timeFinish: expect.any(Number) });

    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user1.token }, { channelId: channel.channelId, message: 'You are awesome!' })).toMatchObject({});
    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user2.token }, { channelId: channel.channelId, message: 'We are all good!' })).toMatchObject({});

    expect(createRequest('GET', SERVER + '/standup/active/v1', { token: user2.token }, { channelId: channel.channelId })).toMatchObject({ isActive: true, timeFinish: expect.any(Number) });

    await new Promise(r => setTimeout(r, 3000));
  });
  test('successfully finishing standup', () => {
    expect(createRequest('GET', SERVER + '/channel/messages/v3', { token: user2.token }, { channelId: channel.channelId, start: 0 })).toStrictEqual({ messages: [{ messageId: expect.any(Number), uId: user1.authUserId, message: 'yiwenliao: You are awesome!\njosephcaspar: We are all good!', timeSent: timeF.timeFinish, isPinned: false, reacts: [] }], start: 0, end: -1 });
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});

describe('Testing standup handling error', () => {
  test('successfully sending http errors', async () => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
    const user1 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'YiwenLiao@unsw.edu.au', password: '123456', nameFirst: 'Yiwen', nameLast: 'Liao' });
    const user2 = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'joseph@unsw.edu.au', password: '123456', nameFirst: 'Joseph', nameLast: 'Caspar' });

    const channel = createRequest('POST', SERVER + '/channels/create/v3', { token: user1.token }, { name: 'channel1', isPublic: true });

    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user1.token }, { channelId: channel.channelId, message: 'Hi!' }).statusCode).toStrictEqual(400);// an active standup is not currently running in the channel
    expect(createRequest('GET', SERVER + '/standup/active/v1', { token: user1.token }, { channelId: channel.channelId })).toMatchObject({ isActive: false, timeFinish: null });
    expect(createRequest('GET', SERVER + '/standup/active/v1', { token: user1.token }, { channelId: channel.channelId + 1 }).statusCode).toStrictEqual(400);
    expect(createRequest('GET', SERVER + '/standup/active/v1', { token: user1.token + '1' }, { channelId: channel.channelId }).statusCode).toStrictEqual(403);
    expect(createRequest('GET', SERVER + '/standup/active/v1', { token: user2.token }, { channelId: channel.channelId }).statusCode).toStrictEqual(403);

    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token + '1' }, { channelId: channel.channelId + 1, length: 1 }).statusCode).toStrictEqual(403);
    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token }, { channelId: channel.channelId + 1, length: 1 }).statusCode).toStrictEqual(400); // channelId is invalid
    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token }, { channelId: channel.channelId, length: -2 }).statusCode).toStrictEqual(400);// length is invalid
    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user2.token }, { channelId: channel.channelId, length: 1 }).statusCode).toStrictEqual(403);// channelId is valid and the authorised user is not a member of the channel
    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token }, { channelId: channel.channelId, length: 2 })).toMatchObject({ timeFinish: expect.any(Number) });// normal create
    expect(createRequest('POST', SERVER + '/standup/start/v1', { token: user1.token }, { channelId: channel.channelId, length: 1 }).statusCode).toStrictEqual(400);// standup already exist

    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user1.token + '1' }, { channelId: channel.channelId, message: 'You are awesome!' }).statusCode).toStrictEqual(403);// token invalid
    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user1.token }, { channelId: channel.channelId + '1', message: 'You are awesome!' }).statusCode).toStrictEqual(400);// channelId invalid
    const newMessage = 'a'.repeat(1001);
    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user1.token }, { channelId: channel.channelId, message: newMessage }).statusCode).toStrictEqual(400);// length > 1000
    expect(createRequest('POST', SERVER + '/standup/send/v1', { token: user2.token }, { channelId: channel.channelId, message: 'Hi!' }).statusCode).toStrictEqual(403);// not a member
    await new Promise(r => setTimeout(r, 3000));
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });
});
