import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

@Component({
  selector: 'bdge-button',
  template: `
    <button [disabled]="disabled()" (click)="onClick.emit()" [class]="buttonClass()">
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
  disabled = input<boolean>(false);
  onClick = output();

  buttonClass = computed(() => {
    const baseClasses = 'text-white text-base font-medium px-6 py-3 rounded-lg shadow-md transition duration-200 ease-in-out';
    return this.disabled()
      ? `${baseClasses} bg-gray-400 cursor-not-allowed opacity-60`
      : `${baseClasses} ${this.bgColor()} hover:${this.onHoverBgColor()} hover:cursor-pointer hover:shadow-lg`;
  });
}

