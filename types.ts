export type statsCj = {
    numChannelsJoined:number;
    timeStamp:number;
};

export type statsDj = {
    numDmsJoined:number;
    timeStamp:number;
}

export type statsMs = {
    numMessagesSent:number;
    timeStamp:number;
}

export type rawUser = {
    uId: number;
    email: string;
    password: string;
    nameFirst: string;
    nameLast: string;
    handleStr: string;
    permission: number;
    userStats: {
        channelsJoined: statsCj[];
        dmsJoined: statsDj[];
        messagesSent:statsMs[];
        involvementRate: number;
    }
    profileImgUrl: string;
};

export type User = {
    uId: number;
    email: string;
    nameFirst: string;
    nameLast: string;
    handleStr: string;
    profileImgUrl: string;
}

export type React = {
    reactId: number,
    uIds: number[],
    isThisUserReacted: boolean
}

export type Message = {
    messageId: number;
    uId: number;
    message: string;
    timeSent: number;
    reacts: React[],
    isPinned: boolean;
};

export type Channel = {
    channelId: number;
    name: string;
    messages: {
        [index: string]: Message
    };
    isPublic: boolean;
    ownerMembers: rawUser[];
    allMembers: rawUser[];
};

export type Messages = {
    messages: Message[];
    start:number;
    end:number;
};

export type ChannelDetails = {
    name: string;
    isPublic: boolean;
    ownerMembers: User[];
    allMembers: User[];
};

export type channelBriefDetails = {
    channelId:number;
    name:string;
};

export type emptyObject = Record<string, never>;

export type HTTPError = { HTTPError: 'HTTPError' };

export type dm = {
    name: string;
    dmId: number;
    messages: {
        [index: string]: Message,
    };
    ownerMembers: rawUser[];
    allMembers: rawUser[];
};

export type standup = {
    packagedMessage: string;
    timeFinish: number;
};

export type notification = {
    channelId?: number,
    dmId?: number,
    notificationMessage: string
}

export type resetCode = {
    email:string;
};

export type statsCe = {
    numChannelsExist: number;
    timeStamp: number;
};

export type statsDe = {
    numDmsExist: number;
    timeStamp: number;
};

export type statsMe = {
    numMessagesExist: number;
    timeStamp: number;
};

export type Data = {
    users: {
        [index: string]: rawUser
    },
    channels: {
        [index: string]: Channel
    },
    tokens: {
        [index: string]: number
    },
    dms: {
        [index: string]: dm
    },
    standups: {
        [index: string]: standup
    },
    notifications: {
        [index: string]: notification[]
    },
    resetCodes: {
        [index: string]: resetCode
    },
    removedUsers: {
        [index: string]: rawUser// userId as key this time:|
    },
    workspaceStats: {
        channelsExist: statsCe[],
        dmsExist: statsDe[],
        messagesExist: statsMe[],
        utilizationRate:number
    }
};

export type userObject = {
    [index: string]: rawUser
};

export type channelsObject = {
    [index: string]: Channel
}

export type authUserId = { authUserId: number };

export type messageId = { messageId: number };

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type notificationType = 'tag' | 'react' | 'add';
