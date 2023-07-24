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
  const {description } = req.body;
  const token = req.headers.token as string;
  const response = adminQuizDescriptionUpdate(quizId, token, description);
  res.json(response);
});

// adminAuthRegister //
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  // const { email, password, nameFirst, nameLast } = req.body;
  const result = adminAuthRegister(req.body.email, req.body.password, req.body.nameFirst, req.body.nameLast);
  res.json(result);
});

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminUserDetails(token);
  res.json(response);
});

// updateUserDetails
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { email, nameFirst, nameLast } = req.body;
  const token = req.headers.token as string;
  const response = updateUserDetails(token, email, nameFirst, nameLast);
  res.json(response);
});

// adminAuthLogin //
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = adminAuthLogin(email, password);
  res.json(response);
});

// adminQuizList //
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminQuizList(token);
  res.json(response);
});

// adminQuizCreate //
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const response = adminQuizCreate(req.headers.token, req.body.name, req.body.description);
  res.json(response);
});

// updateUserPassword //
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;
  const response = updateUserPassword(token, oldPassword, newPassword);
  res.json(response);
});

// adminQuizNameUpdate //
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const name = req.body.name as string;

  const response = adminQuizNameUpdate(token, parseInt(req.params.quizid), name);
  res.json(response);
});

// adminQuizTransfer //
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const userEmail = req.body.userEmail as string;
  const response = adminQuizTransfer(token, parseInt(req.params.quizid), userEmail);
  res.json(response);
});

// adminQuizTransfer //
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const userEmail = req.body.userEmail as string;
  const response = adminQuizTransfer(token, parseInt(req.params.quizid), userEmail);
  res.json(response);
});

// updateUserPassword //
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;
  const response = updateUserPassword(token, oldPassword, newPassword);
  res.json(response);
});

// adminQuizNameUpdate //
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const name = req.body.name as string;

  const response = adminQuizNameUpdate(token, parseInt(req.params.quizid), name);
  res.json(response);
});

// createQuizQuestion //
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const { question, duration, points, answers } = req.body.questionBody;
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = createQuizQuestion(quizId, token, question, duration, points, answers);
  res.json(response);
});

// moveQuizQuestion //
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const newPosition = parseInt(req.body.newPosition);
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);

  const response = moveQuizQuestion(token, quizid, questionid, newPosition);
  res.json(response);
});

// deleteQuizQuestion //
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  const response = deleteQuizQuestion(token, quizId, questionid);
  res.json(response);
});

// adminQuizTrash //
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminQuizTrash(token);

  res.json(response);
});

// adminQuizInfo //
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = adminQuizInfo(token, quizId);

  res.json(response);
});

// adminQuizRemove //
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
    const token = req.headers.token as string;
    const response = adminQuizRemove(token, parseInt(req.params.quizid));
    res.json(response);
});

// adminQuizRestore //
app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const token = req.headers.token as string;
  const response = adminQuizRestore(token, quizId);

  res.json(response);
});

// adminQuizTrashEmpty //
app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizIds = JSON.parse(req.query.quizIds as string);

  const response = adminQuizTrashEmpty(token, quizIds);

  res.json(response);
});

// Update quiz question //
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { question, duration, points, answers } = req.body.questionBody;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const response = updateQuizQuestion(quizId, questionId, token, question, duration, points, answers);

  res.json(response);
});

// clear //
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

// adminAuthLogout //
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const response = adminAuthLogout(token);

  res.json(response);
});

// quizQuestionDuplicate //
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const token = req.headers.token as string;
  const response = quizQuestionDuplicate(quizId, questionId, token);
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
