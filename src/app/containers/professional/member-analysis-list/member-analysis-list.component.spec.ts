import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberAnalysisListComponent } from './member-analysis-list.component';

describe('MemberAnalysisListComponent', () => {
  let component: MemberAnalysisListComponent;
  let fixture: ComponentFixture<MemberAnalysisListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberAnalysisListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberAnalysisListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
