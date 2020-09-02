class App {
  method() {
    return [1,2,3].map(n => n ** 2);
  }
}

const app = new App();
app.method();