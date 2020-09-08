const writeMsg = (msg) => msg;
console.log(writeMsg("test"));

class Egz {
  constructor() {
    this.make = "egz";
  }

  render() {
    console.log(this.make);
  }
}

const example = new Egz();

example.render();
