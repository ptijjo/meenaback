// src/test/error.middleware.test.ts

import { HttpException } from "../../../exceptions/httpException";
import { ErrorMiddleware } from "../../../middlewares/error.middleware";
import { logger } from "../../../utils/logger";


describe('ErrorMiddleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send the correct status and message from HttpException', () => {
    const error = new HttpException(400, 'Bad Request');
    
    ErrorMiddleware(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bad Request' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('should default to 500 and generic message if no status/message provided', () => {
    const error: any = {}; // pas de status/message

    ErrorMiddleware(error, mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('should call next if an error occurs inside middleware', () => {
    // Simule une erreur dans logger
    jest.spyOn(logger, 'error').mockImplementation(() => { throw new Error('Logger fail'); });

    const error = new HttpException(400, 'Bad Request');

    ErrorMiddleware(error, mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
