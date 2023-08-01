import { getData, setData } from './dataStore';
import { isValidTokenStructure, isTokenLoggedIn, isValidQuizId, isValidCreator, isValidSessionId } from './helper';
import { Session, SessionStatus, Timers } from './interfaces';
import HTTPError from 'http-errors';

const COUNTDOWN = 150;
let timers:Timers[] = [];

export function startSession(quizId: number, token: string, autoStartNum: number): { sessionId: number} {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }
  if (autoStartNum > 50 || autoStartNum < 0) {
    throw HTTPError(400, 'Invalid autostart number');
  }
  const data = getData();
  if (data.sessions.filter(state => state.sessionState !== 'END').length >= 10) {
    throw HTTPError(400, 'Too many sessions currently running');
  }

  const quiz = data.quizzes.find(id => id.quizId === quizId);
  if (quiz.numQuestions === 0) {
    throw HTTPError(400, 'No questions in quiz');
  }
  const sessionId = data.sessions.length + 1;

  const session: Session = {
    sessionId: sessionId,
    sessionState: 'LOBBY',
    autoStartNum: autoStartNum,
    atQuestion: 0,
    players: [],
    metadata: quiz,
  };

  data.sessions.push(session);
  setData(data);

  return { sessionId: sessionId };
}

export function updateSessionState(quizId: number, sessionId: number, token: string, action: string): Record<string, never> {
  // error checking
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Invalid Session Id');
  }

  const actions = ['NEXT_QUESTION', 'GO_TO_ANSWER', 'GO_TO_FINAL_RESULTS', 'END'];
  if (actions.find(actions => actions === action) === undefined) {
    throw HTTPError(400, 'Invalid action');
  }

  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  console.log(session.sessionState);

  // action: next_question
  if (action === 'NEXT_QUESTION') {
    if (session.sessionState !== 'LOBBY' && session.sessionState !== 'QUESTION_CLOSE' && session.sessionState !== 'ANSWER_SHOW') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.atQuestion === session.metadata.numQuestions) {
      throw HTTPError(400, 'No more questions');
    }

    session.sessionState = 'QUESTION_COUNTDOWN';
    session.atQuestion++;
    
    const timer = timers.find(id => id.sessionId === sessionId);
    const timerId = setTimeout(questionOpen, COUNTDOWN, sessionId);
    if(timer !== undefined) {
      timer.timer = timerId; 
    } else {
      timers.push({
        sessionId: sessionId,
        timer: timerId
      })
    }
  }

  // action: go_to_answer
  if (action === 'GO_TO_ANSWER') {
    if (session.sessionState !== 'QUESTION_OPEN' && session.sessionState !== 'QUESTION_CLOSE') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.sessionState === 'QUESTION_OPEN') {
      const timer = timers.find(id => id.sessionId === sessionId);
      clearTimeout(timer.timer);
    }
    session.sessionState = 'ANSWER_SHOW';
    calculateQuestionPoints(sessionId);
  }

  // action: go_to_final_results
  if (action === 'GO_TO_FINAL_RESULTS') {
    if (session.sessionState !== 'QUESTION_CLOSE' && session.sessionState !== 'ANSWER_SHOW') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    session.sessionState = 'FINAL_RESULTS';
  }

  // action: end
  if (action === 'END') {
    if (session.sessionState === 'END') {
      throw HTTPError(400, 'Action enum cannot be applied in current state');
    }
    if (session.sessionState === 'QUESTION_OPEN' || session.sessionState === 'QUESTION_COUNTDOWN') {
      const timer = timers.find(id => id.sessionId === sessionId);
      clearTimeout(timer.timer);
    }
    session.sessionState = 'END';
  }

  setData(data);

  return {};
}

function questionOpen(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  session.sessionState = 'QUESTION_OPEN';
  session.currentQuestionStartTime = Math.floor(Date.now() / 1000);
  const duration = session.metadata.questions[session.atQuestion - 1].duration;

  const timerId = setTimeout(questionClose, duration * 1000, sessionId);
  let timer = timers.find(id => id.sessionId === sessionId);
  timer.timer = timerId; 
  setData(data);
}

function questionClose(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);
  session.sessionState = 'QUESTION_CLOSE';
  setData(data);
}

function calculateQuestionPoints(sessionId: number) {
  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  const question = session.metadata.questions[session.atQuestion - 1];
  const questionId = question.questionId;
  let correctAnswers = question.answers.filter(answer => (answer.correct === true));

  const sessionPlayers = data.players.filter(session => session.sessionId === sessionId);

  for (const player in sessionPlayers) {
    const currentAnswer = sessionPlayers[player].questionResponse.find(id => id.questionId === questionId);
    if (currentAnswer === undefined || currentAnswer.playerAnswers !== correctAnswers) {
      sessionPlayers.splice(parseInt(player), 1);
    }
  }

  sessionPlayers.sort(function(a, b) {
    const timeA = a.questionResponse.find(id => id.questionId === questionId).answerTime;
    const timeB = b.questionResponse.find(id => id.questionId === questionId).answerTime;
    if (timeA < timeB) {
      return -1;
    }
    return 1;
  });

  const points = question.points;
  let counter = 1;
  for (const player of sessionPlayers) {
    const playerInfo = data.players.find(id => id.playerId === player.playerId);
    const point = points * 1 / counter;
    playerInfo.score += point;
    playerInfo.questionResponse.find(id => id.questionId === questionId).points = point;
    counter++;
  }
  setData(data);
}

export function clearTimers() {
    for (const timer of timers) {
      clearTimeout(timer.timer);
    }
}

export function sessionStatus(token: string, quizId: number, sessionId: number): SessionStatus {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }
  if (!isValidQuizId(quizId) || !isValidCreator(quizId, token)) {
    throw HTTPError(400, 'Invalid QuizId');
  }
  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Invalid: Session Id');
  }

  const data = getData();
  const session = data.sessions.find(id => id.sessionId === sessionId);

  const playerNames = session.players.sort();
  const metaData = session.metadata;
  delete metaData.creator;
  delete metaData.questionCount;

  return {
    state: session.sessionState,
    atQuestion: session.atQuestion,
    players: playerNames,
    metadata: metaData,
  };
}
