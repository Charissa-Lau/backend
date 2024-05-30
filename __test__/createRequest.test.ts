import request from 'sync-request';
import { createRequest } from '../other';

describe('Testing that createRequest functions correctly', () => {
  test('Testing a valid usage of createRequest', () => {
    expect(createRequest('GET', 'https://dummyjson.com/products/1', {})).toMatchObject(JSON.parse(request('GET', 'https://dummyjson.com/products/1', { qs: {} }).getBody('utf-8')));
  });
});
