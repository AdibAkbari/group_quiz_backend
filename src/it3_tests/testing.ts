import { getData } from "../dataStore";
import { clearRequest, authRegisterRequest, quizCreateRequest, createQuizQuestionRequest, startSessionRequest, playerJoinRequest, updateSessionStateRequest, playerStatusRequest, playerCurrentQuestionInfoRequest, playerSubmitAnswerRequest, sessionResultsRequest } from "./it3_testRoutes";
import util from 'util';

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

const duration = 1;
const finishCountdown = 150
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
clearRequest();
const token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
const quizId = quizCreateRequest(token, 'quiz1', '').quizId;
const questionId = createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers).questionId;
// createQuizQuestionRequest(quizId, token, 'Question 1', 1, 6, validAnswers);
const sessionId = startSessionRequest(quizId, token, 1).sessionId;

const playerId = playerJoinRequest(sessionId, 'Player').playerId;
updateSessionStateRequest(quizId, sessionId, token, "NEXT_QUESTION");
const questionPosition = playerStatusRequest(playerId).atQuestion;
const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition - 1);
const correctAnswerId = questionInfo.answers[0].answerId;

sleepSync(finishCountdown);
const answerTime = 0.5;
sleepSync(answerTime * 1000);
playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition - 1);

sleepSync(questionInfo.duration * 1000 - answerTime);
updateSessionStateRequest(quizId, sessionId, token, "GO_TO_ANSWER");
updateSessionStateRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");


const data = getData();
console.log("Whole data: \n")
console.log(util.inspect(data, { depth: null }));
console.log("\n\nSession Results: \n")
console.log(util.inspect(sessionResultsRequest(quizId, sessionId, token), { depth: null }));
