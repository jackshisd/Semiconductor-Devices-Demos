// Match a displayed number together with its scientific-notation exponent.
// The TeX around each number stays untouched, so stable constants do not flash.
const numberPattern = /[+-]?\d+(?:\.\d+)?(?:\\times10\^\{[+-]?\d+\})?/g;

export function highlightChangedNumbers(previous: string, current: string) {
  const oldNumbers = [...previous.matchAll(numberPattern)].map(match => match[0]);
  const matches = [...current.matchAll(numberPattern)];
  if (oldNumbers.length !== matches.length) return current;
  let result = '';
  let offset = 0;
  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    result += current.slice(offset, start);
    result += match[0] === oldNumbers[index]
      ? match[0]
      : '\\htmlClass{formula-number-updated}{' + match[0] + '}';
    offset = start + match[0].length;
  });
  return result + current.slice(offset);
}
