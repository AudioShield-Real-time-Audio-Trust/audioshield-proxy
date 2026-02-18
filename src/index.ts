console.log('Hello, TypeScript Node.js Project!');

// Example function with TypeScript types
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet('World');
console.log(message);
