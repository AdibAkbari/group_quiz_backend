// interfaces needed for all files
export interface Users {
  email: string;
  password: string;
  nameFirst: string;
  nameLast: string;
  authUserId: number;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface Quizzes {
  name: string;
  description: string;
  quizId: number;
  creator: number;
  questions: {questions: string, answer: string}[];
  players: {authUserId: number, score: number}[];
  timeCreated: number;
  timeLastEdited: number;

}

export interface Data {
  users: Users[];
  quizzes: Quizzes[];
  quizCount: number;
}

export interface Error {
  error: string
}

// data structure for storing user data and quiz data
let data: Data = {
  users: [],
  quizzes: [],
  quizCount: 0,
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
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
function setData(newData: Data) {
  data = newData;
}

export { getData, setData };
