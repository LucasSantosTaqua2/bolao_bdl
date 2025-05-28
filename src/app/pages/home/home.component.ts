// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, Renderer2, ElementRef, ViewChild, HostListener } from '@angular/core'; // Adicionado AfterViewInit, Renderer2, ElementRef, ViewChild, HostListener
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserRole } from '../../services/auth.service';
import { TeamNameToFileNamePipe } from '../../utils/team-name-to-file-name.pipe';

interface FloatingEmblemConfig {
  teamName: string;
  initialTop: string; // ex: '10%'
  initialLeft: string; // ex: '5%'
  animationName: string; // Nome da animação CSS
  animationDuration: string; // ex: '15s'
  animationDelay?: string; // ex: '2s'
  size: string; // ex: '50px'
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TeamNameToFileNamePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [TeamNameToFileNamePipe] // Adicionar o pipe aos providers se for usá-lo programaticamente
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  username: string | null = null;
  isAdmin: boolean = false;
  private authSubscription: Subscription | undefined;

  teamNamesForParade: string[] = [
    'Flamengo', 'Palmeiras', 'Atlético-MG', 'Corinthians', 'São Paulo',
    'Grêmio', 'Internacional', 'Fluminense', 'Santos', 'Botafogo',
    'Cruzeiro', 'Vasco', 'Athletico-PR', 'Bahia', 'EC Vitória'
  ];

  // Configuração para os emblemas flutuantes
  floatingEmblems: FloatingEmblemConfig[] = [
    { teamName: 'Flamengo', initialTop: '15%', initialLeft: '8%', animationName: 'floatSimple1', animationDuration: '20s', size: '45px', animationDelay: '0s' },
    { teamName: 'Palmeiras', initialTop: '30%', initialLeft: '90%', animationName: 'floatSimple2', animationDuration: '25s', size: '50px', animationDelay: '3s' },
    { teamName: 'Corinthians', initialTop: '65%', initialLeft: '12%', animationName: 'floatSimple3', animationDuration: '18s', size: '40px', animationDelay: '1s' },
    { teamName: 'São Paulo', initialTop: '80%', initialLeft: '85%', animationName: 'floatSimple1', animationDuration: '22s', size: '55px', animationDelay: '2.5s' },
    { teamName: 'Internacional', initialTop: '5%', initialLeft: '50%', animationName: 'floatSimple2', animationDuration: '28s', size: '48px', animationDelay: '1.5s' },
    { teamName: 'Vasco', initialTop: '90%', initialLeft: '40%', animationName: 'floatSimple3', animationDuration: '20s', size: '42px', animationDelay: '4s' }
  ];

  // Referência ao contêiner onde os emblemas serão adicionados
  @ViewChild('floatingEmblemsContainer', { static: false }) floatingEmblemsContainerRef!: ElementRef;
  private contentElementRef!: ElementRef;
  @ViewChild('contentContainer', {read: ElementRef, static: false}) set contentContainer(elRef: ElementRef) {
    if(elRef) {
      this.contentElementRef = elRef;
      this.adjustFloatingEmblemPositions();
    }
  }


  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2, // Injetar Renderer2
    private teamNameToFileName: TeamNameToFileNamePipe // Injetar o pipe
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUserUsername$.subscribe(username => {
      this.username = username;
    });

    this.authSubscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.isAdmin = role === UserRole.ADMIN;
      })
    );
  }

  ngAfterViewInit(): void {
    // A criação dos emblemas agora depende do contentContainer estar disponível
    // e será chamada pelo setter de contentContainer ou pelo HostListener de resize.
  }

  private createAndAppendFloatingEmblems(): void {
    if (!this.floatingEmblemsContainerRef || !this.floatingEmblemsContainerRef.nativeElement) {
        // console.warn('Floating emblems container not available yet.');
        return;
    }
    // Limpar emblemas anteriores se houver (para o caso de re-renderização ou resize)
    this.floatingEmblemsContainerRef.nativeElement.innerHTML = '';


    this.floatingEmblems.forEach(config => {
      const imgElement = this.renderer.createElement('img');
      const fileName = this.teamNameToFileName.transform(config.teamName);
      this.renderer.setAttribute(imgElement, 'src', `assets/emblemas/${fileName}`);
      this.renderer.setAttribute(imgElement, 'alt', config.teamName);
      this.renderer.addClass(imgElement, 'floating-emblem');

      // Estilos dinâmicos
      this.renderer.setStyle(imgElement, 'top', config.initialTop);
      this.renderer.setStyle(imgElement, 'left', config.initialLeft);
      this.renderer.setStyle(imgElement, 'width', config.size);
      this.renderer.setStyle(imgElement, 'height', config.size);
      this.renderer.setStyle(imgElement, 'animation-name', config.animationName);
      this.renderer.setStyle(imgElement, 'animation-duration', config.animationDuration);
      if (config.animationDelay) {
        this.renderer.setStyle(imgElement, 'animation-delay', config.animationDelay);
      }

      this.renderer.appendChild(this.floatingEmblemsContainerRef.nativeElement, imgElement);
    });
  }

  private adjustFloatingEmblemPositions(): void {
    if (!this.contentElementRef || !this.contentElementRef.nativeElement || !this.floatingEmblemsContainerRef) {
      return;
    }

    const contentRect = this.contentElementRef.nativeElement.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect(); // Para referência de scroll

    // O contêiner dos emblemas flutuantes deve ser posicionado corretamente
    // Aqui, assumimos que floatingEmblemsContainerRef é um filho direto do body ou de um wrapper principal.
    // Se for um filho do host do componente app-home, o posicionamento já deve estar ok.

    // Reposicionar/Recriar emblemas para garantir que eles fiquem "ao redor" do .content
    // A lógica de posicionamento exato (initialTop, initialLeft) precisaria ser mais dinâmica
    // se quisermos que eles orbitem precisamente o .content.
    // Por agora, a configuração estática é usada, e eles flutuarão no viewport.
    // Para fazer ao redor do .content, as posições teriam que ser relativas ao .content.

    // Chamamos createAndAppend para recriar com base na configuração,
    // assumindo que o CSS vai lidar com o posicionamento relativo ao seu contêiner.
     this.createAndAppendFloatingEmblems();
  }


  @HostListener('window:resize')
  onWindowResize(): void {
    this.adjustFloatingEmblemPositions();
  }


  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  goToApostar(): void {
    if (this.authService.getAccessToken()) {
      this.router.navigate(['/apostar']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  goToAdminPanel(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    }
  }
}