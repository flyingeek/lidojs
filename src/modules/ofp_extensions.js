import {GeoPoint, dm_normalizer} from "./geopoint";

/**
 * Exception thrown when a search term is not found
 */
class StringExtractException extends Error {}

/**
 * Extract text between start and end mark
 * @param text: String
 * @param start: String
 * @param end: String
 * @param endIsOptional: if end is missing, captures till EOF
 * @param inclusive: if true, captures start and end
 * @return String
 */
function extract(text, start, end, endIsOptional = true, inclusive = false) {
  let from = 0;
  let to = 0;
  if (start) {
    from = text.indexOf(start);
    if (from === -1) {
      throw new StringExtractException(`${start} not found`);
    }
    if (!inclusive) {
      from += start.length;
    }
  }
  if (!end) {
    return text.substring(from);
  }
  to = text.indexOf(end, from);
  if (to === -1) {
    if (endIsOptional) {
      return text.substring(from);
    }
    throw new StringExtractException(`${end} not found`);
  } else if (inclusive) {
    to += end.length;
  }
  return text.substring(from, to);
}

/**
 * Defines an extract method on the String prototype
 * Extract text between start and end mark
 * @param text: String
 * @param start: String
 * @param end: String
 * @param endIsOptional: if end is missing, captures till EOF
 * @param inclusive: if true, captures start and end
 * @return String
 */
Reflect.defineProperty(String.prototype, 'extract', {
  value(start, end, endIsOptional = true, inclusive = false) {
    return extract(this, start, end, endIsOptional, inclusive);
  }
});


/**
 * A matchAll RegExp to extract WPT COORDINATES from text
 * @return {GeoPoint[]}
 */
class WptRegExp extends RegExp {

  /**
   * matchAll methods to return an array of GeoPoint
   * @param str
   * @returns {GeoPoint[]}
   */
  [Symbol.matchAll](str) {
    // eslint-disable-next-line prefer-reflect
    let result = RegExp.prototype[Symbol.matchAll].call(this, str);
    if (!result) {
      console.error("WPT Coordinates regexp failed");
      return [];
    }
    let geoPoints = [];
    Array.from(result).forEach((match) => {
      let name = match[1].trim().replace(/^-+/u, "");
      if (name === "") {
        name = match[2] + match[3];
      }
      geoPoints.push(
        new GeoPoint(
          [match[2], match[3]],
          {"name": name, "normalizer": dm_normalizer})
      );
    });
    return geoPoints;
  }
}
const wptRegExp = new WptRegExp(String.raw`(\S+|\s+)\s+([NS]\d{4}\.\d)([EW]\d{5}\.\d)`, 'gu');

export {wptRegExp, StringExtractException, extract};
