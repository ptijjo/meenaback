import { logger, stream } from "../../utils/logger";

describe("Logger Utility", () => {
  it("should log messages at different levels", () => {
    expect(() => logger.debug("Debug message")).not.toThrow();
    expect(() => logger.info("Info message")).not.toThrow();
    expect(() => logger.warn("Warn message")).not.toThrow();
    expect(() => logger.error("Error message")).not.toThrow();
  });

  it("should have a stream object for morgan integration", () => {
    expect(stream).toHaveProperty("write");
    expect(typeof stream.write).toBe("function");
  });

  it("stream.write should log info messages", () => {
    const consoleSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
    const testMessage = "Test stream message";
    stream.write(testMessage);
    expect(consoleSpy).toHaveBeenCalledWith(testMessage);
    consoleSpy.mockRestore();
  });
});

