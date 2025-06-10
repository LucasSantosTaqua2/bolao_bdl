import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileNameService {

  constructor() { }

  public transform(teamName: string | null | undefined): string {
    if (!teamName) {
      return 'default.png';
    }

    let fileName = teamName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')
      .replace(/[ãâáàä]/g, 'a')
      .replace(/[éêëè]/g, 'e')
      .replace(/[íîïì]/g, 'i')
      .replace(/[õôóòö]/g, 'o')
      .replace(/[ûúùü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9_]/g, '');

    if (fileName === 'red_bull_bragantino') {
      fileName = 'bragantino';
    }

    return `${fileName}.png`;
  }
}
