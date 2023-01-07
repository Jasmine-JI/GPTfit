import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupAnalysisCalenderComponent } from './group-analysis-calender.component';

describe('GroupAnalysisCalenderComponent', () => {
  let component: GroupAnalysisCalenderComponent;
  let fixture: ComponentFixture<GroupAnalysisCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupAnalysisCalenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupAnalysisCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
