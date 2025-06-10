import { Pipe, PipeTransform, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
@Pipe({
  name: 'teamNameToFileName',
  standalone: true,
})
export class TeamNameToFileNamePipe implements PipeTransform {
  transform(teamName: string | null | undefined): string {
    if (!teamName) {
      return 'default.png'; // Nome padrão para escudos não encontrados.
    }

    // Normaliza o nome do time para criar um nome de arquivo padrão
    let fileName = teamName
      .toLowerCase()
      .replace(/\s+/g, '_')        // Substitui espaços por underscores
      .replace(/-/g, '_')         // Substitui hífens por underscores
      .replace(/[ãâáàä]/g, 'a')
      .replace(/[éêëè]/g, 'e')
      .replace(/[íîïì]/g, 'i')
      .replace(/[õôóòö]/g, 'o')
      .replace(/[ûúùü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9_]/g, ''); // Remove todos os caracteres não alfanuméricos exceto underscore

    // Casos específicos para ajustar nomes de arquivo que não seguem o padrão
    if (fileName === 'red_bull_bragantino') {
      fileName = 'bragantino';
    }

    return `${fileName}.png`;
  }
}
