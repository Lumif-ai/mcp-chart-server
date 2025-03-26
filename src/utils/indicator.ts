export class EMAIndicator {
  private close: number[];
  private window: number;
  private fillna: boolean;

  constructor(close: number[], window: number, fillna: boolean = true) {
    this.close = close;
    this.window = window;
    this.fillna = fillna;
  }

  calculateEMA(): number[] {
    const alpha = 2 / (this.window + 1);
    const ema: number[] = new Array(this.close.length).fill(0);

    // Initialize first value
    ema[0] = this.close[0];

    // Calculate EMA
    for (let i = 1; i < this.close.length; i++) {
      ema[i] = this.close[i] * alpha + ema[i - 1] * (1 - alpha);
    }

    return ema;
  }
}

export function dropna(data: any[]): any[] {
  return data.filter((row) =>
    Object.values(row).every(
      (value) => value !== null && value !== undefined && !Number.isNaN(value),
    ),
  );
}
