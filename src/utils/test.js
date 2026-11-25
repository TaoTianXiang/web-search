
class Animal {
  constructor(name) { this.name = name }
  speak() { return `${this.name} makes a sound` }
}

class Dog extends Animal {
  constructor(name) {
    super(name)      // 必须先调用，才能使用 this
    this.type = 'dog'
  }
  speak() {
    return `${super.speak()} (woof)`
  }
}
const dog = new Dog('dog')

console.log(dog.speak()); //输出 "dog makes a sound (woof)”
