/* global describe, it, expect */

const Scanner = require('./scanner');

describe('Scanner', () => {
  describe('constructor', () => {
    it('creates a buffer from an input string', () => {
      const scanner = new Scanner('test input string');

      expect(scanner.buffer).not.toBeUndefined();
    });
  });

  describe('readByteAt()', () => {
    it('returns an unsigned Int8 at the given offset', () => {
      const scanner = new Scanner('aaaa bbbb cccc');

      expect(scanner.readByteAt(0)).toBe(0x61);
      expect(scanner.readByteAt(5)).toBe(0x62);
      expect(scanner.readByteAt(11)).toBe(0x63);
    });
  });

  describe('decode', () => {
    it('decodes characters in range', () => {
      const scanner = new Scanner('aaaa bbbb cccc');

      expect(scanner.decodeCharAt(0)).toEqual({ code: 97, value: 'a', width: 1 });
      expect(scanner.decodeCharAt(5)).toEqual({ code: 98, value: 'b', width: 1 });
      expect(scanner.decodeCharAt(11)).toEqual({ code: 99, value: 'c', width: 1 });
    });

    it('decodes unicode 2 byte characters', () => {
      const scanner = new Scanner('¢');
      expect(scanner.decodeCharAt(0)).toEqual({ code: 162, value: '¢', width: 2 });
    });

    it('decodes unicode 3 byte characters', () => {
      const scanner = new Scanner('€');
      expect(scanner.decodeCharAt(0)).toEqual({ code: 8364, value: '€', width: 3 });
    });

    it('decodes unicode 4 byte characters', () => {
      const scanner = new Scanner('😊');
      expect(scanner.decodeCharAt(0)).toEqual({ code: 128522, value: '😊', width: 4 });
    });
  });

  describe('getChar()', () => {
    it('returns the first character of a given string', () => {
      const scanner = new Scanner('aaaa');

      expect(scanner.getChar()).toBe('a');
    });

    it('walks through each character of the given input', () => {
      const scanner = new Scanner('abcd');

      expect(scanner.getChar()).toBe('a');
      expect(scanner.getChar()).toBe('b');
      expect(scanner.getChar()).toBe('c');
      expect(scanner.getChar()).toBe('d');
    });

    it('walks through characters of varying byte width', () => {
      const scanner = new Scanner('winter 😊');

      expect(scanner.getChar()).toBe('w');
      expect(scanner.getChar()).toBe('i');
      expect(scanner.getChar()).toBe('n');
      expect(scanner.getChar()).toBe('t');
      expect(scanner.getChar()).toBe('e');
      expect(scanner.getChar()).toBe('r');
      expect(scanner.getChar()).toBe(' ');
      expect(scanner.getChar()).toBe('😊');
    });

    it('returns empty string when empty input is given', () => {
      const scanner = new Scanner('');
      expect(scanner.getChar()).toBe(null);
    });
  });
});
