import { TestBed } from '@angular/core/testing';

import { ScrambleService } from './scramble.service';

describe('ScrambleService', () => {
  let service: ScrambleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrambleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
