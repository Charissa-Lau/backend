import * as type from './types';

// YOU SHOULD MODIFY THIS OBJECT BELOW
let data : type.Data = {
  users: {},
  channels: {},
  tokens: {},
  dms: {},
  standups: {},
  notifications: {},
  resetCodes: {},
  removedUsers: {},
  workspaceStats: {
    channelsExist: [],
    dmsExist: [],
    messagesExist: [],
    utilizationRate: 0,
  }
};

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/

// Use get() to access the data
function getData() : type.Data {
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: type.Data) : void {
  data = newData;
}

export { getData, setData };
