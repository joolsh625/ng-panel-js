import { Component, OnInit, HostListener } from '@angular/core';
import { PanelJsService } from './panel-js.service';
import { Subject, BehaviorSubject } from 'rxjs';


@Component({
  selector: 'panel-js',
  template: '<ng-content></ng-content>',
  host: {
    "[style.transform]":"'translate3d(0, '+pos+'px, 0)'",
    "[style.transition]":"transitionSpeed",
    "[style.backgroundColor]":"colour",
    "[style.display]":"'block'",
    "[style.willChange]": "'transform'"
  },
  styleUrls: ['./panel-js.component.scss']
})
export class PanelJsComponent implements OnInit {

  private pos: number;
  private transitionSpeed: string = '0s';
  
  private startPos: number;
  private stage0: number = window.innerHeight / 2;
  private stage1: number = 0;
  private stageBoundary: number = this.stage0 / 2;
  private currentStage: number = 1;

  // Used to fix iOS propogation bug
  private colour: string = "purple";
  private colourSubject: Subject<string> = new BehaviorSubject("red");

  constructor(private panelService: PanelJsService) {
    this.pos = panelService.getStage0();
  }

  @HostListener('panstart', ['$event']) panstart(event: HammerInput) {
    this.transitionSpeed = '0s';
    this.startPos = event.deltaY - this.pos;
  }

  @HostListener('panmove', ['$event']) panmove(event: HammerInput) {
    // Prevent panel from going out of boundaries
    const touchPos = event.deltaY - this.startPos;
    if (touchPos > 0 && touchPos < this.stage0) {
      this.pos = touchPos;
    }
  }

  @HostListener('panend', ['$event']) panend(event: HammerInput) {
    this.transitionSpeed = '0.3s';
    const speed = Math.abs(event.velocity);
    console.log(event);
    // Swipe down
    if (event.offsetDirection === 16) {
      if (this.currentStage === 1) {
        if (speed > 0.5 || this.pos > this.stageBoundary) {
          this.animateStage0();
        } else {
          this.animateStage1();
        }
      }
    }
    // Swipe up
    else if (event.offsetDirection === 8) {
      if (this.currentStage === 0) {
        if (speed > 0.5 || this.pos < this.stageBoundary) {
          this.animateStage1();
        } else {
          this.animateStage0();
        }
      }
    }
  }

  animateStage1() {
    this.pos = this.stage1;
    this.currentStage = 1;
    this.colourSubject.next('green');
  }
  animateStage0() {
    this.pos = this.stage0;
    this.currentStage = 0;
    this.colourSubject.next('blue');
  }

  ngOnInit() {
    this.colourSubject.asObservable().subscribe(color => {
      /* Weird ass hacky fix to get it working on Safari, if the bg colour
        isn't the colour passed thru, make it purple, tbh this shouldn't work
        but it does, so dont fuckin break it please */
      if(this.colour === color) {
        this.colour = "purple";
      } else {
        this.colour = color
      }
    });
  }
}
