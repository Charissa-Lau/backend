
let data = {
    
	users: {
		user1: {
  			uId: 1,
  			nameFirst: 'Hayden',
  			nameLast: 'Smith',
 			email: 'hayhay123@gmail.com',
  			handleStr: 'haydensmith',
		},

	},
	channels: {
		channel1: {
			channelId: 1,
			name: 'my first channel',
			ownerMembers:[
				{
					uId: 1,
					nameFirst: 'Hayden',
  					nameLast: 'Smith',
 					email: 'hayhay123@gmail.com',
  					handleStr: 'haydensmith',
				}
			],
			allMembers: [
				{
					uId: 1,
					nameFirst: 'Hayden',
					nameLast: 'Smith',
					email: 'hayhay123@gmail.com',
					handleStr: 'haydensmith',
				}
    		
			],
		},
	},
};


[Optional] short description: We decided to use objects to store users and channels, meaning that we are able to design a structure that enables us to have direct access to a particular user or channel, without iterating through the users and channels.
