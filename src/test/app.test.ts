import { App } from "../app";


describe("App", () => {
  let app: App;

  beforeAll(() => {
    app = new App([]);
  });

  it("should create an instance of App", () => {
    expect(app).toBeInstanceOf(App);
  });

  it("should have a listen method", () => {
    expect(typeof app.listen).toBe("function");
  });

  it("should have a getServer method", () => {
    expect(typeof app.getServer).toBe("function");
  });
}); 