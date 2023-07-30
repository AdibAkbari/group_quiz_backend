import { getData, setData } from './dataStore';
import { isValidTokenStructure, isTokenLoggedIn, isValidQuizId, isValidCreator, isValidSessionId } from './helper';
import { Session, SessionStatus, SessionResults } from './interfaces';
import HTTPError from 'http-errors';

export function startSession(quizId: number, token: string, autoStartNum: number): { sessionId: number } {
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

  return {
    state: session.sessionState,
    atQuestion: session.atQuestion,
    players: playerNames,
    metadata: session.metadata,
  };
}

export function sessionResults(quizId: number, sessionId: number, token: string): SessionResults {
  if (!isValidTokenStructure(token)) {
    throw HTTPError(401, 'Token is not a valid structure');
  }
  if (!isTokenLoggedIn(token)) {
    throw HTTPError(403, 'Token is not logged in');
  }

  if (!isValidQuizId(quizId)) {
    throw HTTPError(400, 'invalid quiz Id');
  }

  if (!isValidCreator(quizId, token)) {
    throw HTTPError(400, 'quizId does not refer to a quiz that this user owns');
  }

  if (!isValidSessionId(sessionId, quizId)) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  const data = getData();

  const session = data.sessions.find(session => session.sessionId === sessionId);

  if (session.sessionState !== 'FINAL_RESULTS') {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const playerList = [];
  // go through players in session and get actual info from players in data by matching player name
  for (const playerName of session.players) {
    const player = data.players.find(player => player.name === playerName);
    playerList.push(player);
  }

  const mappedPlayers = playerList.map(({ name, score }) => ({ name, score }));
  const rankedPlayers = mappedPlayers.sort((player1, player2) => {
    return player2.score - player1.score;
  });

  const questionResults = [];

  for (const question of session.metadata.questions) {
    // Reset arrays and counters for each question
    let totalAnswerTime = 0;
    let numPlayers = 0;
    let numCorrectPlayers = 0;

    const questionCorrectBreakdown = [];
    // set to keep track of which players have been added to counts already
    const addedPlayers = new Set();

    for (const answer of question.answers) {
      const playersCorrect = [];

      for (const player of playerList) {
        const questionResponse = player.questionResponse.find(
          (questionResponse) => questionResponse.questionId === question.questionId
        );

        if (questionResponse !== undefined) {
          if (answer.correct && questionResponse.playerAnswers.includes(answer.answerId)) {
            playersCorrect.push(player.name);
          }
          if (!addedPlayers.has(player.name)) {
            totalAnswerTime += questionResponse.answerTime;
            numPlayers++;
            addedPlayers.add(player.name);

            if (questionResponse.points !== 0) {
              numCorrectPlayers++;
            }
          }
        }
      }
      // pushes to list for each correct answer after adding all correct players to playerCorrect
      if (answer.correct) {
        questionCorrectBreakdown.push({
          answerId: answer.answerId,
          playersCorrect: playersCorrect
        });
      }
    }
    questionResults.push({
      questionId: question.questionId,
      questionCorrectBreakdown: questionCorrectBreakdown,
      averageAnswerTime: totalAnswerTime / numPlayers,
      percentCorrect: Math.round((100 * numCorrectPlayers) / numPlayers)
    });
  }

  return {
    usersRankedByScore: rankedPlayers,
    questionResults: questionResults
  };
}
