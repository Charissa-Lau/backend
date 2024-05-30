import { createRequest } from '../other';
import { SERVER } from '../root';
import request from 'sync-request';

describe('Messages', () => {
  beforeEach(() => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });

  afterEach(() => {
    createRequest('DELETE', SERVER + '/clear/v1', {});
  });

  test('should add message to defined channel if token holder is an authorized user', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId].message).toStrictEqual(message);
  });

  test('should return error if token holder does not exist', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    expect(request('POST', SERVER + '/message/send/v2', { json: { channelId: channelId, message: message }, headers: { token: '' } }).statusCode).toStrictEqual(403);
  });

  test('should return error if token holder is not member of channel', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    const incorrectToken = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome1@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;

    expect(request('POST', SERVER + '/message/send/v2', { json: { channelId: channelId, message: message }, headers: { token: incorrectToken } }).statusCode).toStrictEqual(403);
  });

  test('should return error channel does not exist', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const message = 'This is a normal valid message';

    expect(request('POST', SERVER + '/message/send/v2', { json: { channelId: 3, message: message }, headers: { token: token } }).statusCode).toStrictEqual(400);
  });

  test('should return error if message length is 0', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = '';

    expect(request('POST', SERVER + '/message/send/v2', { json: { channelId: channelId, message: message }, headers: { token: token } }).statusCode).toStrictEqual(400);
  });

  test('should return error if message length exceeds 1,000', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'a'.repeat(1001);

    expect(request('POST', SERVER + '/message/send/v2', { json: { channelId: channelId, message: message }, headers: { token: token } }).statusCode).toStrictEqual(400);
  });

  // EDIT

  test('should edit message with messageId if token holder is an authorized user', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';
    const newMessage = 'This is an entirely different message';

    const m = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    const { messageId } = m;
    createRequest('PUT', SERVER + '/message/edit/v2', { token: token }, { messageId: messageId, message: newMessage });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId].message).toStrictEqual(newMessage);
  });

  test('should return error if token holder does not exist when trying to edit', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';
    const newMessage = 'This is an entirely different message';

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(request('PUT', SERVER + '/message/edit/v2', { json: { messageId: messageId, message: newMessage }, headers: { token: '' } }).statusCode).toStrictEqual(403);
  });

  test('should return error if token holder is not member of channel', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';
    const newMessage = 'This is an entirely different message';

    const incorrectToken = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome1@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(request('PUT', SERVER + '/message/edit/v2', { json: { messageId: messageId, message: newMessage }, headers: { token: incorrectToken } }).statusCode).toStrictEqual(403);
  });

  test('should return error message does not exist', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const newMessage = 'This is a normal valid message';

    expect(request('PUT', SERVER + '/message/edit/v2', { json: { messageId: '', message: newMessage }, headers: { token: token } }).statusCode).toStrictEqual(400);
  });

  test('should delete message if edited message length is 0', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';
    const newMessage = '';

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId]).toBeDefined();
    createRequest('PUT', SERVER + '/message/edit/v2', { token: token }, { messageId: messageId, message: newMessage });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId]).toBeUndefined();
  });

  test('should return error if message length exceeds 1,000', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';
    const newMessage = 'a'.repeat(1001);

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('PUT', SERVER + '/message/edit/v2', { token: token }, { messageId: messageId, message: newMessage }).statusCode).toStrictEqual(400);
  });

  test('should delete defined message if requested by message sender', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId]).toBeDefined();
    createRequest('DELETE', SERVER + '/message/remove/v2', { token: token }, { messageId: messageId });
    expect(createRequest('GET', SERVER + '/data/get', {}).channels[channelId].messages[messageId]).toBeUndefined();
  });

  test('should return error if messageId does not exist', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(request('DELETE', SERVER + '/message/remove/v2', { qs: { messageId: '' }, headers: { token: token } }).statusCode).toStrictEqual(400);
  });

  test('should return error if token does not exist', () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(request('DELETE', SERVER + '/message/remove/v2', { qs: { messageId: messageId }, headers: { token: '' } }).statusCode).toStrictEqual(403);
  });

  test("should return error if token is not sender's token", () => {
    const token = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;
    const { channelId } = createRequest('POST', SERVER + '/channels/create/v3', { token: token }, { name: 'channel', isPublic: true });
    const message = 'This is a normal valid message';

    const incorrectToken = createRequest('POST', SERVER + '/auth/register/v3', {}, { email: 'theawesome1@gmail.com', password: 'password', nameFirst: 'Will', nameLast: 'Kennedy' }).token;

    const { messageId } = createRequest('POST', SERVER + '/message/send/v2', { token: token }, { channelId: channelId, message: message });
    expect(request('DELETE', SERVER + '/message/remove/v2', { qs: { messageId: messageId }, headers: { token: incorrectToken } }).statusCode).toStrictEqual(403);
  });
});
