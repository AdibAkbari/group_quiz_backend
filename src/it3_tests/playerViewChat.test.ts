import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  startSessionRequest,
  playerJoinRequest,
  // sessionUpdateRequest,
  playerSendChatRequest,
  playerViewChatRequest,
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
let player;
let playerId: number;
// let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
  player = playerJoinRequest(sessionId, 'Player One');
  playerId = player.playerId;
});

test('Error Case: playerId does not exist', () => {
  expect(() => playerViewChatRequest(playerId + 1)).toThrow(HTTPError[400]);
});

describe('Success Cases', () => {
	test('no messages sent', () => {
		expect(playerViewChatRequest(playerId)).toStrictEqual({
			messages: []
		});
	});

  test('one message sent', () => {
    playerSendChatRequest(playerId, 'hello its me');
    const timeNow: number = Math.floor((new Date()).getTime() / 1000);
    const result = playerViewChatRequest(playerId);
    expect(result).toStrictEqual({
      messages: [
        {
          messageBody: 'hello its me',
          playerId: playerId,
          playerName: 'Player One',
          timeSent: expect.any(Number),
        }
      ]
    });

    expect(result.messages[0].timeSent).toBeGreaterThan(timeNow - 1);
    expect(result.messages[0].timeSent).toBeLessThan(timeNow + 1);
  });

  test('two messages sent', () => {
    playerSendChatRequest(playerId, 'hello its me');
    playerSendChatRequest(playerId, 'yoohoo is anyone there?');
    expect(playerViewChatRequest(playerId)).toStrictEqual({
      messages: [
        {
          messageBody: 'hello its me',
          playerId: playerId,
          playerName: 'Player One',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'yoohoo is anyone there?',
          playerId: playerId,
          playerName: 'Player One',
          timeSent: expect.any(Number),
        }
      ]
    });
  });

  test('two player conversation', () => {
    const player2 = playerJoinRequest(sessionId, 'Player Two');
    const playerId2 = player2.playerId;
    playerSendChatRequest(playerId, 'knock knock');
    playerSendChatRequest(playerId2, 'who is there');
    playerSendChatRequest(playerId, 'hoo');
    playerSendChatRequest(playerId2, 'hoo who');
    expect(playerViewChatRequest(playerId)).toStrictEqual({
      messages: [
        {
          messageBody: 'knock knock',
          playerId: playerId,
          playerName: 'Player One',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'who is there',
          playerId: playerId2,
          playerName: 'Player Two',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'hoo',
          playerId: playerId,
          playerName: 'Player One',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'hoo who',
          playerId: playerId2,
          playerName: 'Player Two',
          timeSent: expect.any(Number),
        }
      ]
    });
  });
});
