import { adminQuizList, adminQuizCreate } from '../../project/project-backend/src/quiz.js';
import { adminAuthRegister } from '../../project/project-backend/src/auth.js'
import { clear } from '../../project/project-backend/src/other.js';

const ERROR = { error: expect.any(String) };

beforeEach(() => {
    clear();
  });

  