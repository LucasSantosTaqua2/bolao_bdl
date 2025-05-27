// src/app/utils/team-name-to-file-name.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'teamNameToFileName',
  standalone: true,
})
export class TeamNameToFileNamePipe implements PipeTransform {
  transform(teamName: string | null | undefined): string {
    if (!teamName) {
      return 'default_escudo.png'; // Um escudo padrão caso o nome seja nulo
    }

    let fileName = teamName
      .toLowerCase()
      .replace(/\s+/g, '_') // Substitui espaços por underscores
      .replace(/-/g, '_') // Substitui hífens por underscores
      .replace(/[ãâáàä]/g, 'a')
      .replace(/[éêëè]/g, 'e')
      .replace(/[íîïì]/g, 'i')
      .replace(/[õôóòö]/g, 'o')
      .replace(/[ûúùü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9_.]/g, ''); // Remove outros caracteres especiais, exceto ponto para extensão

    // Casos específicos baseados na sua lista:
    if (fileName === 'atletico_mg') {
      fileName = 'atletico_mg';
    } else if (fileName === 'ec_vitoria') {
      fileName = 'ec_vitoria';
    }
    // Adicione outros casos específicos se a normalização simples não for suficiente

    return `${fileName}.png`;
  }
}