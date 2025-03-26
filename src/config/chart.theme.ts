const WEB3_COLORS = {
  dark: "#1A1F2C",
  purple: "#b69dff",
  lightpurple: "#D6BCFA",
  gray: "#8E9196",
  charcoal: "#292d3e",
  navy: "#171c2c",
} as const;

export const darkTheme = {
  color: [
    WEB3_COLORS.purple,
    WEB3_COLORS.lightpurple,
    WEB3_COLORS.gray,
    WEB3_COLORS.charcoal,
    WEB3_COLORS.navy,
  ],
  backgroundColor: WEB3_COLORS.dark,
  textStyle: {},
  title: {
    textStyle: {
      color: WEB3_COLORS.lightpurple,
    },
    subtextStyle: {
      color: WEB3_COLORS.gray,
    },
  },
  line: {
    itemStyle: {
      borderWidth: "2",
    },
    lineStyle: {
      width: "3",
    },
    symbolSize: "7",
    symbol: "circle",
    smooth: true,
  },
  candlestick: {
    itemStyle: {
      color: "#e098c7",
      color0: "transparent",
      borderColor: "#e098c7",
      borderColor0: "#8fd3e8",
      borderWidth: "2",
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: WEB3_COLORS.gray,
      },
    },
    axisTick: {
      show: false,
      lineStyle: {
        color: WEB3_COLORS.charcoal,
      },
    },
    axisLabel: {
      show: true,
      color: WEB3_COLORS.gray,
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: [WEB3_COLORS.charcoal, WEB3_COLORS.navy],
      },
    },
    splitArea: {
      // show: true,
      // areaStyle: {
      //   color: [
      //     `${WEB3_COLORS.navy}80`, // Adding 80 for 50% opacity
      //     `${WEB3_COLORS.charcoal}80`,
      //   ],
      // },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: WEB3_COLORS.gray,
      },
    },
    axisTick: {
      show: false,
      lineStyle: {
        color: WEB3_COLORS.charcoal,
      },
    },
    axisLabel: {
      show: true,
      color: WEB3_COLORS.gray,
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: [WEB3_COLORS.charcoal, WEB3_COLORS.navy],
      },
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: [`${WEB3_COLORS.navy}80`, `${WEB3_COLORS.charcoal}80`],
      },
    },
  },
  tooltip: {
    backgroundColor: WEB3_COLORS.charcoal,
    borderColor: WEB3_COLORS.gray,
    textStyle: {
      color: WEB3_COLORS.lightpurple,
    },
    axisPointer: {
      lineStyle: {
        color: WEB3_COLORS.gray,
        width: 1,
      },
      crossStyle: {
        color: WEB3_COLORS.gray,
        width: 1,
      },
    },
  },
  dataZoom: {
    backgroundColor: WEB3_COLORS.navy,
    dataBackgroundColor: `${WEB3_COLORS.charcoal}80`,
    fillerColor: `${WEB3_COLORS.purple}40`,
    handleColor: WEB3_COLORS.purple,
    handleSize: "100%",
    textStyle: {
      color: WEB3_COLORS.gray,
    },
    borderColor: WEB3_COLORS.gray,
  },
  markPoint: {
    label: {
      color: WEB3_COLORS.lightpurple,
    },
    emphasis: {
      label: {
        color: WEB3_COLORS.lightpurple,
      },
    },
  },
} as const;
