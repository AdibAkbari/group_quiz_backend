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
let playerName: number;
// let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
	clearRequest();
	token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
	quizId = quizCreateRequest(token, 'quiz1', '').quizId;
	createQuizQuestionRequest(quizId, token, 'Question 1', 5, 6, validAnswers).questionId;
	sessionId = startSessionRequest(quizId, token, 3).sessionId;
	player = playerJoinRequest(sessionId, 'Player One');
	playerId = player.playerId;
	playerName = player.name;
});

test('Error Case: playerId does not exist', () => {
	expect(() => playerViewChatRequest(playerId + 1)).toThrow(HTTPError[400]);
});


describe ('Success Cases', () => {
	test('one message sent', () => {
		playerSendChatRequest(playerId, 'hello its me');
		expect(playerViewChatRequest(playerId)).toStrictEqual({
			messages: [
				{
					messagebody: 'hello its me',
					playerId: playerId,
					playerName: 'Player One',
					timeSent: expect.any(Number),
				}
			]
		})
	});

	test('two messages sent', () => {
		playerSendChatRequest(playerId, 'hello its me');
		playerSendChatRequest(playerId, 'yoohoo is anyone there?');
		expect(playerViewChatRequest(playerId)).toStrictEqual({
			messages: [
				{
					messagebody: 'hello its me',
					playerId: playerId,
					playerName: 'Player One',
					timeSent: expect.any(Number),
				},
				{
					messagebody: 'yoohoo is anyone there?',
					playerId: playerId,
					playerName: 'Player One',
					timeSent: expect.any(Number),
				}
			]
		})
	});

	test('two player conversation', () => {
		let player2 = playerJoinRequest(sessionId, 'Player Two');
		let playerId2 = player2.playerId;
		let playerName2 = player2.name;
		playerSendChatRequest(playerId, 'knock knock');
		playerSendChatRequest(playerId2, 'who is there');
		playerSendChatRequest(playerId, 'hoo');
		playerSendChatRequest(playerId2, 'hoo who');
		expect(playerViewChatRequest(playerId)).toStrictEqual({
			messages: [
				{
					messagebody: 'knock knock',
					playerId: playerId,
					playerName: 'Player One',
					timeSent: expect.any(Number),
				},
				{
					messagebody: 'who is there',
					playerId: playerId2,
					playerName: 'Player Two',
					timeSent: expect.any(Number),
				},
				{
					messagebody: 'hoo',
					playerId: playerId,
					playerName: 'Player One',
					timeSent: expect.any(Number),
				},
				{
					messagebody: 'hoo who',
					playerId: playerId2,
					playerName: 'Player Two',
					timeSent: expect.any(Number),
				}
			]
		})
	});

});