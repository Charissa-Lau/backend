channelsListV1 ---- If the function fail to find the authorised user in any channel(but with valid user), the function would return {channels:[]}. It is assumed that everytime user call this function, they won't receive error if the authorised user is not part of any channel, instead they will receive an object but with no channel info in it.


channelsListallV1 ---- If no channels exist in the dataStore(but with valid user), the function would return {channels:[]}. It is assumed that once the function is called when no channels can be listed to the user, they will receive an object but with no channel info in it.

channelsCreateV1 --- All channelId should be distinct, so new method is applied to prevent duplicates. It is assumed that once the new channelId is generated, it should differ from any other channelId that exist in dataStore.

authLoginV1 -- All email-password combinations are unique and therefore there doesn't need to be any confirmation beyond someone's email and password

authRegisterV1 -- Emails must be valid (follow the standard format of an email address with no abberations) although do not necessarily need to exist, concatenated handle string must have its length checked after removal of non-alphanumeric characters rather than before

channelMessagesV1 -- channels start value cannot be less than 1, channel messages must return sequentially

