import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CorrectiveAction } from '../../../domain/model/corrective-action.entity';

@Component({
  selector: 'app-corrective-action-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './corrective-action-form.html',
  styleUrl: './corrective-action-form.css',
})
export class CorrectiveActionForm {
  @Input() loading = false;
  @Output() save = new EventEmitter<CorrectiveAction>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(10)]],
      responsible: ['', Validators.required],
      result: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { description, responsible, result } = this.form.value;
      const correctiveAction = new CorrectiveAction(
        description,
        responsible,
        result,
        new Date().toISOString(),
      );
      this.save.emit(correctiveAction);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
