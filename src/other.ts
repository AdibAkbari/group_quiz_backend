import { getData, setData } from './dataStore';
import { Data } from './interfaces';
import { clearTimers } from './session'

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

  clearTimers();

  setData(data);

  return { };
}
