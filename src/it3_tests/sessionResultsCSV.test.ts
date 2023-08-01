import {
  sessionResultsCSVRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  updateSessionStateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  playerStatusRequest,
  playerCurrentQuestionInfoRequest,
  playerSubmitAnswerRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';
import fs from 'fs';
import config from '../config.json';

const SERVER_URL = `${config.url}:${config.port}`;

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

let token: string;
let quizId: number;
let sessionId: number;
const duration = 2;
const finishCountdown = 150;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 1).sessionId;
});

describe('Error cases', () => {
  test.each([
    { testName: 'token has letters', token: '5436h8j6' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
    { testName: 'token has decimal point', token: '53.74' },
    { testName: 'token has negative sign', token: '-37294' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => sessionResultsCSVRequest(quizId, sessionId, token)).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => sessionResultsCSVRequest(quizId, sessionId, token + 1)).toThrow(HTTPError[403]);
  });

  test('quizId not a valid quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(() => sessionResultsCSVRequest(quizId + 1, sessionId, token)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => sessionResultsCSVRequest(quizId, sessionId, token2)).toThrow(HTTPError[400]);
  });

  test('Session Id does not refer to a valid session within this quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(() => sessionResultsCSVRequest(quizId, sessionId + 1, token)).toThrow(HTTPError[400]);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    expect(() => sessionResultsCSVRequest(quizId, sessionId, token)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('valid output one question, no player', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const expected = [
      ['Player', 'question1score', 'question1rank'],
    ];

    const csvUrl = sessionResultsCSVRequest(quizId, sessionId, token).url;
    const filePath = getPathFromUrl(csvUrl);
    const received = readCSVFile(filePath);

    expect(received).toStrictEqual(expected);
  });

  test('valid output 3 players, two questions', () => {
    createQuizQuestionRequest(quizId, token, 'Question 2', duration, 6, validAnswers);
    const session2Id = startSessionRequest(quizId, token, 3).sessionId;

    const playerId = playerJoinRequest(session2Id, 'Chicken').playerId;
    const player2Id = playerJoinRequest(session2Id, 'Dog').playerId;
    playerJoinRequest(session2Id, 'Player');

    updateSessionStateRequest(quizId, session2Id, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion - 1;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);

    let correctAnswerId = questionInfo.answers[0].answerId;
    sleepSync(finishCountdown);
    const answerTime = 1;
    sleepSync(answerTime * 1000);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    playerSubmitAnswerRequest([correctAnswerId], player2Id, questionPosition);

    sleepSync(questionInfo.duration * 1000 - answerTime);

    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, session2Id, token, 'NEXT_QUESTION');

    const question2Info = playerCurrentQuestionInfoRequest(playerId, questionPosition + 1);
    correctAnswerId = question2Info.answers[0].answerId;
    const incorrectAnswerId = question2Info.answers[1].answerId;

    sleepSync(finishCountdown);
    sleepSync(answerTime * 1000);

    playerSubmitAnswerRequest([incorrectAnswerId], playerId, questionPosition + 1);
    playerSubmitAnswerRequest([correctAnswerId], player2Id, questionPosition + 1);

    sleepSync(questionInfo.duration * 1000 - answerTime);
    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_ANSWER');

    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_FINAL_RESULTS');

    const expected = [
      ['Player', 'question1score', 'question1rank', 'question2score', 'question2rank'],
      ['Chicken', '6', '1', '0', '2'],
      ['Dog', '3', '2', '6', '1'],
      ['Player', '0', '0', '0', '0']
    ];

    const csvUrl = sessionResultsCSVRequest(quizId, session2Id, token).url;
    const filePath = getPathFromUrl(csvUrl);
    const received = readCSVFile(filePath);

    expect(received).toStrictEqual(expected);
  });
});

function getPathFromUrl(inputString: string): string {
  if (inputString.startsWith(SERVER_URL)) {
    return './' + inputString.slice(SERVER_URL.length);
  }
  return inputString;
}

// Function to read the CSV file and return the data as an array of objects
function readCSVFile(filePath: string): string[][] {
  const csvData: string = fs.readFileSync(filePath, 'utf-8');
  const rows: string[] = csvData.split('\n');

  const header: string[] = rows[0].split(',');
  const csvRows: string[][] = [header];

  for (let i = 1; i < rows.length; i++) {
    const values: string[] = rows[i].split(',');
    csvRows.push(values);
  }

  return csvRows;
}
