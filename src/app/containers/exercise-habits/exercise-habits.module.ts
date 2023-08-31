import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExerciseHabitsComponent } from './exercise-habits.component';
import { CompletionRateDoughnutChartComponent } from './components/completion-rate-doughnut-chart/completion-rate-doughnut-chart.component';
import { ExerciseHabitsDetailComponent } from './components/exercise-habits-detail/exercise-habits-detail.component';
import { ExerciseHabitsTrendChartComponent } from './components/exercise-habits-trend-chart/exercise-habits-trend-chart.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    ExerciseHabitsComponent,
    CompletionRateDoughnutChartComponent,
    ExerciseHabitsDetailComponent,
    ExerciseHabitsTrendChartComponent,
    TranslateModule,
  ],
})
export class ExerciseHabitsModule {}
