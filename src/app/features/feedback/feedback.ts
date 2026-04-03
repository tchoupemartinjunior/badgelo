import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FeedbackService } from './service/feedback-service';
import { FeedbackFormValue } from './service/feedback-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



@Component({
  selector: 'bdge-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Feedback {
  private readonly fb = inject(FormBuilder);
  private readonly translateService = inject(TranslateService);
  private readonly feedbackService = inject(FeedbackService);

  // Form and state signals
  form!: FormGroup;
  submitted = signal(false);
  loading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      rating: [''],
    });
  }

  get hasErrors(): boolean {
    return this.form.invalid && this.submitted();
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !this.submitted() || !control.errors) {
      return null;
    }

    if (control.hasError('required')) {
      return this.translateService.instant(`FEEDBACK.FORM.${fieldName.toUpperCase()}_REQUIRED`);
    }
    if (control.hasError('email')) {
      return this.translateService.instant('FEEDBACK.FORM.EMAIL_INVALID');
    }
    if (control.hasError('minlength')) {
      return `${fieldName} must be at least ${control.getError('minlength').requiredLength} characters`;
    }
    return null;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set(null);

    if (!this.isFormValid) {
      return;
    }

    this.loading.set(true);
    const formData = this.form.getRawValue() as FeedbackFormValue;

    // Send to Google Form
    this.sendToGoogleForm(formData);
  }

  private sendToGoogleForm(data: FeedbackFormValue): void {
    this.feedbackService.sendToGoogleForm(data)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.success.set(true);
          this.form.reset();
          this.submitted.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('An error occurred while sending your feedback');
          console.error('Error sending feedback:', err);
        }
      });
  }

  resetForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.success.set(false);
    this.error.set(null);
  }
}
