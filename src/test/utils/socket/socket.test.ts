import { setIo, getIo } from "../../../utils/socket/socket";
import { Server } from "socket.io";

describe("Socket Utils", () => {
  let mockIo: Server;

  beforeEach(() => {
    mockIo = new Server();
  });

  afterEach(() => {
    // Reset the io instance after each test
    (setIo as any)(null);
  });

  test("should set and get the Socket.IO instance correctly", () => {
    setIo(mockIo);
    const retrievedIo = getIo();
    expect(retrievedIo).toBe(mockIo);
  });

  test("should throw an error when getting Socket.IO instance before initialization", () => {
    expect(() => {
      getIo();
    }).toThrow("Socket.Io n'est pas encore initialisé !");
  });
});