import fs from 'fs';

// Mock fs avant d'importer le logger
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    createWriteStream: jest.fn(() => ({
      on: jest.fn(),
      write: jest.fn(),
    })),
  };
});

describe('Logger', () => {
  let logger: any;
  let stream: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Réimporter après mock
    ({ logger, stream } = require('../../../utils/logger'));
  });

  it('should create log directory if it does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    // On recrée le logger après mock
    ({ logger } = require('../../../utils/logger'));
    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it('should not create log directory if it already exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    ({ logger } = require('../../../utils/logger'));
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should call logger.info through stream.write', () => {
    const spy = jest.spyOn(logger, 'info').mockImplementation(() => logger);

    stream.write('hello world\n');
    expect(spy).toHaveBeenCalledWith('hello world');

    spy.mockRestore();
  });
});
