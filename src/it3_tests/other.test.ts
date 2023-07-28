import {
  clearRequest,
  authRegisterRequest,
  authLoginRequest
} from './it3_testRoutes';

describe('clearV1 Tests', () => {
  // Check that clear returns the correct object
  test('returns empty object', () => {
    expect(clearRequest()).toStrictEqual({});
  });

  //  Check that a 400 error is returned when data does not exist anymore
  test('integrated clear test', () => {
    // Register a user causing data to be populated
    authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast');

    // clear()
    clearRequest();

    // attempt to login and error code 400 recieved since data does not exist
    const res = authLoginRequest('email@gmail.com', 'password1');
    expect(res.statusCode).toBe(400);
  });
});
