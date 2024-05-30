import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import HTTPErrorHandler from 'middleware-http-errors';
import { usersAllV1, userProfileV3, usersStatsV1, userStatsV1 } from './users';
import { setUserEmailV1, setUserHandleV1, setUserNameV1, adminUserRemoveV1, setUserProfilePhotoV1, adminUserpermissionChangeV1 } from './user';
import { authLoginV2, authRegisterV2, authLogoutV1, authPasswordresetRequestV1, authPasswordresetResetV1 } from './auth';
import { channelsCreateV2, channelsListAllV2, channelsListV2 } from './channels';
import { channelJoinV2, channelMessagesV2, channelDetailsV2, channelInviteV2 } from './channel';
import { channelLeaveV1, channelAddOwnerV1, channelRemoveOwnerV1 } from './channelV1';
import { removeMessageV1, editMessageV1, sendMessageV1, sendDMV1, messageSendlaterV1, messageSendlaterdmV1, messageReactV1, messageUnreactV1, messagePinV1, messageUnpinV1, messageShareV1 } from './message';
import { dmCreateV1, dmListV1, dmRemoveV1, dmDetailsV1, dmLeaveV1 } from './dm_v1';
import { standupStartV1, standupActiveV1, standupSendV1 } from './standup';
import { getData, setData } from './dataStore';
import { clearV1 } from './other';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { dmMessagesV1 } from './dm';
import { searchV1 } from './search';
import { getNotifications } from './notification';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// for logging HTTPErrors (print to terminal)
app.use(morgan('dev'));

app.get('/data/get', (req: Request, res: Response, next) => {
  res.json(getData());
});

app.delete('/clear/v1', (req: Request, res: Response, next) => {
  clearV1();
  res.status(200).json({});
});

app.get('/clear', (req: Request, res: Response, next) => {
  clearV1();
  res.status(200).json({});
});

app.post('/auth/login/v3', (req: Request, res: Response, next) => {
  const { email, password } = req.body;

  res.json(authLoginV2(email, password));
});

app.post('/auth/register/v3', (req: Request, res: Response, next) => {
  const { email, password, nameFirst, nameLast } = req.body;

  res.json(authRegisterV2(email, password, nameFirst, nameLast));
});

app.post('/channels/create/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { name, isPublic } = req.body;

  token = <string> token;
  const booleanValue = JSON.parse(isPublic);

  res.json(channelsCreateV2(token, name, booleanValue));
});

app.get('/channels/list/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string> token;

  res.json(channelsListV2(token));
});

app.get('/channels/listAll/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string> token;

  res.json(channelsListAllV2(token));
});

app.get('/channel/details/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId } = req.query;

  token = <string> token;
  const _channelId : number = <number>parseInt(channelId as string);

  res.json(channelDetailsV2(token, _channelId));
});

app.post('/channel/join/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId } = req.body;

  token = <string> token;
  const _channelId:number = <number>parseInt(channelId as string);

  res.json(channelJoinV2(token, _channelId));
});

app.post('/channel/invite/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId, uId } = req.body;

  token = <string>token;
  const _channelId:number = <number>parseInt(channelId as string);
  const _uId:number = <number>parseInt(uId as string);

  res.json(channelInviteV2(token, _channelId, _uId));
});

app.get('/channel/messages/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId, start } = req.query;
  token = <string>token;
  const _channelId:number = <number>parseInt(channelId as string);
  const _start:number = <number>parseInt(start as string);

  res.json(channelMessagesV2(token, _channelId, _start));
});

app.get('/user/profile/v3', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { uId } = req.query;
  token = <string>token;
  const _uId : number = parseInt(uId as string);

  res.json(userProfileV3(token, _uId));
});

app.post('/auth/logout/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string>token;
  res.json(authLogoutV1(token));
});

app.post('/channel/leave/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId } = req.body;

  token = <string>token;
  const _channelId:number = <number>parseInt(channelId as string);

  res.json(channelLeaveV1(token, _channelId));
});

app.post('/channel/addowner/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId, uId } = req.body;
  token = <string>token;
  const _channelId:number = <number>parseInt(channelId as string);
  const _uId:number = <number>parseInt(uId as string);
  res.json(channelAddOwnerV1(token, _channelId, _uId));
});

app.post('/channel/removeowner/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId, uId } = req.body;
  token = <string>token;
  const _channelId:number = <number>parseInt(channelId as string);
  const _uId:number = <number>parseInt(uId as string);
  res.json(channelRemoveOwnerV1(token, _channelId, _uId));
});

app.post('/dm/create/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { uIds } = req.body;
  token = <string>token;
  // constructing uIds
  const _uIds:number[] = [];
  for (const i in uIds) {
    _uIds.push(parseInt(uIds[i]));
  }

  res.json(dmCreateV1(token, _uIds));
});

app.get('/dm/list/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string>token;
  res.json(dmListV1(token));
});

app.delete('/dm/remove/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { dmId } = req.query;

  token = <string>token;
  const _dmId = <number>parseInt(dmId as string);
  res.json(dmRemoveV1(token, _dmId));
});

app.get('/dm/details/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { dmId } = req.query;

  token = <string>token;
  const _dmId = <number>parseInt(dmId as string);
  res.json(dmDetailsV1(token, _dmId));
});

app.post('/dm/leave/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { dmId } = req.body;

  token = <string>token;
  const _dmId = <number>parseInt(dmId as string);
  res.json(dmLeaveV1(token, _dmId));
});

app.get('/dm/messages/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { dmId, start } = req.query;

  token = <string>token;
  const _dmId = <number>parseInt(dmId as string);
  const _start = <number>parseInt(start as string);
  res.json(dmMessagesV1(token, _dmId, _start));
});

app.get('/users/all/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string> token;

  res.json(usersAllV1(token));
});

app.put('/user/profile/setname/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { nameFirst, nameLast } = req.body;
  token = <string>token;
  nameFirst = <string>nameFirst;
  nameLast = <string>nameLast;
  res.json(setUserNameV1(token, nameFirst, nameLast));
});

app.put('/user/profile/setemail/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { email } = req.body;
  token = <string> token;
  email = <string> email;
  res.json(setUserEmailV1(token, email));
});

app.put('/user/profile/sethandle/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { handleStr } = req.body;
  token = <string> token;
  handleStr = <string> handleStr;
  res.json(setUserHandleV1(token, handleStr));
});

app.post('/message/send/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { channelId, message } = req.body;

  channelId = <number> parseInt(channelId as string);
  token = <string> token;

  res.json(sendMessageV1(token, channelId, message));
});

app.delete('/message/remove/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { messageId } = req.query;

  token = <string> token;
  const _messageId : number = <number> parseInt(messageId as string);

  res.json(removeMessageV1(token, _messageId));
});

app.put('/message/edit/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { messageId, message } = req.body;

  token = <string> token;
  const _messageId : number = <number> parseInt(messageId as string);

  res.json(editMessageV1(token, _messageId, message));
});

app.post('/message/senddm/v2', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { dmId, message } = req.body;

  token = <string> token;
  dmId = <number> parseInt(dmId as string);

  res.json(sendDMV1(token, dmId, message));
});

app.post('/message/share/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { ogMessageId, message, channelId, dmId } = req.body;

  token = <string> token;
  const _ogMessageId = <number> parseInt(ogMessageId as string);
  message = <string>message;
  const _channelId = <number> parseInt(channelId as string);
  const _dmId = <number> parseInt(dmId as string);

  res.json(messageShareV1(token, _ogMessageId, message, _channelId, _dmId));
});

app.post('/standup/start/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId, length } = req.body;

  token = <string> token;
  const _channelId = <number> parseInt(channelId as string);
  const _length = <number> parseInt(length as string);

  res.json(standupStartV1(token, _channelId, _length));
});

app.get('/standup/active/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { channelId } = req.query;

  token = <string> token;
  const _channelId = <number> parseInt(channelId as string);

  res.json(standupActiveV1(token, _channelId));
});

app.post('/standup/send/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { channelId, message } = req.body;

  token = <string> token;
  const _channelId = <number> parseInt(channelId as string);
  message = <string> message;

  res.json(standupSendV1(token, _channelId, message));
});

app.post('/message/sendlater/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { channelId, message, timeSent } = req.body;

  token = <string> token;
  const _channelId = <number> parseInt(channelId as string);
  const _timeSent = <number> parseInt(timeSent as string);
  message = <string> message;

  res.json(messageSendlaterV1(token, _channelId, message, _timeSent));
});

app.post('/message/sendlaterdm/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { dmId, message, timeSent } = req.body;

  token = <string> token;
  const _dmId = <number> parseInt(dmId as string);
  const _timeSent = <number> parseInt(timeSent as string);
  message = <string> message;

  res.json(messageSendlaterdmV1(token, _dmId, message, _timeSent));
});

app.post('/message/react/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { messageId, reactId } = req.body;

  token = <string> token;
  messageId = <number> parseInt(messageId as string);
  reactId = <number> parseInt(reactId as string);

  res.json(messageReactV1(token, messageId, reactId));
});

app.post('/message/unreact/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { messageId, reactId } = req.body;

  token = <string> token;
  messageId = <number> parseInt(messageId as string);
  reactId = <number> parseInt(reactId as string);

  res.json(messageUnreactV1(token, messageId, reactId));
});

app.post('/message/pin/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { messageId } = req.body;

  token = <string> token;
  messageId = <number> parseInt(messageId as string);

  res.json(messagePinV1(token, messageId));
});

app.post('/message/unpin/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { messageId } = req.body;

  token = <string> token;
  messageId = <number> parseInt(messageId as string);

  res.json(messageUnpinV1(token, messageId));
});

app.post('/auth/passwordreset/request/v1', (req: Request, res: Response, next) => {
  const { email } = req.body;
  res.json(authPasswordresetRequestV1(email));
});

app.post('/auth/passwordreset/reset/v1', (req: Request, res: Response, next) => {
  const { resetCode, newPassword } = req.body;
  res.json(authPasswordresetResetV1(resetCode, newPassword));
});

app.delete('/admin/user/remove/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { uId } = req.query;
  token = <string>token;
  const _uId = <number> parseInt(uId as string);
  res.json(adminUserRemoveV1(token, _uId));
});

app.get('/user/stats/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  token = <string>token;
  res.json(userStatsV1(token));
});

app.get('/search/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  let { queryStr } = req.query;

  token = <string> token;
  queryStr = <string> queryStr;

  res.json(searchV1(token, queryStr));
});

app.get('/users/stats/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  token = <string>token;
  res.json(usersStatsV1(token));
});

app.get('/notifications/get/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;

  token = <string> token;

  res.json(getNotifications(token));
});

app.post('/user/profile/uploadphoto/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;

  token = <string> token;

  res.json(setUserProfilePhotoV1(token, imgUrl, xStart, yStart, xEnd, yEnd));
});

app.get('/tmp/:filename', (req: Request, res: Response, next) => {
  const fileName = req.params.filename;

  res.sendFile(join(__dirname, 'tmp', fileName));
});

app.post('/admin/userpermission/change/v1', (req: Request, res: Response, next) => {
  let { token } = req.headers;
  const { uId, permissionId } = req.body;
  token = <string>token;
  const _uId = <number>parseInt(uId as string);
  const _permissionId = <number>parseInt(permissionId as string);

  res.json(adminUserpermissionChangeV1(token, _uId, _permissionId));
});

// handles HTTPErrors nicely
app.use(HTTPErrorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server listening on port ${PORT} at ${HOST}`);
  const file = readFileSync(join(__dirname, 'dataFile.json'), { encoding: 'utf8' });
  setData(JSON.parse(file));
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    writeFileSync(join(__dirname, 'dataFile.json'), JSON.stringify(getData()), { encoding: 'utf8' });
    console.log('Shutting down server gracefully.');
  });
});
