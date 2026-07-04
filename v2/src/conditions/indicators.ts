export function calculateEma(values: number[], period: number) {
  if (period <= 0 || values.length === 0) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const emaValues: number[] = [];

  values.forEach((value, index) => {
    if (index === 0) {
      emaValues.push(value);
      return;
    }

    const previousEma = emaValues[index - 1];
    emaValues.push((value - previousEma) * multiplier + previousEma);
  });

  return emaValues;
}

export function calculateRsi(values: number[], period: number) {
  if (period <= 0 || values.length <= period) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}
