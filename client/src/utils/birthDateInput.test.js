import { describe, expect, it } from 'vitest';
import { formatBirthDateInput, parseBirthDate } from './birthDateInput';

describe('formatBirthDateInput', () => {
    it('adds the slashes while typing digits', () => {
        expect(formatBirthDateInput('1')).toBe('1');
        expect(formatBirthDateInput('150')).toBe('15/0');
        expect(formatBirthDateInput('15031990')).toBe('15/03/1990');
    });
    it('ignores slashes and other characters the customer types, and stops at 8 digits', () => {
        expect(formatBirthDateInput('15/03/1990')).toBe('15/03/1990');
        expect(formatBirthDateInput('15-03-19901')).toBe('15/03/1990');
        expect(formatBirthDateInput('')).toBe('');
    });
    it('backspacing over a slash removes the digit before it on the next format', () => {
        expect(formatBirthDateInput('15/03/')).toBe('15/03');
        expect(formatBirthDateInput('15/0')).toBe('15/0');
    });
});

describe('parseBirthDate', () => {
    const today = new Date(Date.UTC(2026, 10, 8));
    it('returns the server format for a real date', () => {
        expect(parseBirthDate('15/03/1990', today)).toBe('1990-03-15');
        expect(parseBirthDate('29/02/2024', today)).toBe('2024-02-29');
    });
    it('rejects incomplete, impossible, future and too-old dates', () => {
        expect(parseBirthDate('15/03/19', today)).toBeNull();
        expect(parseBirthDate('31/02/1990', today)).toBeNull();
        expect(parseBirthDate('29/02/2023', today)).toBeNull();
        expect(parseBirthDate('01/01/2030', today)).toBeNull();
        expect(parseBirthDate('01/01/1899', today)).toBeNull();
    });
});
