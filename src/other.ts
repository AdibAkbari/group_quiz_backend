import { getData, setData } from './dataStore';
import { Data } from './interfaces';

/**
 * Reset the state of the application back to the start.
 *
 * @param {} - no parameters
 * @returns {{ }} - empty object
 */
export function clear (): Record<string, never> {
  let data: Data = getData();

  data = {
    users: [],
    quizzes: [],
    quizCount: 0,
    tokens: [],
    trash: [],
    sessions: [],
    players: [],
    playerIdCount: 0,
  };

  setData(data);

  return { };
}
