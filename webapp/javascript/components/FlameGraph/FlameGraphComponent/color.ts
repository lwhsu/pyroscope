/* eslint-disable camelcase */
import Color from 'color';
import { scaleThreshold, scaleLinear } from 'd3-scale';
import murmurhash3_32_gc from './murmur3';
import type { FlamegraphPalette } from './colorPalette';

const colors = [
  Color.hsl(24, 69, 60),
  Color.hsl(34, 65, 65),
  Color.hsl(194, 52, 61),
  Color.hsl(163, 45, 55),
  Color.hsl(211, 48, 60),
  Color.hsl(246, 40, 65),
  Color.hsl(305, 63, 79),
  Color.hsl(47, 100, 73),

  Color.rgb(183, 219, 171),
  Color.rgb(244, 213, 152),
  Color.rgb(112, 219, 237),
  Color.rgb(249, 186, 143),
  Color.rgb(242, 145, 145),
  Color.rgb(130, 181, 216),
  Color.rgb(229, 168, 226),
  Color.rgb(174, 162, 224),
  Color.rgb(154, 196, 138),
  Color.rgb(242, 201, 109),
  Color.rgb(101, 197, 219),
  Color.rgb(249, 147, 78),
  Color.rgb(234, 100, 96),
  Color.rgb(81, 149, 206),
  Color.rgb(214, 131, 206),
  Color.rgb(128, 110, 183),
];

export const defaultColor = Color.rgb(148, 142, 142);
export const diffColorRed = Color.rgb(200, 0, 0);
export const diffColorGreen = Color.rgb(0, 170, 0);

export const highlightColor = Color('#48CE73');

export function colorBasedOnDiffPercent(
  palette: FlamegraphPalette,
  leftPercent: number,
  rightPercent: number
) {
  const result = diffPercent(leftPercent, rightPercent);
  const color = NewDiffColor(palette);
  return color(result);
}

// TODO move to a different file
// difference between 2 percents
export function diffPercent(leftPercent: number, rightPercent: number) {
  if (leftPercent === rightPercent) {
    return 0;
  }

  if (leftPercent === 0) {
    return 100;
  }

  // https://en.wikipedia.org/wiki/Relative_change_and_difference
  const result = ((rightPercent - leftPercent) / leftPercent) * 100;

  if (result > 100) {
    return 100;
  }
  if (result < -100) {
    return -100;
  }

  return result;
}

export function colorFromPercentage(p: number, alpha: number) {
  // calculated by drawing a line (https://en.wikipedia.org/wiki/Line_drawing_algorithm)
  // where p1 = (0, 180) and p2 = (100, 0)
  // where x is the absolute percentage
  // and y is the color variation
  let v = 180 - 1.8 * Math.abs(p);

  if (v > 200) {
    v = 200;
  }

  // red
  if (p > 0) {
    return Color.rgb(200, v, v).alpha(alpha);
  }
  // green
  if (p < 0) {
    return Color.rgb(v, 200, v).alpha(alpha);
  }
  // grey
  return Color.rgb(200, 200, 200).alpha(alpha);
}

export function colorGreyscale(v: number, a: number) {
  return Color.rgb(v, v, v).alpha(a);
}

// TODO spy names?
export function getPackageNameFromStackTrace(
  spyName: string,
  stackTrace: string
) {
  // TODO: actually make sure these make sense and add tests
  const regexpLookup = {
    default: /^(?<packageName>(.*\/)*)(?<filename>.*)(?<line_info>.*)$/,
    dotnetspy: /^(?<packageName>.+)\.(.+)\.(.+)\(.*\)$/,
    ebpfspy: /^(?<packageName>.+)$/,
    // tested with pyroscope stacktraces here: https://regex101.com/r/99KReq/1
    gospy: /^(?<packageName>.*?\/.*?\.|.*?\.|.+)(?<functionName>.*)$/,
    phpspy: /^(?<packageName>(.*\/)*)(?<filename>.*\.php+)(?<line_info>.*)$/,
    pyspy: /^(?<packageName>(.*\/)*)(?<filename>.*\.py+)(?<line_info>.*)$/,
    rbspy: /^(?<packageName>(.*\/)*)(?<filename>.*\.rb+)(?<line_info>.*)$/,
  };

  if (stackTrace.length === 0) {
    return stackTrace;
  }
  const regexp = regexpLookup[spyName] || regexpLookup.default;
  const fullStackGroups = stackTrace.match(regexp);
  if (fullStackGroups) {
    return fullStackGroups.groups.packageName;
  }
  return stackTrace;
}

export function colorBasedOnPackageName(
  palette: FlamegraphPalette,
  name: string
) {
  const hash = murmurhash3_32_gc(name);
  const colorIndex = hash % palette.colors.length;
  const baseClr = palette.colors[colorIndex];

  return baseClr;
}

/**
 * NewDiffColor constructs a function that given a number from -100 to 100
 * it returns the color for that number in a linear scale
 * encoded in rgb
 */
export function NewDiffColor(
  props: Omit<FlamegraphPalette, 'colors'>
): (n: number) => Color {
  const { goodColor, neutralColor, badColor } = props;

  const color = scaleLinear()
    .domain([-100, 0, 100])
    // TODO types from DefinitelyTyped seem to mismatch
    .range([
      goodColor.rgb().toString(),
      neutralColor.rgb().toString(),
      badColor.rgb().toString(),
    ] as any);

  return (n: number) => {
    // convert to our Color object
    // since that's what users are expecting to use
    return Color(color(n).toString());
  };
}
