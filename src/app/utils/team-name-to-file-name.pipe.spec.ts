import { TeamNameToFileNamePipe } from './team-name-to-file-name.pipe';

describe('TeamNameToFileNamePipe', () => {
  it('create an instance', () => {
    const pipe = new TeamNameToFileNamePipe();
    expect(pipe).toBeTruthy();
  });
});
