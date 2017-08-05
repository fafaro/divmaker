import hello from './index2';
import { expect } from 'chai';
import 'mocha';

describe('Hello function', () => {
    it('should return hello world', () => {
        const result = hello();
        expect(result).to.equal('Hello World!');
    });
});

