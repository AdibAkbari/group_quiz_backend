import { Data } from './interfaces';
import fs from 'fs';

// data structure for storing user data and quiz data
let data: Data = {
  users: [],
  quizzes: [],
  quizCount: 0,
  tokens: [],
  trash: [],
  sessions: []
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
function getData() {
  if (fs.existsSync('./database.json')) {
    const dbstr = fs.readFileSync('./database.json');
    data = JSON.parse(String(dbstr));
  }
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: Data) {
  data = newData;
  const jsonstr = JSON.stringify(data);
  fs.writeFileSync('./database.json', jsonstr);
}

export { getData, setData };
