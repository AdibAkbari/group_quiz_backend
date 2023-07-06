import express, { json, Request, Response } from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import {
  adminAuthRegister, adminUserDetails,
} from './auth'
import {
  adminQuizCreate,
  adminQuizRemove,
  adminQuizList,
} from './quiz'
import { clear } from './other'

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync('./swagger.yaml', 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  const ret = echo(data);
  if ('error' in ret) {
    res.status(400);
  }
  return res.json(ret);
});

// adminAuthRegister // 
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  //const { email, password, nameFirst, nameLast } = req.body;
  const result = adminAuthRegister(req.body.email, req.body.password, req.body.nameFirst, req.body.nameLast);
  if ('error' in result) {
    res.status(400);
  }
  res.json(result);
})

// adminQuizList //
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const response = adminQuizList(token);
  if ('error' in response) {
    if (response.error.includes("structure")) {
      return res.status(401).json(response);
    } else if (response.error.includes("logged")) {
      return res.status(403).json(response);
    }
  }
  res.json(response);
})


// adminQuizCreate // 
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const response = adminQuizCreate(req.body.token, req.body.name, req.body.description);
  if ('error' in response) {
    if (response.error.includes("Structure")) {
      return res.status(401).json(response);
    } else if (response.error.includes("logged")) {
      return res.status(403).json(response);
    } else if (response.error.includes("Name") || response.error.includes("Description")) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
})

// adminQuizRemove // 
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const response = adminQuizRemove(req.query.token, parseInt(req.params.quizid));
  if ('error' in response) {
    if (response.error.includes("Structure")) {
      return res.status(401).json(response);
    } else if (response.error.includes("logged")) {
      return res.status(403).json(response);
    } else if (response.error.includes("QuizId") || response.error.includes("own")) {
      return res.status(400).json(response);
    }
  }
  res.json(response);
})
  
// clear // 
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
