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

export interface QuestionResponse {
  questionId: number;
  playerAnswers: number[];
  answerTime: number;
  points: number;
}

export interface Players {
  sessionId: number;
  name: string;
  playerId: number;
  questionResponse: QuestionResponse[];
  score: number
}

export interface PlayerStatus {
  state: string;
  numQuestions: number;
  atQuestion: number;
}

export interface Session {
  sessionId: number,
  sessionState: string;
  autoStartNum: number;
  atQuestion: number;
  currentQuestionStartTime?: number;
  players: string[];
  metadata: Quizzes;
}

export interface SessionStatus {
  state: string,
  atQuestion: number,
  players: string[];
  metadata: QuizInfo;
}

export interface Data {
  users: Users[];
  quizzes: Quizzes[];
  quizCount: number;
  tokens: Token[];
  trash: Quizzes[];
  sessions: Session[];
  players: Players[];
  playerIdCount: number;
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

export interface QuestionCorrectBreakdown {
  answerId: number;
  playersCorrect: string[];
}

export interface QuestionResult {
  questionId: number;
  questionCorrectBreakdown: QuestionCorrectBreakdown[];
  averageAnswerTime: number;
  percentCorrect: number;
}
export interface SessionResults {
  usersRankedByScore: {name: string, score: number}[];
  questionResults: QuestionResult[];
}

export interface QuizList {
  quizId: number,
  name: string
}

export interface Answers {
  answer: string,
  correct: boolean
}

export interface Timers {
  sessionId: number,
  timer: ReturnType<typeof setTimeout>
}

export interface AnswerInfo {
  answerId: number;
  answer: string;
  colour: string;
}

export interface QuestionInfo {
  questionId: number;
  question: string;
  duration: number;
  points: number;
  answers: AnswerInfo[];
}
