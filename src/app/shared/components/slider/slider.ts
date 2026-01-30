import { Component, input, output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'bdge-slider',
    template: `
    <div>
      <label class="block text-gray-700 mb-1">{{ label() }}</label>
      <input
        type="range"
        class="w-full accent-indigo-600"
        [min]="min()"
        [max]="max()"
        [value]="value()"
        (input)="onInput($event)"
        [attr.aria-label]="label()"
      >
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class SliderComponent {
    label = input<string>('');
    min = input<number>(0);
    max = input<number>(200);
    value = input<number>(100);
    valueChange = output<number>();

    onInput(event: Event) {
        const val = Number((event.target as HTMLInputElement).value);
        this.valueChange.emit(val);
    }
}
