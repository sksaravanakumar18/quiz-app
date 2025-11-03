// Fisher-Yates (Knuth) Shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]; // avoid mutating original array
  let currentIndex = result.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex], result[currentIndex]
    ];
  }

  return result;
}
