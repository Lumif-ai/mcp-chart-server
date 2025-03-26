import * as echarts from "echarts";
import fs from "fs/promises";
import path from "path";
import { OHLCVData } from "../models/agent.model.js";
import { fileURLToPath } from "url";
import { darkTheme } from "../config/chart.theme.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

echarts.registerTheme("purple-passion", darkTheme);

export async function generateCandlestickChart(
  data: OHLCVData[],
  tokenName: string,
  outputPath: string = "charts",
): Promise<string> {
  // Create chart instance
  const chart = echarts.init(null, "purple-passion", {
    renderer: "svg",
    ssr: true,
    width: 800,
    height: 400,
  });

  // Format data for ECharts
  const dates = data.map(
    (item) => new Date(item.time * 1000).toISOString().split("T")[0],
  );
  const candlestickData = data.map((item) => [
    item.open,
    item.close,
    item.low,
    item.high,
  ]);

  // Configure chart options
  chart.setOption({
    title: {
      text: `${tokenName} Price Chart`,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: "dataMin",
      max: "dataMax",
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true,
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: "Candlestick",
        type: "candlestick",
        data: candlestickData,
      },
    ],
  });

  // Generate SVG
  const svgString = chart.renderToSVGString();

  // Convert to base64
  const base64String = Buffer.from(svgString).toString("base64");

  // Cleanup
  chart.dispose();

  return base64String;
}
