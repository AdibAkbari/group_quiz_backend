import { getData, setData } from './dataStore';

export function startSession(quizId: number, token: string, autoStartNum: number): { sessionId: number} {
    return { sessionId: 3};
}