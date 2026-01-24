import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'bdge-button',
    template: `
    <button (click)="onClick.emit()" 
    class="text-white {{bgColor()}} text-base
     font-medium px-6 py-3 rounded-lg shadow-md 
     hover:{{onHoverBgColor()}} hover:cursor-pointer
     hover:shadow-lg transition duration-200 ease-in-out">
      {{ text() }}
    </button>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class ButtonComponent {
    text = input<string>('Button');
    bgColor = input<string>('bg-purple-700');
    onHoverBgColor = input<string>('bg-purple-600');
    onClick = output();
}
