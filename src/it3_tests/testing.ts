import { getData } from '../dataStore';
import { clearRequest, authRegisterRequest, quizCreateRequest, createQuizQuestionRequest, startSessionRequest, playerJoinRequest, updateSessionStateRequest, playerStatusRequest, playerCurrentQuestionInfoRequest, playerSubmitAnswerRequest, sessionResultsRequest, sessionResultsCSVRequest } from './it3_testRoutes';
import util from 'util';

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

const duration = 2;
const finishCountdown = 150;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
clearRequest();
const token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
const quizId = quizCreateRequest(token, 'quiz1', '').quizId;
createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers);
createQuizQuestionRequest(quizId, token, 'Question 2', duration, 6, validAnswers);
const sessionId = startSessionRequest(quizId, token, 2).sessionId;

const playerId = playerJoinRequest(sessionId, 'Chicken').playerId;
const player2 = playerJoinRequest(sessionId, 'Dog').playerId;
playerJoinRequest(sessionId, 'Player');

updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
const questionPosition = playerStatusRequest(playerId).atQuestion - 1;
const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);

const correctAnswerId = questionInfo.answers[0].answerId;
sleepSync(finishCountdown);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
const answerTime = 1;
sleepSync(answerTime * 1000);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
playerSubmitAnswerRequest([correctAnswerId], player2, questionPosition);

sleepSync(questionInfo.duration * 1000 - answerTime);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);

updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');

const question2Info = playerCurrentQuestionInfoRequest(playerId, questionPosition + 1);
const incorrectAnswerId = question2Info.answers[1].answerId;

sleepSync(finishCountdown);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
sleepSync(answerTime * 1000);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);

playerSubmitAnswerRequest([incorrectAnswerId], playerId, questionPosition + 1);
playerSubmitAnswerRequest([correctAnswerId], player2, questionPosition + 1);
sleepSync(questionInfo.duration * 1000 - answerTime);
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);
updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);

updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
console.log(getData().sessions.find(session => session.sessionId === sessionId).sessionState);

const data = getData();
sessionResultsCSVRequest(quizId, sessionId, token);
console.log('Whole data: \n');
console.log(util.inspect(data, { depth: null }));
console.log('\n\nSession Results: \n');
console.log(util.inspect(sessionResultsRequest(quizId, sessionId, token), { depth: null }));
