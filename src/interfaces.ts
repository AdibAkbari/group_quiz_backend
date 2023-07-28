// interfaces needed for all files
export interface Users {
  email: string;
  password: string;
  nameFirst: string;
  nameLast: string;
  authUserId: number;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  oldPasswords?: string[];
}

export interface User {
  user: {
      userId: number;
      name: string;
      email: string;
      numSuccessfulLogins: number;
      numFailedPasswordsSinceLastLogin: number;
  }
}

export interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Question {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: Answer[];
}

export interface Quizzes {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: Question[];
  creator: number;
  duration: number;
  questionCount: number;
}

export interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Question[],
  duration: number
}

export interface Token {
  tokenId: string;
  userId: number;
}

export interface Data {
  users: Users[];
  quizzes: Quizzes[];
  quizCount: number;
  tokens: Token[];
  trash: Quizzes[];
}

export interface Error {
  error: string
}

export interface TokenId {
  token: string
}

export interface QuizId {
  quizId: number
}

export interface QuestionId {
  questionId: number
}

export interface NewQuestionId {
  newQuestionId: number;
}

export interface QuizList {
  quizId: number,
  name: string
}

export interface Answers {
  answer: string,
  correct: boolean
}

export interface PlayerAnswers {
  answerId: number,
}

export interface PlayerQuestions {
  questionId: number,
  playerAnswers: PlayerAnswers[],
  answerDuration: number,
  points: number,
}

export interface Players {
  playerName: string,
  playerId: number,
  playerQuestions: PlayerQuestions[],
  score: number,
}
