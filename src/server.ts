import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import {
  adminAuthLogin,
  adminAuthRegister,
  adminAuthLogout,
  updateUserPassword,
  adminUserDetails,
  updateUserDetails,
} from './auth';
import {
  adminQuizCreate,
  adminQuizRemove,
  adminQuizDescriptionUpdate,
  createQuizQuestion,
  adminQuizTrash,
  adminQuizRestore,
  adminQuizInfo,
  adminQuizList,
  quizQuestionDuplicate,
  adminQuizTrashEmpty,
  adminQuizNameUpdate,
  adminQuizTransfer,
  deleteQuizQuestion,
  updateQuizQuestion,
  moveQuizQuestion
} from './quiz';
import { clear } from './other';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// for logging errors (print to terminal)
app.use(morgan('dev'));

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// adminQuizDescriptionUpdate //
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, description } = req.body;
  const response = adminQuizDescriptionUpdate(quizId, token, description);

  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('quizId') || response.error.includes('description')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminAuthRegister //
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  // const { email, password, nameFirst, nameLast } = req.body;
  const result = adminAuthRegister(req.body.email, req.body.password, req.body.nameFirst, req.body.nameLast);
  if ('error' in result) {
    res.status(400);
  }
  res.json(result);
});

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminUserDetails(token);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    }
  }
  res.json(response);
});

// updateUserDetails
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;
  const response = updateUserDetails(token, email, nameFirst, nameLast);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('Email') || response.error.includes('name')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminAuthLogin //
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = adminAuthLogin(email, password);
  if ('error' in response) {
    return res.status(400).json(response);
  }
  res.json(response);
});

// adminQuizList //
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizList(token);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    }
  }
  res.json(response);
});

// adminQuizCreate //
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const response = adminQuizCreate(req.body.token, req.body.name, req.body.description);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('Name') || response.error.includes('Description')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// updateUserPassword //
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const response = updateUserPassword(token, oldPassword, newPassword);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('password')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizNameUpdate //
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const name = req.body.name as string;

  const response = adminQuizNameUpdate(token, parseInt(req.params.quizid), name);

  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('Name') || response.error.includes('QuizId') ||
                 response.error.includes('own') || response.error.includes('white space')) {
      return res.status(400).json(response);
    }
  }

  res.json(response);
});

// adminQuizTransfer //
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const userEmail = req.body.userEmail as string;
  const response = adminQuizTransfer(token, parseInt(req.params.quizid), userEmail);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('QuizId') || response.error.includes('own') ||
                 response.error.includes('name') || response.error.includes('Email')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizTransfer //
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const userEmail = req.body.userEmail as string;
  const response = adminQuizTransfer(token, parseInt(req.params.quizid), userEmail);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('QuizId') || response.error.includes('own') ||
                 response.error.includes('name') || response.error.includes('Email')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// updateUserPassword //
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const response = updateUserPassword(token, oldPassword, newPassword);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('password')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizNameUpdate //
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const name = req.body.name as string;

  const response = adminQuizNameUpdate(token, parseInt(req.params.quizid), name);

  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('Name') || response.error.includes('QuizId') ||
                 response.error.includes('own') || response.error.includes('white space')) {
      return res.status(400).json(response);
    }
  }

  res.json(response);
});

// createQuizQuestion //
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const { question, duration, points, answers } = req.body.questionBody;
  const quizId = parseInt(req.params.quizid);
  const response = createQuizQuestion(quizId, req.body.token, question, duration, points, answers);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('input') || response.error.includes('quiz Id')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// moveQuizQuestion //
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const newPosition = parseInt(req.body.newPosition);
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  const response = moveQuizQuestion(token, quizid, questionid, newPosition);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('quiz Id') || response.error.includes('questionId') ||
                 response.error.includes('newPosition')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// deleteQuizQuestion //
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  const response = deleteQuizQuestion(token, quizId, questionid);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('param:') || response.error.includes('quiz Id')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizTrash //
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizTrash(token);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    }
  }
  res.json(response);
});

// adminQuizInfo //
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.query.token as string;
  const response = adminQuizInfo(token, quizId);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('quizId')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizRemove //
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  try {
    const token = req.headers.token as string;
    const response = adminQuizRemove(token, parseInt(req.params.quizid));
    res.json(response);
  } catch (err) {
    console.log(err.message);
  }
});

// adminQuizRestore //
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const response = adminQuizRestore(req.body.token, quizId);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('quiz')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// adminQuizTrashEmpty //
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizIds = JSON.parse(req.query.quizIds as string);

  const response = adminQuizTrashEmpty(token, quizIds);
  if ('error' in response) {
    if (response.error.includes('Structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('quizIds')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// Update quiz question //
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { question, duration, points, answers } = req.body.questionBody;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const response = updateQuizQuestion(quizId, questionId, req.body.token, question, duration, points, answers);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('input') || response.error.includes('param')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// clear //
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

// adminAuthLogout //
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const response = adminAuthLogout(req.body.token);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// quizQuestionDuplicate //
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.body.token;
  const response = quizQuestionDuplicate(quizId, questionId, token);
  if ('error' in response) {
    if (response.error.includes('structure')) {
      return res.status(401).json(response);
    } else if (response.error.includes('logged')) {
      return res.status(403).json(response);
    } else if (response.error.includes('invalid')) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
